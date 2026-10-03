import { Card } from "../ui/Card.jsx";
import "./CareerRequirements.css";

/**
 * Groups the flat requirements list returned by GET /career-skills
 * by its `category` field (as provided by the backend — the frontend
 * never invents or reorders career/skill data). Category order follows
 * first appearance in the API response.
 */
function groupByCategory(requirements) {
  const order = [];
  const groups = new Map();

  for (const req of requirements) {
    const category = req.category || "Other";
    if (!groups.has(category)) {
      groups.set(category, []);
      order.push(category);
    }
    groups.get(category).push(req);
  }

  return order.map((category) => ({ category, items: groups.get(category) }));
}

export default function CareerRequirements({ career, requirements }) {
  const groups = groupByCategory(requirements);

  return (
    <section className="sf-section" aria-labelledby="career-requirements-heading">
      <h2 id="career-requirements-heading" className="sf-section__title">
        Career Skill Requirements
      </h2>
      <Card className="sf-requirements">
        <p className="sf-requirements__career mono">{career}</p>
        <div className="sf-requirements__groups">
          {groups.map(({ category, items }) => (
            <div key={category} className="sf-requirements__group">
              <h3>{category}</h3>
              <ul>
                {items.map((item) => (
                  <li key={item.skillId} className="mono">
                    {item.skillName}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
