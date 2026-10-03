import { Card, Badge } from "../ui/Card.jsx";
import "./SkillGapCategories.css";

const PRIORITY_TONE = { high: "red", medium: "amber", low: "neutral" };
const STATUS_META = {
  strong: {
    key: "strong",
    title: "Strong Skills",
    description: "Skills that meet or exceed the required level.",
    tone: "teal",
  },
  developing: {
    key: "developing",
    title: "Improving Skills",
    description: "Skills where you have some knowledge but still need improvement.",
    tone: "amber",
  },
  missing: {
    key: "missing",
    title: "Missing Skills",
    description: "Skills that are required but you have little or no experience with yet.",
    tone: "red",
  },
};

function SkillItem({ skill }) {
  return (
    <li className="sf-skillitem">
      <div className="sf-skillitem__top">
        <span className="sf-skillitem__name mono">{skill.skillName}</span>
        {skill.priority && (
          <Badge tone={PRIORITY_TONE[skill.priority] || "neutral"}>{skill.priority} priority</Badge>
        )}
      </div>
      <dl className="sf-skillitem__meta">
        <div>
          <dt>Current</dt>
          <dd>{skill.currentLevel}/5</dd>
        </div>
        <div>
          <dt>Required</dt>
          <dd>{skill.requiredLevel}/5</dd>
        </div>
        <div>
          <dt>Gap</dt>
          <dd>{skill.gap}</dd>
        </div>
      </dl>
    </li>
  );
}

function CategoryColumn({ meta, skills }) {
  return (
    <div className="sf-gapcategory">
      <div className={`sf-gapcategory__head sf-gapcategory__head--${meta.tone}`}>
        <h3>{meta.title}</h3>
        <span className="sf-gapcategory__count mono">{skills.length}</span>
      </div>
      <p className="sf-gapcategory__desc">{meta.description}</p>
      {skills.length === 0 ? (
        <p className="sf-gapcategory__empty">No skills in this group yet.</p>
      ) : (
        <ul className="sf-gapcategory__list">
          {skills.map((skill) => (
            <SkillItem key={skill.skillId} skill={skill} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SkillGapCategories({ skills }) {
  const byStatus = {
    strong: skills.filter((s) => s.status === "strong"),
    developing: skills.filter((s) => s.status === "developing"),
    missing: skills.filter((s) => s.status === "missing"),
  };

  return (
    <section className="sf-section" aria-labelledby="skill-gap-overview-heading">
      <h2 id="skill-gap-overview-heading" className="sf-section__title">
        Skill Gap Overview
      </h2>
      <Card className="sf-gapoverview">
        {Object.values(STATUS_META).map((meta) => (
          <CategoryColumn key={meta.key} meta={meta} skills={byStatus[meta.key]} />
        ))}
      </Card>
    </section>
  );
}
