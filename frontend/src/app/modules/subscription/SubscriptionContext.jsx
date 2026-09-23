import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../../pages/api.js";

const SubscriptionContext = createContext(undefined);
const EMPTY_STATUS = {
  cutoffDay: null,
  paidThrough: null,
  blocked: false,
  paymentWarning: false,
  isWarningPhase: false,
  isExpired: false,
  daysRemaining: 0,
};

export function SubscriptionProvider({ children }) {
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRoleState] = useState(() => localStorage.getItem("userRole"));

  const setUserRole = (role) => {
    if (role) localStorage.setItem("userRole", role);
    else localStorage.removeItem("userRole");
    setUserRoleState(role || null);
  };

  const refresh = useCallback(async () => {
    if (!localStorage.getItem("pos_token")) return;
    setLoading(true);
    try {
      setStatus(await api.get("/subscription/status"));
    } catch (error) {
      console.error("No se pudo consultar la suscripción:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const update = async (method, endpoint, data) => {
    const next = await api[method](endpoint, data);
    setStatus(next);
    return next;
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    const onFocus = () => refresh();
    const onExpired = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("subscription-expired", onExpired);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("subscription-expired", onExpired);
    };
  }, [refresh, userRole]);

  return (
    <SubscriptionContext.Provider value={{
      ...status,
      deadline: status.paidThrough,
      userRole,
      setUserRole,
      loading,
      refresh,
      setDeadline: (cutoffDay) => update("put", "/subscription/configure", { cutoffDay: Number(cutoffDay) }),
      clearDeadline: () => update("post", "/subscription/unblock"),
      renewSubscription: (data = {}) => update("post", "/subscription/renew", data),
      blockSubscription: () => update("post", "/subscription/block"),
      setPaymentWarning: (active) => update("put", "/subscription/payment-warning", { active }),
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) throw new Error("useSubscription debe usarse dentro de SubscriptionProvider");
  return context;
}
