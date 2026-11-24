
import { useState } from "react";
import Header from "./components/Header";
import ProductList from "./components/ProductList";
import CategoryFilter from "./components/CategoryFilter";
import products from "./data/products";

function App() {
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Todos");

  const categorias = [
    "Todos",
    ...new Set(products.map((producto) => producto.categoria)),
  ];

  const productosFiltrados =
    categoriaSeleccionada === "Todos"
      ? products
      : products.filter(
          (producto) => producto.categoria === categoriaSeleccionada
        );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900">
            Encuentra tu próximo libro
          </h2>

          <p className="text-gray-600 mt-3">
            Explora nuestra colección de libros y descubre nuevas historias.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">
            Categorías
          </h2>

          <CategoryFilter
            categorias={categorias}
            categoriaSeleccionada={categoriaSeleccionada}
            onSeleccionar={setCategoriaSeleccionada}
          />
        </section>

        <section id="catalogo">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Nuestro catálogo
          </h2>

          <ProductList productos={productosFiltrados} />
        </section>
      </main>

      <footer className="bg-violet-900 text-white text-center p-6 mt-12">
        © 2026 BookStore - Todos los derechos reservados.
      </footer>
    </div>
  );
}

export default App;
