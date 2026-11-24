
function CategoryFilter({ categorias, categoriaSeleccionada, onSeleccionar }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center" id="categorias">
      {categorias.map((categoria) => (
        <button
          key={categoria}
          onClick={() => onSeleccionar(categoria)}
          className={`px-5 py-2 rounded-full font-medium transition ${
            categoriaSeleccionada === categoria
              ? "bg-violet-800 text-white"
              : "bg-white text-violet-800 border border-violet-300 hover:bg-violet-100"
          }`}
        >
          {categoria}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
