// URL base de tu futuro backend (por defecto, Express corre en el 3000)
const API_URL = "http://localhost:3000/api";

/**
 * Cliente HTTP base para conectarse con el Backend.
 * Reemplazará los llamadas a localStorage.
 */
export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        // TODO: Cuando hagamos el login, aquí enviaremos el token
        // "Authorization": `Bearer ${localStorage.getItem("pos_token")}`
      },
    });
    if (!response.ok) throw new Error("Error en la petición GET");
    return response.json();
  },

  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || "Error de red o el backend está apagado");
    }
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error en la petición PUT");
    return response.json();
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Error en la petición DELETE");
    return response.json();
  }
};