import React, { createContext, useContext, useState, useEffect } from "react";

const SubscriptionContext = createContext(undefined);

export function SubscriptionProvider({ children }) {
  const [deadline, setDeadlineState] = useState(() => {
    return localStorage.getItem("subscription_deadline");
  });

  const [userRole, setUserRoleState] = useState(() => {
    return localStorage.getItem("userRole");
  });

  const [isWarningPhase, setIsWarningPhase] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const setDeadline = (date) => {
    localStorage.setItem("subscription_deadline", date);
    setDeadlineState(date);
  };

  const clearDeadline = () => {
    localStorage.removeItem("subscription_deadline");
    setDeadlineState(null);
  };

  const setUserRole = (role) => {
    if (role) {
      localStorage.setItem("userRole", role);
    } else {
      localStorage.removeItem("userRole");
    }
    setUserRoleState(role);
  };

  // Sincronizar role desde localStorage (por si cambia en otra pestaña)
  useEffect(() => {
    const syncRole = () => {
      const stored = localStorage.getItem("userRole");
      setUserRoleState(stored || null);
    };
    window.addEventListener("storage", syncRole);
    return () => window.removeEventListener("storage", syncRole);
  }, []);

  useEffect(() => {
    const checkSubscription = () => {
      if (!deadline) {
        setIsWarningPhase(false);
        setIsExpired(false);
        return;
      }

      const now = new Date();
      const cutoffDayNum = parseInt(deadline, 10);

      if (!isNaN(cutoffDayNum) && cutoffDayNum >= 1 && cutoffDayNum <= 31 && deadline.length <= 2) {
        // Lógica mensual recurrente
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();

        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const actualCutoffDay = Math.min(cutoffDayNum, daysInMonth);

        if (currentDay > actualCutoffDay) {
          setIsExpired(true);
          setIsWarningPhase(false);
        } else if (actualCutoffDay - currentDay <= 5) {
          setIsExpired(false);
          setIsWarningPhase(true);
        } else {
          setIsExpired(false);
          setIsWarningPhase(false);
        }
      } else {
        // Fecha ISO absoluta
        const deadlineDate = new Date(deadline);
        const diffMs = deadlineDate.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffMs <= 0) {
          setIsExpired(true);
          setIsWarningPhase(false);
        } else if (diffDays <= 5) {
          setIsExpired(false);
          setIsWarningPhase(true);
        } else {
          setIsExpired(false);
          setIsWarningPhase(false);
        }
      }
    };

    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <SubscriptionContext.Provider
      value={{
        deadline,
        setDeadline,
        clearDeadline,
        isWarningPhase,
        isExpired,
        userRole,
        setUserRole,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription debe usarse dentro de SubscriptionProvider");
  }
  return context;
}
