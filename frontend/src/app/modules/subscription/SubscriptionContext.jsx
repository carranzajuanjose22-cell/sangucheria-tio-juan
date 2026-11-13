import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../pages/api.js";

const SubscriptionContext = createContext(undefined);
const EMPTY_STATUS = { cutoffDay: null, paidThrough: null, paymentWarning: false, isWarningPhase: false, isExpired: false, daysRemaining: 0 };

function readSession() {
  const token = localStorage.getItem("pos_token");
  try {
    const user = JSON.parse(localStorage.getItem("pos_user"));
    const role = user?.role === "Creador" ? "creator" : user?.role === "Admin" ? "admin" : user ? "employee" : null;
    return { token, role };
  } catch {
    return { token, role: null };
  }
}

export function SubscriptionProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [snapshot, setSnapshot] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const requestVersion = useRef(0);
  const saving = useRef(false);
  const { token, role: userRole } = session;

  // Estos valores antiguos eran exclusivos de cada navegador y no representan la suscripción real.
  useEffect(() => {
    localStorage.removeItem("subscription_deadline");
    localStorage.removeItem("payment_warning");
  }, []);

  const setUserRole = useCallback((role) => {
    if (role) localStorage.setItem("userRole", role);
    else localStorage.removeItem("userRole");
    requestVersion.current += 1;
    setSession({ token: localStorage.getItem("pos_token"), role });
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!token || saving.current) return;
    const version = ++requestVersion.current;
    try {
      const data = await api.get("/subscription/status");
      if (version === requestVersion.current && localStorage.getItem("pos_token") === token) {
        setSnapshot({ token, data, error: null });
      }
    } catch (error) {
      if (version === requestVersion.current && localStorage.getItem("pos_token") === token) {
        setSnapshot((previous) => ({ token, data: previous?.token === token ? previous.data : null, error: error.message }));
      }
    }
  }, [token]);

  useEffect(() => {
    refreshSubscription();
    const interval = setInterval(refreshSubscription, 30000);
    const syncSession = () => {
      const next = readSession();
      setSession((previous) => previous.token === next.token && previous.role === next.role ? previous : next);
      refreshSubscription();
    };
    const handleStorage = (event) => {
      if (!event.key || ["pos_token", "pos_user", "userRole"].includes(event.key)) syncSession();
    };
    const handleExpired = (event) => {
      if (event.detail.token === token && localStorage.getItem("pos_token") === token && !saving.current) {
        requestVersion.current += 1;
        setSnapshot({ token, data: event.detail.subscription, error: null });
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncSession);
    window.addEventListener("subscription:expired", handleExpired);
    return () => {
      requestVersion.current += 1;
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncSession);
      window.removeEventListener("subscription:expired", handleExpired);
    };
  }, [session, refreshSubscription]);

  const updateSubscription = useCallback(async (method, endpoint, patch) => {
    if (saving.current) throw new Error("Esperá a que termine el cambio anterior.");
    saving.current = true;
    setIsSaving(true);
    const version = ++requestVersion.current;
    try {
      const data = await api[method](`/subscription/${endpoint}`, patch);
      if (version === requestVersion.current && localStorage.getItem("pos_token") === token) {
        setSnapshot({ token, data, error: null });
      }
      return data;
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }, [token]);

  const current = token && snapshot?.token === token ? snapshot : null;
  return (
    <SubscriptionContext.Provider value={{
      ...(current?.data || EMPTY_STATUS),
      deadline: current?.data?.paidThrough || null,
      isLoading: Boolean(token && !current),
      hasStatus: Boolean(current?.data),
      error: current?.error || null,
      isSaving,
      userRole,
      setUserRole,
      refreshSubscription,
      setDeadline: (cutoffDay) => updateSubscription("put", "configure", { cutoffDay: Number(cutoffDay) }),
      renewSubscription: (payment = {}) => updateSubscription("post", "renew", payment),
      blockSubscription: () => updateSubscription("post", "block", {}),
      clearDeadline: () => updateSubscription("post", "unblock", {}),
      setPaymentWarning: (active) => updateSubscription("put", "payment-warning", { active }),
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
