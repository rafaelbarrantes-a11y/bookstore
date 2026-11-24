from decimal import Decimal
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Categoria, Pedido, Producto


class TiendaTests(APITestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Literatura")
        self.otra = Categoria.objects.create(nombre="Ciencia")
        self.libro = self.crear_libro("Lectura principal", "Autora Uno", self.categoria, "39.90", 15, 2)
        self.mismo_autor = self.crear_libro("Otro título", "Autora Uno", self.otra, "50.00", 50, 10)
        self.misma_categoria = self.crear_libro("Segunda lectura", "Autora Dos", self.categoria, "60.00", 0, 8)
        self.agotado = self.crear_libro("Sin stock", "Autora Uno", self.categoria, "10.00", 5, 0)

    def crear_libro(self, nombre, autor, categoria, precio, descuento, stock):
        return Producto.objects.create(
            nombre=nombre, autor=autor, categoria=categoria, precio=precio,
            descuento=descuento, cantidad_disponible=stock,
        )

    def comprar(self, items, referencia=None, **datos):
        return self.client.post(reverse("confirmar-compra"), {
            "correo": "lector@example.com", "referencia": referencia or str(uuid4()),
            "items": [{"producto": libro.pk, "cantidad": cantidad} for libro, cantidad in items],
            **datos,
        }, format="json")

    def listar(self, **filtros):
        respuesta = self.client.get(reverse("producto-list"), filtros)
        self.assertEqual(respuesta.status_code, 200)
        return respuesta.json()

    def test_catalogo_y_detalle(self):
        self.assertEqual([libro["id"] for libro in self.listar(buscar="autora uno", orden="asc")],
                         [self.agotado.pk, self.mismo_autor.pk, self.libro.pk])
        self.assertEqual([libro["id"] for libro in self.listar(buscar="principal")], [self.libro.pk])
        self.assertEqual([libro["id"] for libro in self.listar(categoria=self.categoria.pk,
                         disponibilidad="bajo", minimo="33.92", maximo="33.92")], [self.libro.pk])
        self.assertEqual(self.listar(maximo="33.91", disponibilidad="bajo"), [])
        self.assertEqual([libro["id"] for libro in self.listar(ofertas="true", orden="desc")],
                         [self.libro.pk, self.mismo_autor.pk])
        self.assertEqual([libro["id"] for libro in self.listar(disponibilidad="agotado")],
                         [self.agotado.pk])
        detalle = self.client.get(reverse("producto-detail", args=[self.libro.pk])).json()
        self.assertEqual((detalle["precio_final"], detalle["disponibilidad"]), ("33.92", "bajo"))
        self.assertEqual(self.client.get(reverse("producto-list"), {"minimo": 8, "maximo": 5}).status_code, 400)

    def test_recomendaciones_por_autor_y_categoria(self):
        respuesta = self.client.get(reverse("producto-relacionados", args=[self.libro.pk]))
        self.assertEqual([libro["id"] for libro in respuesta.json()],
                         [self.mismo_autor.pk, self.misma_categoria.pk])

    def test_compra_descontada_y_reintento(self):
        referencia = str(uuid4())
        items = [(self.libro, 2), (self.mismo_autor, 1)]
        primero = self.comprar(items, referencia, total_esperado="92.84")
        self.assertEqual(primero.status_code, 201)
        self.assertEqual(primero.json()["total"], "92.84")
        self.assertEqual(self.comprar(items, referencia).json(), primero.json())
        self.assertEqual(self.comprar([(self.libro, 1)], referencia).status_code, 409)
        self.libro.refresh_from_db()
        self.assertEqual(self.libro.cantidad_disponible, 0)
        self.assertEqual(Pedido.objects.count(), 1)
        self.assertEqual(self.comprar([(self.libro, 1)]).status_code, 409)

    def test_compra_rechazada_revierte_todo(self):
        self.assertEqual(self.comprar([(self.libro, 1), (self.agotado, 1)]).status_code, 409)
        self.assertEqual(self.comprar([(self.libro, 1)], total_esperado="1.00").status_code, 409)
        self.assertEqual(self.comprar([(self.libro, 0)]).status_code, 400)
        self.assertEqual(self.comprar([(self.libro, 1), (self.libro, 1)]).status_code, 400)
        self.libro.refresh_from_db()
        self.assertEqual(self.libro.cantidad_disponible, 2)
        self.assertFalse(Pedido.objects.exists())

    def test_baja_conserva_historial(self):
        self.assertEqual(self.comprar([(self.libro, 1)]).status_code, 201)
        self.libro.delete()
        linea = Pedido.objects.get().lineas.get()
        self.assertIsNone(linea.producto)
        self.assertEqual((linea.titulo, linea.precio_unitario), ("Lectura principal", Decimal("33.92")))


class AdministracionTests(TestCase):
    def test_alta_edicion_validacion_y_baja(self):
        user = get_user_model().objects.create_superuser("biblioteca", password="clave-de-prueba")
        self.client.force_login(user)
        categoria = Categoria.objects.create(nombre="Historia")
        datos = {
            "nombre": "Libro de prueba", "autor": "Autora", "descripcion": "Descripción.",
            "categoria": categoria.pk, "precio": "60.00", "descuento": 10, "cantidad_disponible": 3,
        }
        alta = reverse("admin:catalogo_producto_add")
        self.assertEqual(self.client.post(alta, {**datos, "descuento": 101}).status_code, 200)
        self.assertFalse(Producto.objects.exists())
        self.assertEqual(self.client.post(alta, datos).status_code, 302)
        libro = Producto.objects.get()
        self.assertEqual(self.client.post(reverse("admin:catalogo_producto_change", args=[libro.pk]),
                                         {**datos, "cantidad_disponible": 7}).status_code, 302)
        libro.refresh_from_db()
        self.assertEqual(libro.cantidad_disponible, 7)
        self.assertEqual(self.client.post(reverse("admin:catalogo_producto_delete", args=[libro.pk]),
                                         {"post": "yes"}).status_code, 302)
        self.assertFalse(Producto.objects.exists())

    def test_datos_de_ejemplo_conservan_registros_existentes(self):
        categoria = Categoria.objects.create(nombre="Propia")
        existente = Producto.objects.create(
            nombre="Clean Code", categoria=categoria, precio="10.00", cantidad_disponible=4,
        )
        call_command("cargar_catalogo")
        call_command("cargar_catalogo")
        existente.refresh_from_db()
        self.assertEqual((existente.precio, existente.cantidad_disponible), (Decimal("10.00"), 4))
        self.assertEqual(Producto.objects.count(), 8)
