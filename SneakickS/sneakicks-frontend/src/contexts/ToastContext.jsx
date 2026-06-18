import { createContext, useContext, useCallback, useState } from "react";

const ToastContext = createContext(null);

let idSeq = 0;

const TYPE_STYLES = {
  success: "border-brand-600 bg-brand-50 text-brand-800",
  error: "border-rose-300 bg-rose-50 text-rose-800",
  info: "border-slate-300 bg-white text-ink",
};

const TYPE_ICON = { success: "✓", error: "✕", info: "ℹ" };

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info", duration = 3500) => {
      const id = ++idSeq;
      setToasts((list) => [...list, { id, message, type }]);
      if (duration) setTimeout(() => remove(id), duration);
      return id;
    },
    [remove]
  );

  const toast = {
    success: (m, d) => push(m, "success", d),
    error: (m, d) => push(m, "error", d),
    info: (m, d) => push(m, "info", d),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[22rem] max-w-[90vw]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-in-up flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${
              TYPE_STYLES[t.type] || TYPE_STYLES.info
            }`}
          >
            <span className="font-bold leading-5">{TYPE_ICON[t.type]}</span>
            <span className="text-sm flex-1 leading-5">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-slate-400 hover:text-slate-600 leading-5"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
