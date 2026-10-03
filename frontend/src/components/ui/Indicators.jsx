import { useId } from "react";

function bounded(value) { return Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : 0; }
export function ProgressBar({ value, label, showValue = true }) {
  const percent = bounded(value);
  return <div className="sf-progress-indicator"><div><span>{label}</span>{showValue && <strong>{Math.round(percent)}%</strong>}</div><div className="sf-progress-indicator__track" role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div></div>;
}
export function ScoreIndicator({ value, label = "Score" }) {
  const score = bounded(value);
  return <div className="sf-score" role="img" aria-label={`${label}: ${Math.round(score)} out of 100`}><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" className="sf-score__track" /><circle cx="60" cy="60" r="50" pathLength="100" strokeDasharray={`${score} 100`} className="sf-score__fill" /></svg><div><strong>{Math.round(score)}</strong><span>{label}</span></div></div>;
}
export function Tooltip({ text, children }) {
  const id = useId();
  return <span className="sf-tooltip"><button type="button" className="sf-tooltip__trigger" aria-describedby={id}>{children}</button><span role="tooltip" id={id}>{text}</span></span>;
}
