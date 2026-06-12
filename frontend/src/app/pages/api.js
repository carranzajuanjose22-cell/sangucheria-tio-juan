const API_URL = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("pos_token");
}

function getAuthHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function handleSessionExpired() {
  localStorage.removeItem("pos_token");
  localStorage.removeItem("pos_user");
  window.location.href = "/";
}

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: getAuthHeaders(),
    });
    if (response.status === 401) {
      handleSessionExpired();
      throw new Error("Sesión expirada");
    }
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || "Error en la petición GET");
    }
    return response.json();
  },

  post: async (endpoint, data) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (response.status === 401 && endpoint !== "/auth/login") {
      handleSessionExpired();
      throw new Error("Sesión expirada");
    }
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || "Error de red o el backend está apagado");
    }
    return response.json();
  },

  put: async (endpoint, data) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (response.status === 401) {
      handleSessionExpired();
      throw new Error("Sesión expirada");
    }
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || "Error en la petición PUT");
    }
    return response.json();
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (response.status === 401) {
      handleSessionExpired();
      throw new Error("Sesión expirada");
    }
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || "Error en la petición DELETE");
    }
    return response.json();
  },
};
