import { AlertTriangle } from "lucide-react";
import Button from "../ui/Button.jsx";
import Modal from "../ui/Modal.jsx";
import "./ConfirmDialog.css";
export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, busy = false, onConfirm, onCancel }) {
  return <Modal open={open} title={title} onClose={onCancel} busy={busy}>
    <div className={"sf-dialog__icon" + (danger ? " sf-dialog__icon--danger" : "")}><AlertTriangle size={22} aria-hidden="true" /></div>
    <p className="sf-dialog__message">{message}</p><div className="sf-dialog__actions"><Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button><Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>{busy ? "Working..." : confirmLabel}</Button></div>
  </Modal>;
}
