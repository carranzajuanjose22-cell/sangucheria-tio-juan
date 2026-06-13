import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock, Mail, UserCircle2 } from "lucide-react";
import { useSubscription } from "../modules/subscription/index.jsx";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUserRole } = useSubscription();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("admin")) {
      setUserRole("admin");
      navigate("/admin");
    } else if (email.includes("creador") || email.includes("creator")) {
      setUserRole("creator");
      navigate("/creator");
    } else {
      setUserRole("employee");
      navigate("/employee");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <UserCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenido</h2>
          <p className="text-blue-100 text-sm">Ingresa a tu cuenta para continuar</p>
        </div>

        <div className="p-8">
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500 mb-4">Acceso Rápido (Demo)</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@empresa.com");
                  setPassword("admin123");
                }}
                className="flex-1 py-2 px-2 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("caja@empresa.com");
                  setPassword("caja123");
                }}
                className="flex-1 py-2 px-2 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
              >
                Empleado
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("creador@sistema.com");
                  setPassword("creador123");
                }}
                className="flex-1 py-2 px-2 border border-purple-200 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
              >
                Creador
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
