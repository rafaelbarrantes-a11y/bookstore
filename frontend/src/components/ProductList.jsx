import ProductCard from "./ProductCard";

export default function ProductList({ productos, agregar, vacio = "No encontramos libros con esos filtros." }) {
  if (!productos.length) return <p className="notice">{vacio}</p>;
  return (
    <div className="product-grid">
      {productos.map((libro) => <ProductCard key={libro.id} libro={libro} agregar={agregar} />)}
    </div>
  );
}
