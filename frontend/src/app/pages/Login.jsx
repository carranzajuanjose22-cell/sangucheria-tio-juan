import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock, Mail, UserCircle2 } from "lucide-react";
import { api } from "./api.js";
import { useSubscription } from "../modules/subscription/index.jsx";

export function Login() {
  const navigate = useNavigate();
  const { setUserRole } = useSubscription();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (response.success) {
        localStorage.setItem("pos_token", response.token);
        localStorage.setItem("pos_user", JSON.stringify(response.user));

        if (response.user.role === "Admin") {
          setUserRole("admin");
          navigate("/admin");
        } else if (response.user.role === "Creador") {
          setUserRole("creator");
          navigate("/creator");
        } else {
          setUserRole("employee");
          navigate("/employee");
        }
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-4 to-brand-3/40 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-brand-1 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <UserCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenido</h2>
          <p className="text-brand-4 text-sm">Ingresa a tu cuenta para continuar</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-brand-1/10 border border-brand-1/25 rounded-lg text-brand-1-dark text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-1 focus:border-transparent transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-1 focus:border-transparent transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-1 text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-1-dark focus:outline-none focus:ring-2 focus:ring-brand-1 focus:ring-offset-2 transition-colors disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
