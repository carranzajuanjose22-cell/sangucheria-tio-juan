import React, { useState } from "react";
import { useSubscription } from "./SubscriptionContext.jsx";
import { Settings, Calendar, ShieldCheck, Play, RotateCcw, LogOut } from "lucide-react";
import { useNavigate } from "react-router";

export function CreatorDashboard() {
  const { deadline, setDeadline, clearDeadline, isExpired, isWarningPhase, setUserRole } = useSubscription();
  const [selectedDay, setSelectedDay] = useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    if (deadline && !isNaN(Number(deadline)) && deadline.length <= 2) {
      setSelectedDay(deadline);
    }
  }, [deadline]);

  const handleStartSubscription = () => {
    const day = parseInt(selectedDay, 10);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      setDeadline(day.toString());
      alert(`Ciclo de suscripción configurado para el día ${day} de cada mes.`);
    } else {
      alert("Por favor seleccione un día válido del 1 al 31.");
    }
  };

  const handleReactivate = () => {
    clearDeadline();
    alert("Suscripción reactivada. Se ha levantado la restricción de uso.");
  };

  const handleLogout = () => {
    setUserRole(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold">Panel de Creador</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Suscripción</h1>
          </div>

          <div className="p-6 space-y-8">
            {/* Current Status */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Estado Actual</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Día de Corte Mensual</p>
                  <p className="font-medium text-gray-900">
                    {deadline 
                      ? (!isNaN(Number(deadline)) && deadline.length <= 2 
                          ? `Día ${deadline} de cada mes` 
                          : new Date(deadline).toLocaleString()) 
                      : "No establecido"}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Fase de Aviso (5 días)</p>
                  <p className="font-medium">
                    {isWarningPhase ? (
                      <span className="text-amber-600 flex items-center gap-1">Activa</span>
                    ) : (
                      <span className="text-gray-900">Inactiva</span>
                    )}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Restricción de Uso</p>
                  <p className="font-medium">
                    {isExpired ? (
                      <span className="text-red-600 flex items-center gap-1">Bloqueado</span>
                    ) : (
                      <span className="text-emerald-600">Normal</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Set Deadline Form */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Establecer Nuevo Período</h2>

              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Día de corte mensual (Ej. 10)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ej: 10"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors cursor-pointer"
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={handleStartSubscription}
                  className="w-full md:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Guardar Día de Corte
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Todos los meses, al pasar este día, el sistema bloqueará el uso de la app. Los avisos de vencimiento comenzarán 5 días antes de este día cada mes.
              </p>
            </div>

            {/* Reactivation Section - Shown prominently if active/expired */}
            {deadline && (
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Reactivar Suscripción</h2>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-emerald-900">Limpiar restricción y reactivar</h3>
                    <p className="text-sm text-emerald-700 mt-1">
                      Esto eliminará el cartel de bloqueo de la aplicación y el uso volverá a la normalidad.
                    </p>
                  </div>
                  <button
                    onClick={handleReactivate}
                    className="w-full md:w-auto bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Reactivar Servicio
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}