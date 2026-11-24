
function Header() {
  return (
    <header className="bg-[#39246D] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <a href="#" className="flex items-center gap-3">
          <div className="bg-white text-[#39246D] p-3 rounded-xl">
            <span className="text-2xl">📚</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold">BookStore</h1>
            <p className="text-purple-200 text-sm">
              Tu próxima lectura comienza aquí
            </p>
          </div>
        </a>

        <nav className="flex gap-6 text-sm font-medium">
          <a href="#" className="hover:text-purple-200">Inicio</a>
          <a href="#catalogo" className="hover:text-purple-200">Catálogo</a>
          <a href="#categorias" className="hover:text-purple-200">Categorías</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
