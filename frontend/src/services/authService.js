import { apiRequest } from "./api";

export function registrarUsuario({
  name,
  email,
  password,
}) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
}

export function iniciarSesion({
  email,
  password,
}) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}