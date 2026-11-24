from django.db import transaction
from django.db.models import Case, F, IntegerField, Q, Value, When
from django.db.models.functions import Cast, Round
from django.http import Http404
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import APIException, NotFound
from rest_framework.response import Response

from .models import Categoria, LineaPedido, Pedido, Producto
from .serializers import CategoriaSerializer, CompraSerializer, PedidoSerializer, ProductoSerializer


class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Categoria.objects.order_by("nombre", "pk")
    serializer_class = CategoriaSerializer


class FiltrosCatalogo(serializers.Serializer):
    buscar = serializers.CharField(required=False, allow_blank=True, max_length=150)
    categoria = serializers.IntegerField(required=False, min_value=1, max_value=2**63 - 1)
    minimo = serializers.DecimalField(required=False, min_value=0, max_digits=10, decimal_places=2)
    maximo = serializers.DecimalField(required=False, min_value=0, max_digits=10, decimal_places=2)
    disponibilidad = serializers.ChoiceField(
        choices=("disponible", "bajo", "agotado"), required=False
    )
    orden = serializers.ChoiceField(choices=("asc", "desc"), required=False)
    ofertas = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        if "minimo" in data and "maximo" in data and data["minimo"] > data["maximo"]:
            raise serializers.ValidationError("El precio mínimo debe ser menor o igual al máximo.")
        return data


class ProductoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Producto.objects.select_related("categoria").order_by("nombre", "pk")
    serializer_class = ProductoSerializer

    def get_object(self):
        try:
            return super().get_object()
        except Http404 as error:
            raise NotFound("El libro ya no está en el catálogo.") from error

    def get_queryset(self):
        productos = super().get_queryset()
        if self.action != "list":
            return productos

        filtros = FiltrosCatalogo(data=self.request.query_params)
        filtros.is_valid(raise_exception=True)
        datos = filtros.validated_data
        buscar = datos.get("buscar")
        if buscar:
            productos = productos.filter(Q(nombre__icontains=buscar) | Q(autor__icontains=buscar))
        if "categoria" in datos:
            productos = productos.filter(categoria_id=datos["categoria"])
        if datos.get("ofertas"):
            productos = productos.filter(descuento__gt=0, cantidad_disponible__gt=0)

        stock_bajo = Producto.UMBRAL_STOCK_BAJO
        disponibilidad = datos.get("disponibilidad")
        if disponibilidad == "disponible":
            productos = productos.filter(cantidad_disponible__gt=0)
        elif disponibilidad == "bajo":
            productos = productos.filter(cantidad_disponible__range=(1, stock_bajo))
        elif disponibilidad == "agotado":
            productos = productos.filter(cantidad_disponible=0)

        # SQLite usa división entera para estos operandos. El 50 redondea al céntimo más cercano.
        centimos = Cast(Round(F("precio") * 100), IntegerField())
        productos = productos.alias(centimos_finales=(centimos * (100 - F("descuento")) + 50) / 100)
        if "minimo" in datos:
            productos = productos.filter(centimos_finales__gte=int(datos["minimo"] * 100))
        if "maximo" in datos:
            productos = productos.filter(centimos_finales__lte=int(datos["maximo"] * 100))
        if "orden" in datos:
            orden = "centimos_finales" if datos["orden"] == "asc" else "-centimos_finales"
            productos = productos.order_by(orden, "nombre", "pk")
        return productos

    @action(detail=True, url_path="recomendados")
    def relacionados(self, request, pk=None):
        producto = self.get_object()
        coincidencias = Q(categoria_id=producto.categoria_id)
        prioridad = Value(0)
        if producto.autor.strip():
            mismo_autor = Q(autor__iexact=producto.autor)
            coincidencias |= mismo_autor
            prioridad = Case(When(mismo_autor, then=Value(0)), default=Value(1))

        libros = (
            self.get_queryset()
            .exclude(pk=producto.pk)
            .filter(coincidencias, cantidad_disponible__gt=0)
            .order_by(prioridad, "nombre", "pk")[:4]
        )
        return Response(self.get_serializer(libros, many=True).data)


class ConflictoCompra(APIException):
    status_code = status.HTTP_409_CONFLICT


@api_view(["POST"])
def confirmar_compra(request):
    compra = CompraSerializer(data=request.data)
    compra.is_valid(raise_exception=True)
    datos = compra.validated_data

    with transaction.atomic():
        pedido, creado = Pedido.objects.get_or_create(
            referencia=datos["referencia"], defaults={"correo": datos["correo"]}
        )
        if not creado:
            anterior = dict(pedido.lineas.values_list("producto_id_original", "cantidad"))
            actual = {item["producto"]: item["cantidad"] for item in datos["items"]}
            if pedido.correo != datos["correo"] or anterior != actual:
                raise ConflictoCompra("La referencia corresponde a otro pedido.")
            return Response(PedidoSerializer(pedido).data)

        for item in datos["items"]:
            cantidad = item["cantidad"]
            productos = Producto.objects.filter(pk=item["producto"])
            actualizado = productos.filter(cantidad_disponible__gte=cantidad).update(
                cantidad_disponible=F("cantidad_disponible") - cantidad
            )
            if not actualizado:
                producto = productos.first()
                if producto:
                    raise ConflictoCompra(f"Stock insuficiente para «{producto.nombre}».")
                raise ConflictoCompra("Un libro ya no está en el catálogo.")
            producto = productos.get()
            precio = producto.precio_final
            pedido.lineas.create(
                producto=producto, producto_id_original=producto.pk, titulo=producto.nombre,
                cantidad=cantidad, precio_unitario=precio,
            )
            pedido.total += precio * cantidad
        if "total_esperado" in datos and datos["total_esperado"] != pedido.total:
            raise ConflictoCompra("El total cambió. Revisa el precio actualizado antes de confirmar.")
        pedido.save(update_fields=["total"])

    return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)
