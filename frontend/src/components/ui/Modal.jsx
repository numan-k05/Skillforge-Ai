import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

/** Native modal provides focus containment, inert background and Escape handling. */
export default function Modal({ open, title, children, onClose, busy = false, className = "" }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open) { if (dialog.open) dialog.close(); return; }
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);
  function containFocus(event) {
    if (event.key !== "Tab") return;
    const focusable = [...ref.current.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")]
      .filter((element) => element.getClientRects().length > 0);
    if (!focusable.length) { event.preventDefault(); ref.current.focus(); return; }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return <dialog ref={ref} className={`sf-modal ${className}`} aria-labelledby={titleId}
    onKeyDown={containFocus}
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={(event) => { if (event.target === ref.current && !busy) { const box = ref.current.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }}>
    <header className="sf-modal__heading"><h2 id={titleId}>{title}</h2><button type="button" className="sf-icon-button" disabled={busy} onClick={onClose} aria-label="Close dialog"><X size={20} /></button></header>
    {children}
  </dialog>;
}
