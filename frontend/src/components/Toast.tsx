import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: ToastType = "success") => {
    const id = ++_id;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const remove = (id: number) => setToasts(t => t.filter(x => x.id !== id));

  const icons = { success: <CheckCircle size={16} />, error: <AlertTriangle size={16} />, info: <Info size={16} /> };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toastContainer">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {icons[t.type]}
            <span>{t.message}</span>
            <button type="button" onClick={() => remove(t.id)}><X size={13} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
