const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "https://sangucheria-tio-juan.vercel.app/api");

function getToken() {
  return localStorage.getItem("pos_token");
}

function getAuthHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {},
  };
}

function handleSessionExpired() {
  localStorage.removeItem("pos_token");
  localStorage.removeItem("pos_user");
  window.location.href = "/";
}

async function request(method, endpoint, data) {
  const options = {
    method,
    headers: getAuthHeaders(),
  };

  if (data !== undefined) {
    options.body = JSON.stringify(data);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, options);
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisá tu conexión a internet.");
  }

  if (response.status === 401 && endpoint !== "/auth/login") {
    handleSessionExpired();
    throw new Error("Sesión expirada");
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.error || `Error en la petición ${method}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint) => request("GET", endpoint),
  post: (endpoint, data) => request("POST", endpoint, data),
  put: (endpoint, data) => request("PUT", endpoint, data),
  delete: (endpoint) => request("DELETE", endpoint),
};
