from decimal import Decimal, ROUND_HALF_UP

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = "categoría"
        verbose_name_plural = "categorías"

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    UMBRAL_STOCK_BAJO = 3

    nombre = models.CharField(max_length=150, verbose_name="título")
    autor = models.CharField(max_length=150, blank=True)
    descripcion = models.TextField(verbose_name="descripción")
    precio = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    descuento = models.PositiveSmallIntegerField(
        default=0, validators=[MaxValueValidator(100)], verbose_name="descuento (%)"
    )
    imagen = models.URLField(blank=True, null=True)
    cantidad_disponible = models.PositiveIntegerField(default=0, verbose_name="unidades")
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name="productos",
        verbose_name="categoría",
    )

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(descuento__lte=100), name="descuento_hasta_100"),
        ]

    @property
    def precio_final(self):
        return (self.precio * (100 - self.descuento) / 100).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

    @property
    def disponibilidad(self):
        if self.cantidad_disponible == 0:
            return "agotado"
        if self.cantidad_disponible <= self.UMBRAL_STOCK_BAJO:
            return "bajo"
        return "disponible"

    def __str__(self):
        return self.nombre


class Pedido(models.Model):
    referencia = models.UUIDField(unique=True, editable=False)
    correo = models.EmailField(verbose_name="correo electrónico")
    creado = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    def __str__(self):
        return str(self.referencia)


class LineaPedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="lineas")
    producto = models.ForeignKey(Producto, null=True, on_delete=models.SET_NULL)
    producto_id_original = models.PositiveBigIntegerField()
    titulo = models.CharField(max_length=150)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
