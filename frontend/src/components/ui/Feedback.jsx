import { AlertCircle, ArrowRight, Inbox, LoaderCircle } from "lucide-react";
import Button from "./Button.jsx";
import { Card } from "./Card.jsx";

export function EmptyState({ title = "Nothing here yet", description, action, icon: Icon = Inbox }) {
  return <Card className="sf-state"><span className="sf-state__icon"><Icon size={28} aria-hidden="true" /></span><h2>{title}</h2>{description && <p>{description}</p>}{action}</Card>;
}
export function ErrorState({ title = "We couldn't load this", message = "Please try again.", onRetry }) {
  return <div role="alert"><EmptyState title={title} description={message} icon={AlertCircle} action={onRetry && <Button variant="secondary" onClick={onRetry}>Try again<ArrowRight size={16} aria-hidden="true" /></Button>} /></div>;
}
export function Skeleton({ rows = 3, label = "Loading content" }) {
  return <div className="sf-skeleton-group" role="status" aria-label={label}><span className="visually-hidden">{label}</span>{Array.from({ length: rows }, (_, index) => <div key={index} className="sf-skeleton" aria-hidden="true" />)}</div>;
}
export function RouteLoading() {
  return <main id="main-content" tabIndex={-1} className="sf-route-loading" role="status"><LoaderCircle className="spin" size={26} aria-hidden="true" /><p>Opening your workspace…</p></main>;
}
