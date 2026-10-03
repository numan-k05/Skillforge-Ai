import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import { Card } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import "./CareerStatus.css";

export function CareerLoading({ message = "Loading careers…" }) {
  return (
    <Card className="sf-careerstatus" role="status" aria-live="polite">
      <Loader2 className="sf-careerstatus__spinner" size={28} aria-hidden="true" />
      <p>{message}</p>
    </Card>
  );
}

export function CareerError({ message, actionLabel = "Retry", onAction }) {
  return (
    <Card className="sf-careerstatus sf-careerstatus--error" role="alert">
      <AlertTriangle size={26} aria-hidden="true" />
      <p>{message || "Something went wrong. Please try again."}</p>
      {onAction && (
        <Button variant="secondary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}

export function CareerEmpty({ message = "No careers found." }) {
  return (
    <Card className="sf-careerstatus" role="status">
      <Inbox size={26} aria-hidden="true" />
      <p>{message}</p>
    </Card>
  );
}
