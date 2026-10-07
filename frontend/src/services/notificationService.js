import { apiRequest } from "./api";


// ==========================================
// OBTENER NOTIFICACIONES
// ==========================================

export function obtenerNotificaciones(token) {
  return apiRequest(
    "/api/notifications",
    {
      method: "GET",
    },
    token
  );
}


// ==========================================
// MARCAR UNA NOTIFICACIÓN COMO LEÍDA
// ==========================================

export function marcarNotificacionLeida(
  id,
  token
) {
  return apiRequest(
    `/api/notifications/${id}/read`,
    {
      method: "PUT",
    },
    token
  );
}


// ==========================================
// MARCAR TODAS COMO LEÍDAS
// ==========================================

export function marcarTodasNotificacionesLeidas(
  token
) {
  return apiRequest(
    "/api/notifications/read-all",
    {
      method: "PUT",
    },
    token
  );
}