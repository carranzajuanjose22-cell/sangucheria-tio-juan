import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../pages/api.js";

const DEFAULT_POLL_MS = 5000;

export function usePosStore(options = {}) {
  const {
    enabled = true,
    pollMs = DEFAULT_POLL_MS,
    keys = ["register_state", "pos_sales", "pos_expenses", "pos_pending_orders"],
  } = options;

  const [data, setData] = useState(() =>
    Object.fromEntries(
      keys.map((key) => [key, key === "register_state" ? null : []])
    )
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    try {
      const results = await Promise.all(
        keys.map((key) =>
          api
            .get(`/store/${key}`)
            .then((value) => [key, value])
            .catch(() => [key, key === "register_state" ? null : []])
        )
      );

      if (!mountedRef.current) return;

      const next = {};
      for (const [key, value] of results) {
        next[key] = value ?? (key === "register_state" ? null : []);
      }

      setData((prev) => ({ ...prev, ...next }));
      setError(null);
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || "Error al cargar datos del POS");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, keys.join("|")]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();

    const interval = setInterval(refresh, pollMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, pollMs]);

  return {
    ...data,
    loading,
    error,
    refresh,
  };
}
