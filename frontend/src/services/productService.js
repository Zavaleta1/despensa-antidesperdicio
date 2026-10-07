import { apiRequest } from "./api";

export function obtenerProductos(token) {
  return apiRequest(
    "/api/products",
    {
      method: "GET",
    },
    token
  );
}

export function obtenerCategorias() {
  return apiRequest("/api/categories", {
    method: "GET",
  });
}

export function crearProducto(producto, token) {
  return apiRequest(
    "/api/products",
    {
      method: "POST",
      body: JSON.stringify(producto),
    },
    token
  );
}

export function actualizarProducto(id, producto, token) {
  return apiRequest(
    `/api/products/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(producto),
    },
    token
  );
}

export function eliminarProducto(id, token) {
  return apiRequest(
    `/api/products/${id}`,
    {
      method: "DELETE",
    },
    token
  );
}