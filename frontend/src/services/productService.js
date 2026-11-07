
import { apiRequest } from "./api";

// ==========================================
// OBTENER PRODUCTOS
// ==========================================

export function obtenerProductos(token) {
  return apiRequest(
    "/api/products",
    {
      method: "GET",
    },
    token
  );
}

// ==========================================
// OBTENER CATEGORÍAS
// ==========================================

export function obtenerCategorias() {
  return apiRequest("/api/categories", {
    method: "GET",
  });
}

// ==========================================
// CREAR PRODUCTO
// ==========================================

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

// ==========================================
// ACTUALIZAR PRODUCTO
// ==========================================

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

// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

export function eliminarProducto(id, token) {
  return apiRequest(
    `/api/products/${id}`,
    {
      method: "DELETE",
    },
    token
  );
}

// ==========================================
// REGISTRAR CONSUMO O DESPERDICIO
// ==========================================

export function registrarMovimientoProducto(
  id,
  tipo,
  cantidad,
  token
) {
  return apiRequest(
    `/api/products/${id}/movements`,
    {
      method: "POST",
      body: JSON.stringify({
        movement_type: tipo,
        quantity: cantidad,
      }),
    },
    token
  );
}

// ==========================================
// OBTENER HISTORIAL DE MOVIMIENTOS
// ==========================================

export function obtenerHistorialMovimientos(token) {
  return apiRequest(
    "/api/products/movements/history",
    {
      method: "GET",
    },
    token
  );
}

// ==========================================
// OBTENER HISTORIAL DE AUDITORÍA
// ==========================================

export function obtenerHistorialAuditoria(token) {
  return apiRequest(
    "/api/products/audit/history",
    {
      method: "GET",
    },
    token
  );
}
