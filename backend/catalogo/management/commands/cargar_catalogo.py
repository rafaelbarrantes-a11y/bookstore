from django.core.management.base import BaseCommand
from django.db import transaction

from catalogo.models import Categoria, Producto


LIBROS = (
    ("Clean Code", "Robert C. Martin", "Programación", "89.90", 20, 8, "9780132350884",
     "Manual de buenas prácticas para escribir código que otras personas puedan leer y mantener."),
    ("JavaScript: The Good Parts", "Douglas Crockford", "Programación", "65.00", 0, 2,
     "9780596517748", "Conceptos fundamentales del lenguaje JavaScript."),
    ("El principito", "Antoine de Saint-Exupéry", "Literatura", "39.90", 15, 12,
     "9780156012195", "Una historia clásica sobre la amistad y la vida."),
    ("Breve historia del tiempo", "Stephen Hawking", "Ciencia", "55.00", 0, 0,
     "9780553380163", "Una introducción al universo y sus misterios."),
    ("Python para todos", "Charles Severance", "Tecnología", "72.50", 10, 9,
     "9781492339243", "Una introducción práctica a la programación con Python."),
    ("Don Quijote de la Mancha", "Miguel de Cervantes", "Literatura", "49.90", 0, 5,
     "9788491050297", "Una de las obras más importantes de la literatura."),
    ("Clean Architecture", "Robert C. Martin", "Tecnología", "99.90", 0, 3,
     "9780134494166", "Principios para diseñar sistemas fáciles de mantener."),
    ("El universo en una cáscara de nuez", "Stephen Hawking", "Ciencia", "68.00", 25, 4,
     "9780553802023", "Un recorrido por los conceptos de la física moderna."),
)


class Command(BaseCommand):
    help = "Agrega el catálogo de demostración y conserva los libros que ya existen."

    @transaction.atomic
    def handle(self, *args, **options):
        agregados = 0
        for titulo, autor, nombre_categoria, precio, descuento, stock, isbn, descripcion in LIBROS:
            if Producto.objects.filter(nombre__iexact=titulo).exists():
                continue
            categoria = Categoria.objects.filter(nombre__iexact=nombre_categoria).order_by("pk").first()
            if categoria is None:
                categoria = Categoria.objects.create(nombre=nombre_categoria)
            Producto.objects.create(
                nombre=titulo, autor=autor, categoria=categoria, precio=precio,
                descuento=descuento, cantidad_disponible=stock, descripcion=descripcion,
                imagen=f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false",
            )
            agregados += 1
        self.stdout.write(self.style.SUCCESS(f"Libros agregados: {agregados}."))
