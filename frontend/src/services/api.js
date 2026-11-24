const API_URL = import.meta.env.VITE_API_URL || "/api";

export const adminUrl = import.meta.env.VITE_ADMIN_URL || "http://127.0.0.1:8000/admin/";

function primerMensaje(datos) {
  if (typeof datos === "string") return datos;
  if (!datos || typeof datos !== "object") return "";
  return Object.values(datos).map(primerMensaje).find(Boolean);
}

async function consultar(ruta, opciones) {
  const respuesta = await fetch(`${API_URL}${ruta}`, opciones);
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null);
    const error = new Error(primerMensaje(datos) || "No se pudo completar la solicitud.");
    error.estado = respuesta.status;
    throw error;
  }
  return respuesta.json();
}

export function obtenerProductos(filtros = {}, signal) {
  const parametros = new URLSearchParams(
    Object.entries(filtros).filter(([, valor]) => valor !== "")
  );
  return consultar(`/productos/?${parametros}`, { signal });
}

export function obtenerCategorias(_parametro, signal) {
  return consultar("/categorias/", { signal });
}

export function obtenerProducto(id, signal) {
  return consultar(`/productos/${id}/`, { signal });
}

export function obtenerRecomendados(id, signal) {
  return consultar(`/productos/${id}/recomendados/`, { signal });
}

export function confirmarCompra(pedido) {
  return consultar("/compras/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
  });
}
