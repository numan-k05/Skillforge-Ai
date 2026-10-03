import { useCallback, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { ToastContext } from "../../context/toast.js";

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((message, tone = "success") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current.slice(-3), { id, message, tone }]);
  }, []);
  return <ToastContext.Provider value={notify}>{children}<div className="sf-toasts" aria-label="Notifications">{toasts.map((toast) => <div className={`sf-toast sf-toast--${toast.tone}`} key={toast.id}><span role={toast.tone === "error" ? "alert" : "status"}>{toast.tone === "error" ? <AlertCircle size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}{toast.message}</span><button className="sf-icon-button" type="button" aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}><X size={16} /></button></div>)}</div></ToastContext.Provider>;
}
