import { Check, Clock3, Code2, Dumbbell, ExternalLink, GraduationCap, Hammer, RotateCcw, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Card } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import "./MissionCard.css";

const TYPE = {
  learn: { label: "Learn", icon: GraduationCap },
  practice: { label: "Practice", icon: Dumbbell },
  build: { label: "Build", icon: Hammer },
  review: { label: "Review", icon: RotateCcw },
  challenge: { label: "Challenge", icon: Code2 },
};
const STATUS = { pending: "Pending", in_progress: "In progress", completed: "Completed", skipped: "Skipped" };

export default function MissionCard({ mission, onStatus, busy }) {
  const type = TYPE[mission.type] || TYPE.practice;
  const Icon = type.icon;
  const completed = mission.status === "completed";
  return (
    <Card className={`sf-mission-card ${completed ? "is-completed" : ""}`}>
      <div className="sf-mission-card__top">
        <div className="sf-mission-card__icon"><Icon size={19} /></div>
        <div className="sf-mission-card__badges">
          <Badge tone="blue">{type.label}</Badge>
          <Badge tone={mission.difficulty === "advanced" ? "amber" : mission.difficulty === "intermediate" ? "blue" : "teal"}>{mission.difficulty}</Badge>
        </div>
        <span className="sf-mission-card__time"><Clock3 size={14} /> {mission.estimatedMinutes} min</span>
      </div>
      <div className="sf-mission-card__body">
        <div className="sf-mission-card__number">{mission.order}</div>
        <div className="sf-mission-card__content">
          <div className="sf-mission-card__title-row"><h3>{mission.title}</h3>{completed && <Check size={19} />}</div>
          <p>{mission.description}</p>
          {mission.skill && <div className="sf-mission-card__skill"><Sparkles size={13} /> {mission.skill.name}</div>}
          {mission.project && <Link className="sf-mission-card__project" to={`/projects/${mission.project.projectId}`}><Hammer size={13} /> {mission.project.title} <ExternalLink size={12} /></Link>}
        </div>
      </div>
      <div className="sf-mission-card__footer">
        <Badge tone={completed ? "teal" : mission.status === "in_progress" ? "blue" : "neutral"}>{STATUS[mission.status]}</Badge>
        <div className="sf-mission-card__actions">
          {mission.status === "pending" && <Button size="sm" onClick={() => onStatus(mission.missionId, "in_progress")} disabled={busy}>Start</Button>}
          {mission.status === "in_progress" && <Button size="sm" onClick={() => onStatus(mission.missionId, "completed")} disabled={busy}>Complete</Button>}
          {!completed && mission.status !== "skipped" && <Button size="sm" variant="ghost" onClick={() => onStatus(mission.missionId, "skipped")} disabled={busy}>Skip</Button>}
          {mission.status === "skipped" && <Button size="sm" variant="secondary" onClick={() => onStatus(mission.missionId, "pending")} disabled={busy}>Restore</Button>}
        </div>
      </div>
    </Card>
  );
}
