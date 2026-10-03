import { BookOpen, BriefcaseBusiness, CheckCircle2, Circle, ClipboardCheck, Code2, Clock3 } from "lucide-react";
import { Badge } from "../ui/Card.jsx";
import { formatItemType, itemTypeTone, priorityTone } from "../../utils/roadmapHelpers.js";
import LearningResources from "./LearningResources.jsx";
import "./RoadmapItemCard.css";

const ICONS = { learning: BookOpen, practice: Code2, project: BriefcaseBusiness, assessment: ClipboardCheck };

export default function RoadmapItemCard({ item }) {
  const Icon = ICONS[item.item_type] || BookOpen;
  const completed = item.status === "completed";

  return (
    <article className={`sf-roadmap-item${completed ? " sf-roadmap-item--completed" : ""}`}>
      <div className={`sf-roadmap-item__icon sf-roadmap-item__icon--${item.item_type || "learning"}`}>
        <Icon size={18} />
      </div>
      <div className="sf-roadmap-item__content">
        <div className="sf-roadmap-item__badges">
          <Badge tone={itemTypeTone(item.item_type)}>{formatItemType(item.item_type)}</Badge>
          {item.priority && <Badge tone={priorityTone(item.priority)}>{item.priority} priority</Badge>}
          {item.status && (
            <span className="sf-roadmap-item__status">
              {completed ? <CheckCircle2 size={13} /> : <Circle size={13} />}
              {item.status.replace("_", " ")}
            </span>
          )}
        </div>
        <h3>{item.title}</h3>
        {item.description && <p>{item.description}</p>}
        <div className="sf-roadmap-item__meta">
          {item.skill_name && <span className="mono">Skill: {item.skill_name}</span>}
          {item.estimated_hours && <span><Clock3 size={13} /> {item.estimated_hours} hrs</span>}
          {item.resource_note && <span>{item.resource_note}</span>}
        </div>
        {item.skill_id && <LearningResources roadmapItemId={item.id} skillName={item.skill_name} />}
      </div>
    </article>
  );
}
