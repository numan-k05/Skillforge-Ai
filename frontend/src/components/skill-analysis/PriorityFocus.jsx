import { Card, Badge } from "../ui/Card.jsx";
import "./PriorityFocus.css";

const PRIORITY_TONE = { high: "red", medium: "amber", low: "neutral" };

function explanationFor(skillName) {
  return `Improving ${skillName} will meaningfully improve your readiness score for your selected career.`;
}

export default function PriorityFocus({ topPriorities }) {
  if (topPriorities.length === 0) {
    return null;
  }

  return (
    <section className="sf-section" aria-labelledby="priority-focus-heading">
      <h2 id="priority-focus-heading" className="sf-section__title">
        Skills You Should Focus On First
      </h2>
      <Card className="sf-priority" as="ol">
        {topPriorities.map((skill, index) => (
          <li key={skill.skillName} className="sf-priority__item">
            <span className="sf-priority__rank mono" aria-hidden="true">
              {index + 1}
            </span>
            <div className="sf-priority__body">
              <div className="sf-priority__head">
                <span className="sf-priority__name mono">{skill.skillName}</span>
                <Badge tone={PRIORITY_TONE[skill.priority] || "neutral"}>{skill.priority} priority</Badge>
              </div>
              <dl className="sf-priority__meta">
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
              <p className="sf-priority__note">{explanationFor(skill.skillName)}</p>
            </div>
          </li>
        ))}
      </Card>
    </section>
  );
}
