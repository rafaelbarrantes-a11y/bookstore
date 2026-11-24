import { useState } from "react";

const precios = [
  ["minimo", "Precio mínimo"],
  ["maximo", "Precio máximo"],
];

export default function CategoryFilter({ categorias, filtros, aplicar }) {
  const [campos, setCampos] = useState(filtros);

  function campo(nombre) {
    return {
      name: nombre,
      value: campos[nombre] || "",
      onChange: (evento) => setCampos({ ...campos, [nombre]: evento.target.value }),
    };
  }

  return (
    <form className="filters" onSubmit={(evento) => {
      evento.preventDefault();
      aplicar({ ...campos });
    }} onReset={() => { setCampos({}); aplicar({}); }}>
      <label className="search">Buscar
        <input {...campo("buscar")} type="search" maxLength={150} placeholder="Título o autor" />
      </label>
      <label>Categoría
        <select {...campo("categoria")}>
          <option value="">Todas</option>
          {categorias.map(({ id, nombre }) => <option key={id} value={id}>{nombre}</option>)}
        </select>
      </label>
      {precios.map(([nombre, etiqueta]) => (
        <label key={nombre}>{etiqueta} (S/)
          <input {...campo(nombre)} type="number" min="0" max="99999999.99" step="0.01" placeholder="0.00" />
        </label>
      ))}
      <label>Disponibilidad
        <select {...campo("disponibilidad")}>
          <option value="">Todas</option><option value="disponible">Con stock</option>
          <option value="bajo">Pocas unidades</option><option value="agotado">Agotados</option>
        </select>
      </label>
      <label>Ordenar
        <select {...campo("orden")}>
          <option value="">Por título</option><option value="asc">Menor precio</option>
          <option value="desc">Mayor precio</option>
        </select>
      </label>
      <div className="filter-actions">
        <button className="button primary" type="submit">Aplicar filtros</button>
        <button className="button secondary" type="reset">Limpiar</button>
      </div>
    </form>
  );
}
