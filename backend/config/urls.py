
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from catalogo.views import CategoriaViewSet, ProductoViewSet, confirmar_compra


router = DefaultRouter()

router.register(
    r'categorias',
    CategoriaViewSet,
    basename='categoria'
)

router.register(
    r'productos',
    ProductoViewSet,
    basename='producto'
)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/compras/', confirmar_compra, name='confirmar-compra'),
    path('api/', include(router.urls)),
]
