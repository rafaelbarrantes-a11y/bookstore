
from rest_framework import serializers
from .models import Categoria, Pedido, Producto


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    precio_final = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    disponibilidad = serializers.CharField(read_only=True)
    categoria_nombre = serializers.CharField(
        source='categoria.nombre',
        read_only=True
    )

    class Meta:
        model = Producto
        fields = '__all__'


class ItemCompraSerializer(serializers.Serializer):
    producto = serializers.IntegerField(min_value=1, max_value=2**63 - 1)
    cantidad = serializers.IntegerField(min_value=1, max_value=999)


class CompraSerializer(serializers.Serializer):
    referencia = serializers.UUIDField()
    correo = serializers.EmailField(max_length=254)
    total_esperado = serializers.DecimalField(max_digits=18, decimal_places=2, min_value=0, required=False)
    items = ItemCompraSerializer(many=True, allow_empty=False, max_length=100)

    def validate_items(self, items):
        ids = {item["producto"] for item in items}
        if len(ids) != len(items):
            raise serializers.ValidationError("Cada libro debe aparecer una sola vez.")
        return items


class PedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = ("referencia", "total")
