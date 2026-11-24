import { useRef, useState } from "react";
import { confirmarCompra } from "../services/api";
import { soles } from "../lib/moneda";

export default function Cart({ carrito, libros, actualizar, completar, recargar }) {
  const [estado, setEstado] = useState({ enviando: false, error: "", pedido: null });
  const intento = useRef(null);
  const filas = Object.entries(carrito).map(([id, cantidad]) => ({
    id, cantidad, libro: libros?.find((libro) => libro.id === Number(id)),
  }));
  const total = filas.reduce((suma, { libro, cantidad }) => (
    suma + (libro ? Math.round(Number(libro.precio_final) * 100) * cantidad : 0)
  ), 0);
  const excedeStock = !libros || filas.some(({ libro, cantidad }) => !libro || cantidad > libro.cantidad_disponible);

  async function comprar(evento) {
    evento.preventDefault();
    const correo = new FormData(evento.currentTarget).get("correo");
    const items = filas.map(({ id, cantidad }) => ({ producto: Number(id), cantidad }));
    const clave = JSON.stringify({ correo, items });
    if (intento.current?.clave !== clave) {
      intento.current = { clave, referencia: crypto.randomUUID() };
    }
    setEstado({ enviando: true, error: "", pedido: null });
    try {
      const pedido = await confirmarCompra({
        referencia: intento.current.referencia, correo, items, total_esperado: (total / 100).toFixed(2),
      });
      intento.current = null;
      setEstado({ enviando: false, error: "", pedido });
      completar(items);
    } catch (error) {
      setEstado({ enviando: false, error: error.message, pedido: null });
      if (error.estado === 409) recargar();
    }
  }

  return (
    <section id="carrito" className="section">
      <h2>Tu carrito</h2>
      {estado.pedido && (
        <div className="notice success" role="status">
          <strong>Pedido confirmado por {soles(estado.pedido.total)}</strong>
          <p>Referencia {estado.pedido.referencia}</p>
        </div>
      )}
      {filas.length === 0 ? <p className="notice">Tu carrito está vacío.</p> : (
        <form className="cart" onSubmit={comprar}>
          <fieldset disabled={estado.enviando}>
            <legend className="sr-only">Resumen del pedido</legend>
            {filas.map(({ id, cantidad, libro }) => (
              <div className="cart-row" key={id}>
                <div>
                  <strong>{libro?.nombre || (libros ? "Libro retirado" : "Actualizando catálogo…")}</strong>
                  {libro && <p>{soles(libro.precio_final)} por unidad</p>}
                  {libros && (!libro || cantidad > libro.cantidad_disponible) && (
                    <p className="error">Stock disponible: {libro?.cantidad_disponible || 0}.</p>
                  )}
                </div>
                {libro?.cantidad_disponible > 0 && (
                  <div className="quantity" aria-label={`Cantidad de ${libro.nombre}`}>
                    <button type="button" onClick={() => actualizar(id, cantidad - 1)} disabled={cantidad <= 1}
                      aria-label={`Reducir cantidad de ${libro.nombre}`}>−</button>
                    <output aria-label="Cantidad">{cantidad}</output>
                    <button type="button" onClick={() => actualizar(id, cantidad + 1)}
                      disabled={cantidad >= Math.min(999, libro.cantidad_disponible)}
                      aria-label={`Aumentar cantidad de ${libro.nombre}`}>+</button>
                  </div>
                )}
                <button className="button secondary" type="button" onClick={() => actualizar(id, 0)}>Quitar</button>
              </div>
            ))}
            <div className="checkout">
              <p><strong>{libros ? `Total ${soles(total / 100)}` : "Actualizando total…"}</strong></p>
              <label>Correo electrónico<input type="email" name="correo" autoComplete="email" required maxLength={254} /></label>
              <button className="button primary" type="submit" disabled={excedeStock}>
                {estado.enviando ? "Confirmando…" : "Confirmar compra"}
              </button>
            </div>
          </fieldset>
          {estado.error && <p className="notice error" role="alert">{estado.error}</p>}
        </form>
      )}
    </section>
  );
}
