
import { apiRequest } from "./api";

// ==========================================
// OBTENER PERFIL
// GET /api/profile
// ==========================================

export function obtenerPerfil(token) {
  return apiRequest(
    "/api/profile",
    { method: "GET" },
    token
  );
}

// ==========================================
// ACTUALIZAR NOMBRE
// PUT /api/profile
// ==========================================

export function actualizarPerfil(name, token) {
  return apiRequest(
    "/api/profile",
    {
      method: "PUT",
      body: JSON.stringify({ name }),
    },
    token
  );
}

// ==========================================
// CAMBIAR CONTRASEÑA
// PUT /api/profile/password
// ==========================================

export function cambiarContrasena(
  currentPassword,
  newPassword,
  token
) {
  return apiRequest(
    "/api/profile/password",
    {
      method: "PUT",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    },
    token
  );
}

// ==========================================
// OBTENER FOTOGRAFÍA
// GET /api/profile/photo
// ==========================================

export function obtenerFotoPerfil(token) {
  return apiRequest(
    "/api/profile/photo",
    { method: "GET" },
    token
  );
}

// ==========================================
// SUBIR O CAMBIAR FOTOGRAFÍA
// POST /api/profile/photo
// ==========================================

export async function subirFotoPerfil(archivo, token) {
  const formData = new FormData();

  // El nombre "photo" debe coincidir
  // con upload.single("photo") del backend.
  formData.append("photo", archivo);

  const API_URL = (
    import.meta.env.VITE_API_URL || ""
  ).replace(/\/$/, "");

  const respuesta = await fetch(
    `${API_URL}/api/profile/photo`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const resultado = await respuesta.json().catch(
    () => ({})
  );

  if (!respuesta.ok) {
    throw new Error(
      resultado.message ||
        "No se pudo subir la fotografía"
    );
  }

  return resultado;
}

// ==========================================
// ELIMINAR FOTOGRAFÍA
// DELETE /api/profile/photo
// ==========================================

export function eliminarFotoPerfil(token) {
  return apiRequest(
    "/api/profile/photo",
    { method: "DELETE" },
    token
  );
}
