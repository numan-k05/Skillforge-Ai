import { Check } from "lucide-react";
import { FEATURES } from "../../data/landingContent.js";
import "./Features.css";

const SKILL_BARS = [
  { name: "HTML", level: 4 },
  { name: "CSS", level: 3 },
  { name: "JavaScript", level: 2 },
  { name: "React", level: 0 },
  { name: "SQL", level: 1 },
];

const PHASES = [
  { name: "Foundation", state: "done" },
  { name: "Core skills", state: "active" },
  { name: "Projects", state: "locked" },
  { name: "Advanced skills", state: "locked" },
];

const CHECKLIST = ["Responsive layout", "Auth flow", "REST API", "Deployed build"];

function MiniVisual({ id }) {
  if (id === "skill-intelligence") {
    return (
      <div className="mini-card">
        <p className="mini-card__label mono">Example: skill profile</p>
        {SKILL_BARS.map((s) => (
          <div key={s.name} className="skillbar">
            <span className="skillbar__name mono">{s.name}</span>
            <div className="skillbar__track">
              <div className="skillbar__fill" style={{ width: `${(s.level / 5) * 100}%` }} />
            </div>
            <span className="skillbar__value">{s.level}/5</span>
          </div>
        ))}
      </div>
    );
  }
  if (id === "roadmaps") {
    return (
      <div className="mini-card">
        <p className="mini-card__label mono">Example: roadmap phases</p>
        <ul className="phase-list">
          {PHASES.map((p, i) => (
            <li key={p.name} className={`phase-list__item phase-list__item--${p.state}`}>
              <span className="phase-list__index">{i + 1}</span>
              {p.name}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (id === "projects") {
    return (
      <div className="mini-card">
        <p className="mini-card__label mono">Example: project milestones</p>
        <ul className="checklist">
          {CHECKLIST.map((c, i) => (
            <li key={c} className={i < 2 ? "checklist__item checklist__item--done" : "checklist__item"}>
              <Check size={14} /> {c}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (id === "career-readiness") {
    return (
      <div className="mini-card">
        <p className="mini-card__label mono">Example: career skill coverage</p>
        <div className="gauge">
          <div className="gauge__ring" style={{ "--pct": "67%" }}>
            <span className="gauge__value">67</span>
          </div>
          <p className="gauge__caption">out of 100 — a self-assessment, not a guarantee</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mini-card">
      <p className="mini-card__label mono">Example: weekly activity</p>
      <div className="streak">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className={`streak__day ${i < 5 ? "streak__day--filled" : ""}`}>
            {d}
          </div>
        ))}
      </div>
      <p className="gauge__caption">5 active days shown</p>
    </div>
  );
}

export default function Features() {
  return (
    <section id="skill-intelligence" className="features">
      <div className="container">
        <div className="section-head">
          <h2>Built around your actual profile</h2>
          <p>Five systems working from the same source of truth: what you know, what you're aiming for, and how much time you have.</p>
        </div>

        <div className="features__list">
          {FEATURES.map((f, i) => (
            <div key={f.id} id={f.id} className={`feature-row ${i % 2 === 1 ? "feature-row--reverse" : ""}`}>
              <div className="feature-row__copy">
                <span className="feature-row__tag mono">{f.tag}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
                <ul className="feature-row__points">
                  {f.points.map((p) => (
                    <li key={p}>
                      <Check size={14} /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="feature-row__visual">
                <MiniVisual id={f.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
