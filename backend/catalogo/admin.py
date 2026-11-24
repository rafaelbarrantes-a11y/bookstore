from django.contrib import admin

from .models import Categoria, LineaPedido, Pedido, Producto


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "descripcion")
    search_fields = ("nombre",)


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "autor", "categoria", "precio", "descuento", "cantidad_disponible", "estado")
    list_filter = ("categoria",)
    search_fields = ("nombre", "autor")

    @admin.display(description="Disponibilidad")
    def estado(self, producto):
        return {
            "disponible": "Disponible",
            "bajo": "Pocas unidades",
            "agotado": "Agotado",
        }[producto.disponibilidad]


class LineaPedidoInline(admin.TabularInline):
    model = LineaPedido
    fields = ("titulo", "cantidad", "precio_unitario")
    readonly_fields = fields
    extra = 0
    can_delete = False


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ("referencia", "correo", "creado", "total")
    readonly_fields = list_display
    inlines = (LineaPedidoInline,)
    search_fields = ("referencia", "correo")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
