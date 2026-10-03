import { Card } from "../ui/Card.jsx";
import "./ReadinessOverview.css";

const RADIUS = 62;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function toneForScore(score) {
  if (score >= 75) return "teal";
  if (score >= 40) return "amber";
  return "red";
}

/**
 * Circular readiness gauge. Built with a plain SVG ring (no charting
 * library needed) so the percentage, the ring fill, and the text label
 * always agree with the exact number the backend returned — nothing
 * here is recalculated on the frontend.
 */
function ReadinessGauge({ score }) {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const tone = toneForScore(clamped);

  return (
    <div
      className="sf-gauge"
      role="img"
      aria-label={`Overall readiness score: ${clamped} percent`}
    >
      <svg viewBox="0 0 148 148" className="sf-gauge__svg">
        <circle cx="74" cy="74" r={RADIUS} className="sf-gauge__track" />
        <circle
          cx="74"
          cy="74"
          r={RADIUS}
          className={`sf-gauge__fill sf-gauge__fill--${tone}`}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="sf-gauge__label">
        <span className="sf-gauge__number mono">{clamped}%</span>
        <span className="sf-gauge__caption">ready</span>
      </div>
    </div>
  );
}

function StatBlock({ value, label, tone }) {
  return (
    <div className="sf-readiness__stat">
      <span className={`sf-readiness__stat-value mono${tone ? ` sf-readiness__stat-value--${tone}` : ""}`}>
        {value}
      </span>
      <span className="sf-readiness__stat-label">{label}</span>
    </div>
  );
}

export default function ReadinessOverview({ summary }) {
  const { readinessScore, totalSkills, strongCount, developingCount, missingCount } = summary;
  const coveragePercent = totalSkills > 0 ? Math.round(((strongCount + developingCount) / totalSkills) * 100) : 0;

  return (
    <Card className="sf-readiness">
      <div className="sf-readiness__gauge-col">
        <ReadinessGauge score={readinessScore} />
        <p className="sf-readiness__gauge-note">Overall readiness for this career</p>
      </div>

      <div className="sf-readiness__stats">
        <StatBlock value={`${coveragePercent}%`} label="Current skill coverage" />
        <StatBlock value={strongCount} label="Strong skills" tone="teal" />
        <StatBlock value={developingCount} label="Need improvement" tone="amber" />
        <StatBlock value={missingCount} label="Missing skills" tone="red" />
      </div>
    </Card>
  );
}
