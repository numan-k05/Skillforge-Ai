import { Badge } from "../ui/Card.jsx";
import "./SkillRequirementGroup.css";

// requirement.importance is 1 (low) – 3 (high), per the backend schema.
const IMPORTANCE_LABEL = { 1: "Low", 2: "Medium", 3: "High" };
const IMPORTANCE_TONE = { 1: "neutral", 2: "amber", 3: "red" };

function LevelBar({ level, max = 5, label }) {
  const percent = Math.round((level / max) * 100);
  return (
    <div className="sf-reqlevel" role="img" aria-label={`${label}: ${level} out of ${max}`}>
      <span className="sf-reqlevel__label">{label}</span>
      <div className="sf-reqlevel__track">
        <div className="sf-reqlevel__fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="sf-reqlevel__value mono">
        {level}/{max}
      </span>
    </div>
  );
}

function SkillRequirementItem({ skill }) {
  const { requirement } = skill;
  const importanceLabel = IMPORTANCE_LABEL[requirement.importance] || "Medium";
  const importanceTone = IMPORTANCE_TONE[requirement.importance] || "neutral";

  return (
    <li className="sf-reqitem">
      <div className="sf-reqitem__head">
        <span className="sf-reqitem__name mono">{skill.name}</span>
        <Badge tone={importanceTone}>{importanceLabel} importance</Badge>
      </div>
      {skill.category && <p className="sf-reqitem__category">{skill.category}</p>}
      {skill.description && <p className="sf-reqitem__desc">{skill.description}</p>}
      <div className="sf-reqitem__levels">
        {requirement.targetLevel != null && (
          <LevelBar level={requirement.targetLevel} label="Target Level" />
        )}
        {requirement.minLevel != null && requirement.minLevel !== requirement.targetLevel && (
          <LevelBar level={requirement.minLevel} label="Minimum Level" />
        )}
      </div>
    </li>
  );
}

/**
 * One section of a career's skill breakdown (Required / Recommended /
 * Optional — the three buckets GET /careers/:id/skills already splits
 * skills into). Renders nothing if the backend returned no skills for
 * this bucket, rather than showing an empty section.
 */
export default function SkillRequirementGroup({ title, tone, skills }) {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="sf-reqgroup">
      <h3 className="sf-reqgroup__title">
        <Badge tone={tone}>{title}</Badge>
        <span className="sf-reqgroup__count mono">
          {skills.length} skill{skills.length === 1 ? "" : "s"}
        </span>
      </h3>
      <ul className="sf-reqgroup__list">
        {skills.map((skill) => (
          <SkillRequirementItem key={skill.skillId} skill={skill} />
        ))}
      </ul>
    </div>
  );
}
