
const API_URL = "http://127.0.0.1:8000/api";

// Obtener todos los productos desde Django
export async function obtenerProductos() {
  const respuesta = await fetch(`${API_URL}/productos/`);

  if (!respuesta.ok) {
    throw new Error("No se pudieron obtener los productos");
  }

  return await respuesta.json();
}

// Obtener todas las categorías desde Django
export async function obtenerCategorias() {
  const respuesta = await fetch(`${API_URL}/categorias/`);

  if (!respuesta.ok) {
    throw new Error("No se pudieron obtener las categorías");
  }

  return await respuesta.json();
}
