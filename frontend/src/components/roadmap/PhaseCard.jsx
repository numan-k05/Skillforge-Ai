import { ChevronDown, Clock, ListChecks } from "lucide-react";
import { useState } from "react";
import { Badge, Card } from "../ui/Card.jsx";
import RoadmapItemCard from "./RoadmapItemCard.jsx";
import { countCompletedItems } from "../../utils/roadmapHelpers.js";
import "./PhaseCard.css";

export default function PhaseCard({ phase, index }) {
  const [open, setOpen] = useState(true);
  const items = Array.isArray(phase.items) ? phase.items : [];
  const completed = countCompletedItems([phase]);

  return (
    <Card className="sf-phase-card" padded={false}>
      <button
        type="button"
        className="sf-phase-card__header"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div className="sf-phase-card__number">{String(index + 1).padStart(2, "0")}</div>
        <div className="sf-phase-card__heading">
          <div className="sf-phase-card__eyebrow mono">Phase {index + 1}</div>
          <h2>{phase.title}</h2>
          {phase.description && <p>{phase.description}</p>}
          <div className="sf-phase-card__meta">
            <Badge tone="neutral">
              <ListChecks size={13} /> {items.length} {items.length === 1 ? "item" : "items"}
            </Badge>
            {phase.estimated_weeks && (
              <Badge tone="blue">
                <Clock size={13} /> {phase.estimated_weeks} {phase.estimated_weeks === 1 ? "week" : "weeks"}
              </Badge>
            )}
            {completed > 0 && <Badge tone="teal">{completed} completed</Badge>}
          </div>
        </div>
        <span className={`sf-phase-card__chevron${open ? " sf-phase-card__chevron--open" : ""}`} aria-hidden="true">
          <ChevronDown size={20} />
        </span>
      </button>

      {open && (
        <div className="sf-phase-card__body">
          {items.length > 0 ? (
            items.map((item) => <RoadmapItemCard key={item.id} item={item} />)
          ) : (
            <p className="sf-phase-card__empty">No items were added to this phase.</p>
          )}
        </div>
      )}
    </Card>
  );
}
