# BookStore · Laboratorio 14

BookStore es una librería en línea que funciona en español y muestra sus precios en soles peruanos (S/). Continúa el proyecto del Laboratorio 13.

## Objetivo general

Ofrecer una tienda en línea para descubrir, comparar y comprar libros, con precios claros y un inventario que se actualiza al confirmar cada pedido.

## Objetivos específicos

- Facilitar la búsqueda de libros por título, autor, categoría, precio y disponibilidad.
- Permitir que la administración mantenga actualizados el catálogo, el stock y los descuentos.
- Mostrar el precio final de cada oferta y calcular el importe de la compra a partir de los precios vigentes.
- Recomendar lecturas relacionadas por autor o categoría.
- Mantener la tienda utilizable en computadoras, tablets y celulares.

## Público objetivo

Lectores en Perú, entre ellos estudiantes, docentes, profesionales y personas que buscan libros de literatura, ciencia, programación o tecnología. El panel de administración está destinado al personal de la librería.

## Funciones y arquitectura

| Área | Funcionalidad |
| --- | --- |
| Escaparate | Catálogo de libros con imagen, autor, categoría, precios y stock. Banner con una oferta destacada y sección de promociones. |
| Búsqueda | Búsqueda por título o autor, filtros combinables por categoría, rango de precio final y disponibilidad, orden ascendente o descendente y limpieza de filtros. |
| Administración | Alta, edición y baja de libros y categorías con el panel de Django. Cada libro admite un descuento entero de 0 a 100 %. El estado de pocas unidades corresponde a un stock de 1 a 3. |
| Compra | Carrito editable y confirmación con correo de contacto. La API guarda el pedido, recalcula su total y actualiza el stock en una transacción. Los reintentos con la misma referencia devuelven el pedido registrado. |
| Recomendaciones | Selección en el inicio y en el detalle a partir de libros en stock con el mismo autor o categoría, con prioridad para las coincidencias de autor. |

El Laboratorio 13 usaba React, Vite, Tailwind CSS y componentes de interfaz con shadcn/Base UI. El escaparate leía un catálogo en JavaScript. Django REST Framework ya ofrecía endpoints de solo lectura para categorías y productos. Esta entrega mantiene React, Vite y Tailwind, conecta el escaparate a la API y amplía los modelos de SQLite. El panel de Django conserva la gestión de categorías y productos y permite consultar pedidos y sus partidas.

La migración agrega autor y descuento a los productos existentes y crea las tablas de pedidos. Los libros anteriores mantienen sus campos y reciben autor vacío y descuento cero. La interfaz muestra «Autor por registrar» cuando falta ese dato. Cada partida conserva el título y el importe unitario aplicado aunque luego se elimine el libro. La confirmación registra el pedido localmente. El alcance del laboratorio abarca pedidos e inventario, sin procesamiento de pagos ni envío de correo.

## Ejecutar en Windows

Usa PowerShell, Python 3.12 o posterior y Node.js 22.12 o posterior. Desde la raíz del repositorio, con la rama `laboratorio-14` seleccionada, abre dos terminales.

**Terminal 1 · Django y SQLite**

```powershell
cd backend
py -3.12 -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py cargar_catalogo
.\venv\Scripts\python.exe manage.py createsuperuser
.\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Si usas una versión de Python posterior a 3.12, selecciónala con el lanzador `py`. El comando `cargar_catalogo` es opcional y agrega solo los títulos de ejemplo que falten. Si ya tienes un administrador, puedes usarlo para iniciar sesión. Conserva `backend/db.sqlite3` si ya tienes la base de datos del Laboratorio 13 y ejecuta `migrate` sobre ella. Puedes usar la variable `BOOKSTORE_DB` para indicar otra ruta de SQLite en una demostración aislada.

**Terminal 2 · React y Vite**

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

- Tienda en <http://localhost:5173/>
- Administración en <http://127.0.0.1:8000/admin/>
- API en <http://127.0.0.1:8000/api/>

Vite envía las solicitudes bajo `/api` al backend local. Para otras direcciones puedes usar `VITE_API_URL` y `VITE_ADMIN_URL`. Si las imágenes de Open Library no están disponibles, la tienda presenta una portada tipográfica con el título.

## Pruebas y evidencias para el informe

| Requisito | Cómo probarlo | Captura sugerida |
| --- | --- | --- |
| 1. Objetivos | Abre este README y revisa el objetivo general, los objetivos específicos, el público y las funciones. | Secciones correspondientes del README. |
| 2. Diseño adaptable | Abre la tienda y usa el modo adaptable del navegador a 390, 768 y 1440 px. Prueba menú, filtros y carrito. Comprueba que el contenido cabe en el ancho de la ventana. | Inicio y catálogo a 390 px, filtros a 768 px y catálogo a 1440 px. |
| 3. Inventario | En Administración → Productos, crea un libro de prueba con stock de 2. Edita su stock y verifica el cambio en el catálogo. Intenta agregar más unidades de las disponibles. Compra el stock restante y verifica el estado «Agotado». Elimina el libro de prueba y comprueba que su línea sigue en Administración → Pedidos. | Formulario de producto, aviso «Pocas unidades», confirmación con referencia y estado «Agotado». |
| 4. Catálogo y búsqueda | Busca Robert C. Martin y pulsa **Aplicar filtros**. Pulsa **Limpiar**. Combina Literatura, rango S/ 30–50, Con stock y Mayor precio. Abre **El principito** para revisar el detalle. | Resultados ordenados con filtros visibles y pantalla del detalle. |
| 5. Promociones | Con los datos de ejemplo, **Clean Code** tiene un 20 % de descuento sobre S/ 89.90. Agrégalo dos veces y verifica S/ 143.84 en el carrito y en la confirmación. Cambia el descuento desde el panel y recarga la tienda para comprobar el cambio. | Banner, tarjeta con ambos precios y porcentaje, carrito y confirmación por el importe descontado. |
| 6. Recomendaciones | Revisa **Lecturas recomendadas** en inicio. Abre **Clean Code** y verifica que su detalle recomienda **Clean Architecture** por autor y **JavaScript: The Good Parts** por categoría, mientras ambos tengan stock. | Sección de inicio y sección **Libros relacionados** en el detalle. |

Ejecuta las comprobaciones automatizadas desde cada carpeta.

```powershell
# Desde backend
.\venv\Scripts\python.exe manage.py test
.\venv\Scripts\python.exe manage.py makemigrations --check
```

```powershell
# Desde frontend
npm.cmd run lint
npm.cmd run build
```
