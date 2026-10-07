import { apiRequest } from "./api";


// ==========================================
// OBTENER PREFERENCIAS
// ==========================================

export function obtenerPreferenciasNotificacion(
  token
) {
  return apiRequest(
    "/api/notification-preferences",
    {
      method: "GET",
    },
    token
  );
}


// ==========================================
// ACTUALIZAR PREFERENCIAS
// ==========================================

export function actualizarPreferenciasNotificacion(
  preferencias,
  token
) {
  return apiRequest(
    "/api/notification-preferences",
    {
      method: "PUT",
      body: JSON.stringify(preferencias),
    },
    token
  );
}