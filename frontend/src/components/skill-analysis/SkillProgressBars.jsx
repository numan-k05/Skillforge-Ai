import SkillIcon from "../skills/SkillIcon.jsx";
import { Card } from "../ui/Card.jsx";
import "./SkillProgressBars.css";

const MAX_LEVEL = 5;

function toneForSkill(skill) {
  if (skill.status === "strong") return "teal";
  if (skill.status === "developing") return "amber";
  return "red";
}

function Bar({ label, level, tone, ariaLabel }) {
  const percent = Math.round((level / MAX_LEVEL) * 100);
  return (
    <div className="sf-bar" role="img" aria-label={ariaLabel}>
      <span className="sf-bar__label">{label}</span>
      <div className="sf-bar__track">
        <div className={`sf-bar__fill sf-bar__fill--${tone}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="sf-bar__value mono">{level}/{MAX_LEVEL}</span>
    </div>
  );
}

function SkillBarRow({ skill }) {
  const tone = toneForSkill(skill);
  return (
    <div className="sf-barrow">
      <p className="sf-barrow__name mono"><SkillIcon skill={skill} size={17} />{skill.skillName}</p>
      <Bar
        label="Current"
        level={skill.currentLevel}
        tone={tone}
        ariaLabel={`${skill.skillName} current level: ${skill.currentLevel} out of ${MAX_LEVEL}`}
      />
      <Bar
        label="Required"
        level={skill.requiredLevel}
        tone="neutral"
        ariaLabel={`${skill.skillName} required level: ${skill.requiredLevel} out of ${MAX_LEVEL}`}
      />
    </div>
  );
}

/**
 * Sorted by gap size (largest first) so the most important comparisons
 * are visible without scrolling on a long career skill list.
 */
export default function SkillProgressBars({ skills }) {
  const sorted = [...skills].sort((a, b) => b.gap - a.gap);

  return (
    <section className="sf-section" aria-labelledby="skill-progress-heading">
      <h2 id="skill-progress-heading" className="sf-section__title">
        Current vs Required Level
      </h2>
      <Card className="sf-progressbars">
        {sorted.map((skill) => (
          <SkillBarRow key={skill.skillId} skill={skill} />
        ))}
      </Card>
    </section>
  );
}
