import React, { useState } from "react";
import { useSubscription } from "./SubscriptionContext.jsx";
import {
  Settings, Calendar, ShieldCheck, Play, RotateCcw, LogOut,
  CheckCircle2, AlertCircle, X,
} from "lucide-react";
import { useNavigate } from "react-router";

function AlertModal({ open, type = "success", title, message, onClose }) {
  if (!open) return null;

  const styles = {
    success: {
      icon: <CheckCircle2 className="w-10 h-10 text-emerald-600" />,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      btn: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
    },
    error: {
      icon: <AlertCircle className="w-10 h-10 text-brand-1" />,
      bg: "bg-brand-1/10",
      border: "border-brand-1/25",
      btn: "bg-brand-1 hover:bg-brand-1-dark focus:ring-brand-1",
    },
    warning: {
      icon: <AlertCircle className="w-10 h-10 text-brand-3-dark" />,
      bg: "bg-brand-4",
      border: "border-brand-3/30",
      btn: "bg-brand-3-dark hover:bg-brand-1 focus:ring-brand-3",
    },
  };

  const s = styles[type] || styles.success;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className={`${s.bg} ${s.border} border-b px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {s.icon}
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className={`w-full ${s.btn} text-white font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreatorDashboard() {
  const { deadline, setDeadline, clearDeadline, isExpired, isWarningPhase, setUserRole } = useSubscription();
  const [selectedDay, setSelectedDay] = useState("");
  const navigate = useNavigate();

  const [modal, setModal] = useState({ open: false, type: "success", title: "", message: "" });

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  React.useEffect(() => {
    if (deadline && !isNaN(Number(deadline)) && deadline.length <= 2) {
      setSelectedDay(deadline);
    }
  }, [deadline]);

  const handleStartSubscription = () => {
    const day = parseInt(selectedDay, 10);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      setDeadline(day.toString());
      showModal(
        "success",
        "Período configurado",
        `El ciclo de suscripción fue configurado para el día ${day} de cada mes. Los avisos comenzarán 5 días antes del corte.`
      );
    } else {
      showModal(
        "error",
        "Día inválido",
        "Por favor ingrese un día válido entre 1 y 31."
      );
    }
  };

  const handleReactivate = () => {
    clearDeadline();
    showModal(
      "success",
      "Servicio reactivado",
      "La restricción de uso fue levantada. Los usuarios pueden acceder a la aplicación con normalidad."
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_user");
    setUserRole(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AlertModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

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

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto p-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <Settings className="w-6 h-6 text-brand-1" />
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Suscripción</h1>
          </div>

          <div className="p-6 space-y-8">
            {/* Estado actual */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Estado Actual</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Día de Corte Mensual</p>
                  <p className="font-medium text-gray-900">
                    {deadline
                      ? (!isNaN(Number(deadline)) && deadline.length <= 2
                          ? `Día ${deadline} de cada mes`
                          : new Date(deadline).toLocaleString("es-AR"))
                      : "No establecido"}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Fase de Aviso (5 días)</p>
                  <p className="font-medium">
                    {isWarningPhase ? (
                      <span className="text-brand-3-dark">Activa ⚠️</span>
                    ) : (
                      <span className="text-gray-900">Inactiva</span>
                    )}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Restricción de Uso</p>
                  <p className="font-medium">
                    {isExpired ? (
                      <span className="text-brand-1">Bloqueado 🔒</span>
                    ) : (
                      <span className="text-emerald-600">Normal ✅</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario de período */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Establecer Nuevo Período</h2>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Día de corte mensual (1–31)
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
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-1 focus:border-transparent transition-colors"
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={handleStartSubscription}
                  className="w-full md:w-auto bg-brand-1 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-1-dark focus:outline-none focus:ring-2 focus:ring-brand-1 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Guardar Día de Corte
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Cada mes, al superar este día, el sistema bloqueará el acceso a la app para admin y empleados. Los avisos de vencimiento comenzarán 5 días antes.
              </p>
            </div>

            {/* Sección de reactivación */}
            {deadline && (
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Reactivar Suscripción</h2>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-emerald-900">Limpiar restricción y reactivar</h3>
                    <p className="text-sm text-emerald-700 mt-1">
                      Elimina el bloqueo de acceso y restaura el uso normal de la aplicación.
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
