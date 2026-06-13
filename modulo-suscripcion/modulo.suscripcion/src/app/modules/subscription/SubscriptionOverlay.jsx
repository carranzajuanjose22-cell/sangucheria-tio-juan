import React, { useState, useEffect } from "react";
import { AlertTriangle, Lock, X, LogOut } from "lucide-react";
import { useSubscription } from "./SubscriptionContext.jsx";
import { useLocation, useNavigate } from "react-router";

export function SubscriptionOverlay() {
  const { isWarningPhase, isExpired, userRole, deadline, setUserRole } = useSubscription();
  const [showWarning, setShowWarning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Do not show anything on the login page so users can actually log in (or log out to it)
  const isLoginPage = location.pathname === "/";

  // Warning logic
  useEffect(() => {
    let showTimer;
    let hideTimer;

    const cycleWarning = () => {
      // Show the warning
      setShowWarning(true);
      
      // Auto-hide after 10 minutes (600,000 ms)
      hideTimer = setTimeout(() => {
        setShowWarning(false);
      }, 600000);

      // Repeat the cycle every 3 hours (10,800,000 ms)
      showTimer = setTimeout(cycleWarning, 10800000);
    };

    if (isWarningPhase && userRole !== "creator") {
      // Start the cycle immediately when phase starts or component mounts in phase
      cycleWarning();
    } else {
      setShowWarning(false);
    }

    // Cleanup timers
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isWarningPhase, userRole]);

  // Calculate days remaining for the warning
  const getDaysRemaining = () => {
    if (!deadline) return 0;

    const cutoffDayNum = parseInt(deadline, 10);
    if (!isNaN(cutoffDayNum) && cutoffDayNum >= 1 && cutoffDayNum <= 31 && deadline.length <= 2) {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const actualCutoffDay = Math.min(cutoffDayNum, daysInMonth);
      return Math.max(0, actualCutoffDay - now.getDate());
    }

    const diffMs = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // If expired and not creator, show block screen
  if (isExpired && userRole !== "creator" && !isLoginPage) {
    const handleLogout = () => {
      setUserRole(null);
      navigate("/");
    };

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md bg-white/30">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Suscripción Vencida</h2>
          <p className="text-gray-600 mb-6">
            El período de uso de la aplicación ha finalizado. Por favor, contacte a los desarrolladores para reactivar el servicio.
          </p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // If in warning phase and warning is not dismissed, show toast
  if (showWarning && userRole !== "creator" && !isLoginPage) {
    return (
      <div className="fixed bottom-4 right-4 z-[9990] bg-white rounded-lg shadow-xl border-l-4 border-amber-500 p-4 max-w-sm w-full transition-all transform duration-300 ease-out translate-y-0 opacity-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Aviso de Servicio</h3>
              <p className="text-sm text-gray-600 mt-1">
                Su servicio vence en {getDaysRemaining()} días. De no renovarse, se restringirá el acceso a la aplicación.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}