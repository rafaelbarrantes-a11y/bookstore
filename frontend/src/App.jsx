import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Tag } from "lucide-react";
import Header from "./components/Header";
import Cart from "./components/Cart";
import ProductList from "./components/ProductList";
import CategoryFilter from "./components/CategoryFilter";
import { Disponibilidad, Portada, Precio } from "./components/ProductCard";
import { adminUrl, obtenerCategorias, obtenerProducto, obtenerProductos, obtenerRecomendados } from "./services/api";
import "./App.css";

const SIN_FILTROS = {};
const FILTRO_OFERTAS = { ofertas: true };

function useConsulta(cargar, parametro, revision = 0) {
  const [resultado, setResultado] = useState({});
  useEffect(() => {
    const controller = new AbortController();
    const guardar = (consulta) => {
      if (!controller.signal.aborted) setResultado({ parametro, revision, consulta });
    };
    cargar(parametro, controller.signal)
      .then((datos) => guardar({ datos }))
      .catch((error) => guardar({ error: error.message }));
    return () => controller.abort();
  }, [cargar, parametro, revision]);

  return resultado.parametro === parametro && resultado.revision === revision
    ? resultado.consulta
    : {};
}

function Resultados({ consulta, agregar, vacio }) {
  if (consulta.error) return <p className="notice error" role="alert">{consulta.error}</p>;
  if (!consulta.datos) return <p className="notice" role="status">Cargando libros…</p>;
  return <ProductList productos={consulta.datos} agregar={agregar} vacio={vacio} />;
}

function Detalle({ id, agregar, revision }) {
  const detalle = useConsulta(obtenerProducto, id, revision);
  const relacionados = useConsulta(obtenerRecomendados, id, revision);
  const libro = detalle.datos;
  return (
    <div className="container detail-page">
      <a className="back-link" href="#catalogo">← Volver al catálogo</a>
      {!libro ? <p className="notice" role="status">{detalle.error || "Cargando libro…"}</p> : (
        <article className="detail">
          <Portada libro={libro} />
          <div>
            <p className="category">{libro.categoria_nombre}</p>
            <h1>{libro.nombre}</h1>
            <p className="author">{libro.autor || "Autor por registrar"}</p>
            <Disponibilidad libro={libro} />
            <Precio libro={libro} />
            <p className="description">{libro.descripcion}</p>
            <button className="button primary" type="button" disabled={!libro.cantidad_disponible}
              onClick={() => agregar(libro)}>Agregar al carrito</button>
          </div>
        </article>
      )}
      {libro && <section className="section">
        <h2>Libros relacionados</h2>
        <Resultados consulta={relacionados} agregar={agregar} vacio="No hay libros relacionados disponibles." />
      </section>}
    </div>
  );
}

function Seleccion({ libro, revision, agregar }) {
  const consulta = useConsulta(obtenerRecomendados, libro.id, revision);
  return <>
    <p className="section-intro">Por autor o categoría de <a href={`#libro/${libro.id}`}>{libro.nombre}</a>.</p>
    <Resultados consulta={consulta} agregar={agregar} vacio="No hay libros relacionados disponibles." />
  </>;
}

function Inicio({ catalogo, filtros, aplicar, revision, agregar }) {
  const categorias = useConsulta(obtenerCategorias, null, revision);
  const ofertas = useConsulta(obtenerProductos, FILTRO_OFERTAS, revision);
  const filtrado = useConsulta(obtenerProductos, filtros, revision);
  const destacados = ofertas.datos || [];
  const referencia = destacados[0] || catalogo.datos?.find((libro) => libro.cantidad_disponible > 0);

  return (
    <div className="container">
      <section id="inicio" className="hero">
        <div>
          <h1>Encuentra tu <em>próximo libro.</em></h1>
          <p>Explora historias, descubre nuevos autores y encuentra ofertas en tus próximas lecturas.</p>
          <div className="hero-actions">
            <a href="#catalogo" className="button primary">Explorar catálogo <ArrowRight size={17} aria-hidden="true" /></a>
            <a href="#ofertas" className="button secondary"><Tag size={16} aria-hidden="true" /> Ver ofertas</a>
          </div>
        </div>
        {destacados[0] ? (
          <a href={`#libro/${destacados[0].id}`} className="hero-feature">
            <Portada libro={destacados[0]} />
            <div><small>Oferta destacada</small><strong>{destacados[0].nombre}</strong><Precio libro={destacados[0]} /></div>
          </a>
        ) : <BookOpen className="hero-icon" size={100} strokeWidth={1} aria-hidden="true" />}
      </section>
      <section id="ofertas" className="section">
        <h2>Ofertas y promociones</h2>
        <Resultados consulta={ofertas} agregar={agregar} vacio="Actualmente no hay ofertas disponibles." />
      </section>
      <section id="catalogo" className="section">
        <h2>Nuestro catálogo</h2>
        {categorias.error && <p className="notice error" role="alert">{categorias.error}</p>}
        <CategoryFilter categorias={categorias.datos || []} aplicar={aplicar} filtros={filtros} />
        {filtrado.datos && <p className="results" role="status">Resultados: {filtrado.datos.length}</p>}
        <Resultados consulta={filtrado} agregar={agregar} />
      </section>
      <section id="recomendados" className="section">
        <h2>Lecturas recomendadas</h2>
        {referencia ? <Seleccion libro={referencia} revision={revision} agregar={agregar} /> : (
          <p className="notice">{catalogo.error || (catalogo.datos ? "No hay libros disponibles." : "Cargando recomendaciones…")}</p>
        )}
      </section>
    </div>
  );
}

export default function App() {
  const [ruta, setRuta] = useState(window.location.hash);
  const [carrito, setCarrito] = useState({});
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [revision, setRevision] = useState(0);
  const [aviso, setAviso] = useState(null);
  const recargar = () => setRevision((anterior) => anterior + 1);
  const catalogo = useConsulta(obtenerProductos, SIN_FILTROS, revision);
  const id = /^#libro\/(\d+)$/.exec(ruta)?.[1];

  useEffect(() => {
    const cambiarRuta = () => setRuta(window.location.hash);
    window.addEventListener("hashchange", cambiarRuta);
    return () => window.removeEventListener("hashchange", cambiarRuta);
  }, []);

  useEffect(() => {
    const seccion = document.getElementById(ruta.slice(1));
    if (seccion) seccion.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [ruta]);

  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  function actualizar(id, cantidad) {
    setCarrito((anterior) => {
      const proximo = { ...anterior };
      if (cantidad > 0) proximo[id] = cantidad;
      else delete proximo[id];
      return proximo;
    });
  }

  function completar(items) {
    setCarrito((anterior) => {
      const proximo = { ...anterior };
      for (const { producto, cantidad } of items) {
        const restante = (proximo[producto] || 0) - cantidad;
        if (restante > 0) proximo[producto] = restante;
        else delete proximo[producto];
      }
      return proximo;
    });
    recargar();
  }

  function agregar(libro) {
    const cantidad = carrito[libro.id] || 0;
    if (cantidad >= Math.min(999, libro.cantidad_disponible)) {
      setAviso({ texto: `No puedes agregar más unidades de «${libro.nombre}».` });
      return;
    }
    if (!cantidad && Object.keys(carrito).length >= 100) {
      setAviso({ texto: "Puedes agregar hasta 100 libros distintos por pedido." });
      return;
    }
    actualizar(libro.id, cantidad + 1);
    setAviso({ texto: `«${libro.nombre}» agregado al carrito.` });
  }

  return (
    <>
      <Header cantidad={Object.values(carrito).reduce((suma, cantidad) => suma + cantidad, 0)} />
      <main>
        {id ? <Detalle key={id} id={id} agregar={agregar} revision={revision} /> : (
          <Inicio filtros={filtros} aplicar={setFiltros} catalogo={catalogo} revision={revision} agregar={agregar} />
        )}
        <div className="container">
          {catalogo.error && <p className="notice error" role="alert">{catalogo.error} <button onClick={recargar}>Reintentar</button></p>}
          <Cart carrito={carrito} libros={catalogo.datos} actualizar={actualizar} recargar={recargar}
            completar={completar} />
        </div>
      </main>
      <footer><div className="container footer-inner"><span>BookStore</span><a href={adminUrl}>Administración</a></div></footer>
      <div role="status" aria-live="polite">{aviso && <p className="toast">{aviso.texto}</p>}</div>
    </>
  );
}
