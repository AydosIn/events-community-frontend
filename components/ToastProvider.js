import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

function createToast(type, message) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    message,
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutIds = useRef(new Map());

  const dismissToast = useCallback((id) => {
    if (typeof window !== "undefined") {
      const timeoutId = timeoutIds.current.get(id);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }

    timeoutIds.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (type, message) => {
      const nextToast = createToast(type, message);
      setToasts((current) => [...current, nextToast]);

      if (typeof window !== "undefined") {
        const timeoutId = window.setTimeout(() => {
          dismissToast(nextToast.id);
        }, 3600);

        timeoutIds.current.set(nextToast.id, timeoutId);
      }
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      success: (message) => pushToast("success", message),
      error: (message) => pushToast("error", message),
      info: (message) => pushToast("info", message),
    }),
    [pushToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
