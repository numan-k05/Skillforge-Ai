import { AccessBadge, unlockPath } from "../ui/ContentAccess.jsx";
import { Clock3, ExternalLink, Layers3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../ui/Card.jsx";
import "./ProjectCard.css";

const DIFFICULTY_TONES = { beginner: "teal", intermediate: "blue", advanced: "amber" };
const TYPE_LABELS = { practice: "Practice", portfolio: "Portfolio", capstone: "Capstone" };

export default function ProjectCard({ project, recommended = false }) {
  const userStatus = project.userProject?.status || project.status;
  return (
    <article className="sf-project-card">
      <div className="sf-project-card__top">
        <div className="sf-project-card__icon"><Layers3 size={20} /></div>
        <div className="sf-project-card__badges">
          <Badge tone={DIFFICULTY_TONES[project.difficulty] || "neutral"}>{project.difficulty}</Badge>
          <Badge tone="neutral">{TYPE_LABELS[project.projectType] || project.projectType}</Badge>
        </div>
      </div>
      <AccessBadge item={project}/><h3>{project.title}</h3>
      <p>{project.shortDescription || project.description}</p>
      {recommended && project.recommendation?.reason && <div className="sf-project-card__reason"><Sparkles size={14} />{project.recommendation.reason}</div>}
      <div className="sf-project-card__meta"><span><Clock3 size={14} /> {project.estimatedHours} hrs</span>{userStatus && userStatus !== "not_started" && <Badge tone={userStatus === "completed" ? "teal" : "blue"}>{userStatus.replace("_", " ")}</Badge>}</div>
      <div className="sf-project-card__skills">{(project.skills || []).slice(0, 4).map((skill) => <span key={skill.skillId}>{skill.name}</span>)}{(project.skills || []).length > 4 && <span>+{project.skills.length - 4}</span>}</div>
      <Link className="sf-project-card__link" to={project.hasAccess===false?unlockPath(project):`/projects/${project.projectId}`}>{project.hasAccess===false?"Unlock project":"View project"} <ExternalLink size={14} /></Link>
    </article>
  );
}
