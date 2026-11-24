
import ProductCard from "./ProductCard";

function ProductList({ productos }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {productos.map((producto) => (
        <ProductCard
          key={producto.id}
          nombre={producto.nombre}
          descripcion={producto.descripcion}
          precio={producto.precio}
          imagen={producto.imagen}
          categoria={producto.categoria}
        />
      ))}
    </div>
  );
}

export default ProductList;
