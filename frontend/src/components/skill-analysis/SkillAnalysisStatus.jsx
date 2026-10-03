import { AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import "./SkillAnalysisStatus.css";

export function AnalysisLoading() {
  return (
    <Card className="sf-analysisstatus" role="status" aria-live="polite">
      <Loader2 className="sf-analysisstatus__spinner" size={28} aria-hidden="true" />
      <p>Analyzing your skills…</p>
    </Card>
  );
}

export function AnalysisMessage({ title, message, actionLabel, onAction, tone = "info" }) {
  return (
    <Card className={`sf-analysisstatus sf-analysisstatus--${tone}`} role="alert">
      <AlertTriangle size={26} aria-hidden="true" />
      {title && <h2>{title}</h2>}
      <p>{message}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}

export function InlineBanner({ message }) {
  return (
    <div className="sf-inlinebanner" role="status">
      {message}
    </div>
  );
}
