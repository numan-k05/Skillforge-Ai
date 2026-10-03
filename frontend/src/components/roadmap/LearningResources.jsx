import { useEffect, useState } from "react";
import { BookOpen, ExternalLink, FileText, GraduationCap, LoaderCircle, TerminalSquare } from "lucide-react";
import * as learningResourceApi from "../../services/learningResourceService.js";
import "./LearningResources.css";

const TYPE_ICON = { course: GraduationCap, documentation: FileText, video: BookOpen, tutorial: BookOpen, practice: TerminalSquare, project: TerminalSquare };
const TYPE_LABEL = { course: "Course", documentation: "Documentation", video: "Video", tutorial: "Tutorial", practice: "Practice", project: "Project" };

export default function LearningResources({ roadmapItemId, skillName }) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    let live = true;
    learningResourceApi.getResourcesForRoadmapItem(roadmapItemId, { limit: 3 })
      .then((data) => { if (live) setState({ loading: false, data, error: "" }); })
      .catch((error) => { if (live) setState({ loading: false, data: null, error: error.message || "Unable to load resources." }); });
    return () => { live = false; };
  }, [roadmapItemId]);

  if (state.loading) return <section className="sf-learning-resources" aria-live="polite"><div className="sf-learning-resources__heading"><BookOpen size={16} /><strong>Recommended learning resources</strong></div><p className="sf-learning-resources__loading"><LoaderCircle size={14} /> Finding verified resources…</p></section>;
  if (state.error) return <section className="sf-learning-resources" aria-live="polite"><div className="sf-learning-resources__heading"><BookOpen size={16} /><strong>Recommended learning resources</strong></div><p className="sf-learning-resources__error">{state.error}</p></section>;
  if (!state.data?.resources?.length) return <section className="sf-learning-resources"><div className="sf-learning-resources__heading"><BookOpen size={16} /><strong>Recommended learning resources</strong></div><p className="sf-learning-resources__empty">No verified resources are available for {skillName} yet.</p></section>;

  return (
    <section className="sf-learning-resources" aria-label={`Recommended resources for ${skillName}`}>
      <div className="sf-learning-resources__heading"><BookOpen size={16} /><strong>Recommended learning resources</strong></div>
      <div className="sf-learning-resources__list">
        {state.data.resources.map((resource) => {
          const Icon = TYPE_ICON[resource.resourceType] || BookOpen;
          return <article className="sf-learning-resource" key={resource.id}>
            <Icon className="sf-learning-resource__icon" size={17} aria-hidden="true" />
            <div className="sf-learning-resource__content">
              <span className="sf-learning-resource__type">{TYPE_LABEL[resource.resourceType] || resource.resourceType}</span>
              <strong>{resource.title}</strong>
              <p>{resource.provider} · {resource.difficulty}{resource.estimatedHours ? ` · ${resource.estimatedHours} hrs` : ""}{resource.isFree ? " · Free" : ""}</p>
            </div>
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="sf-learning-resource__link">
              {resource.resourceType === "documentation" ? "Read" : "Start"}<ExternalLink size={13} />
            </a>
          </article>;
        })}
      </div>
    </section>
  );
}
