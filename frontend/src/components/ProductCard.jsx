import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { soles } from "../lib/moneda";

const estados = {
  disponible: "Disponible",
  bajo: "Pocas unidades",
  agotado: "Agotado",
};


export function Portada({ libro }) {
  const [imagenFallida, setImagenFallida] = useState(null);
  return (
    <div className="cover">
      {libro.imagen && imagenFallida !== libro.imagen ? (
        <img
          src={libro.imagen} alt={`Portada de ${libro.nombre}`} loading="lazy"
          onError={() => setImagenFallida(libro.imagen)}
        />
      ) : (
        <span className="cover-fallback"><BookOpen aria-hidden="true" />{libro.nombre}</span>
      )}
    </div>
  );
}

export function Precio({ libro }) {
  return (
    <div className="price">
      <strong>{soles(libro.precio_final)}</strong>
      {libro.descuento > 0 && (
        <><del aria-label="Precio original">{soles(libro.precio)}</del><span className="discount">−{libro.descuento}%</span></>
      )}
    </div>
  );
}

export function Disponibilidad({ libro }) {
  return (
    <p className={`availability ${libro.disponibilidad}`}>
      {estados[libro.disponibilidad]}
      {libro.disponibilidad === "bajo" && ` · ${libro.cantidad_disponible} en stock`}
    </p>
  );
}

export default function ProductCard({ libro, agregar }) {
  return (
    <article className="product">
      <a href={`#libro/${libro.id}`} aria-label={`Ver ${libro.nombre}`}><Portada libro={libro} /></a>
      <div className="product-body">
        <p className="category">{libro.categoria_nombre}</p>
        <h3><a href={`#libro/${libro.id}`}>{libro.nombre}</a></h3>
        <p className="author">{libro.autor || "Autor por registrar"}</p>
        <Disponibilidad libro={libro} />
        <Precio libro={libro} />
        <div className="product-actions">
          <a className="button secondary" href={`#libro/${libro.id}`}>Ver libro</a>
          <button className="button primary" disabled={!libro.cantidad_disponible}
            onClick={() => agregar(libro)} aria-label={`Agregar ${libro.nombre} al carrito`}
            title="Agregar al carrito"><Plus size={18} aria-hidden="true" /></button>
        </div>
      </div>
    </article>
  );
}
