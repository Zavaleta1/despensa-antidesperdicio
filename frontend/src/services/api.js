export const API_URL = "";

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

  if (!response.ok) {
    const error = new Error(
      data?.message || "Error en la solicitud"
    );

    error.status = response.status;
    throw error;
  }

  return data;
}