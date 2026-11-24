import { BookOpen, ShoppingBag } from "lucide-react";

export default function Header({ cantidad }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="#inicio">
          <span className="brand-icon"><BookOpen size={20} aria-hidden="true" /></span>
          BookStore
        </a>
        <nav aria-label="Navegación principal">
          <a href="#catalogo">Catálogo</a>
          <a href="#ofertas">Ofertas</a>
          <a href="#recomendados">Recomendados</a>
        </nav>
        <a className="cart-link" href="#carrito">
          <ShoppingBag size={17} aria-hidden="true" /> Carrito <span>{cantidad}</span>
        </a>
      </div>
    </header>
  );
}
