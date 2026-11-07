
export const API_URL =
  import.meta.env.VITE_API_URL || "";

// ==========================================
// CONTROL DE SESIÓN INVALIDADA
// ==========================================

let sesionInvalidadaNotificada = false;

export function reiniciarAvisoSesion() {
  sesionInvalidadaNotificada = false;
}

// ==========================================
// PETICIONES HTTP
// ==========================================

export async function apiRequest(
  endpoint,
  options = {},
  token = null
) {
  const headers = {
    ...(options.body
      ? { "Content-Type": "application/json" }
      : {}),
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // ==========================================
  // DETECTAR SESIÓN INVALIDADA
  // ==========================================

  if (response.status === 401 && token) {
    const tokenActual =
      localStorage.getItem("token");

    // Solo invalidar si el JWT rechazado
    // pertenece a la sesión actual.
    if (tokenActual === token) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      if (!sesionInvalidadaNotificada) {
        sesionInvalidadaNotificada = true;

        window.dispatchEvent(
          new CustomEvent("sesion-invalidada", {
            detail: {
              message:
                "Tu sesión ha expirado o fue invalidada. Inicia sesión nuevamente.",
            },
          })
        );
      }
    }
  }

  // ==========================================
  // MANEJO GENERAL DE ERRORES
  // ==========================================

  if (!response.ok) {
    const error = new Error(
      data?.message || "Error en la solicitud"
    );

    error.status = response.status;
    throw error;
  }

  return data;
}
