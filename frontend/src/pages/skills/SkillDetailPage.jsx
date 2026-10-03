import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, Clock3, ShieldCheck } from "lucide-react";
import CatalogLayout from "../../layouts/CatalogLayout.jsx";
import { useAuth } from "../../context/auth.js";
import { getSkill } from "../../services/skillService.js";
import { getResourcesForSkill } from "../../services/learningResourceService.js";
import useRemoteData from "../../hooks/useRemoteData.js";
import SkillIcon from "../../components/skills/SkillIcon.jsx";
import Button from "../../components/ui/Button.jsx";
import { Card, Badge } from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import "./SkillsPage.css";
import {setPageMeta} from '../../utils/seo.js';

function Resources({ id }) {
  const [page, setPage] = useState(1);
  const fetchResources = useCallback(() => getResourcesForSkill(id, { page, limit: 6 }), [id, page]);
  const { data, error, loading, reload } = useRemoteData(fetchResources);
  if (loading) return <Skeleton label="Loading learning resources" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data.resources.length) return <EmptyState title="No resources listed yet" description="This skill is in the catalog. Learning sources will appear here when they are added." />;
  return <><div className="sf-resource-grid">{data.resources.map((resource) => <Card key={resource.id} className="sf-resource-card"><div className="sf-inline-actions"><Badge tone="blue">{resource.resourceType}</Badge><Badge>{resource.isFree ? "Free resource" : "Provider pricing"}</Badge></div><h3>{resource.title}</h3><p>{resource.description}</p><span className="sf-resource-card__source">Source: {resource.provider}</span><div className="sf-inline-actions"><span>{resource.difficulty}</span>{resource.estimatedHours && <span><Clock3 size={14} aria-hidden="true" /> {resource.estimatedHours}h estimated</span>}</div><Button variant="secondary" href={resource.url} target="_blank" rel="noopener noreferrer" icon={<ExternalLink size={15} aria-hidden="true" />}>Open original source<span className="visually-hidden"> (opens in a new tab)</span></Button></Card>)}</div>{data.pagination.totalPages > 1 && <nav className="sf-pagination" aria-label="Resource pages"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span>Page {page} of {data.pagination.totalPages}</span><Button variant="secondary" disabled={page >= data.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></nav>}</>;
}

export default function SkillDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const fetchSkill = useCallback(() => getSkill(id), [id]);
  const { data: skill, error, loading, reload } = useRemoteData(fetchSkill);
  useEffect(()=>{if(skill)setPageMeta({title:`Learn ${skill.name}`,description:`Explore ${skill.name}, related learning resources, difficulty, and connected career paths on SkillForge AI.`,type:'article',structuredData:true});},[skill]);
  return <CatalogLayout><Button variant="ghost" to="/skills" icon={<ArrowLeft size={16} />} iconPosition="left">All skills</Button>{loading ? <Skeleton label="Loading skill" /> : error ? <ErrorState title={error.status === 404 ? "Skill not found" : undefined} message={error.message} onRetry={reload} /> : <><header className="sf-skill-detail-hero"><SkillIcon skill={skill} size={34} /><div><span className="sf-eyebrow">{skill.category}</span><h1>{skill.name}</h1><p>{skill.description}</p><div className="sf-inline-actions"><Badge tone="blue">{skill.difficulty || "All levels"}</Badge>{skill.skillType && <Badge>{skill.skillType}</Badge>}</div></div></header><div className="sf-skill-detail-callout"><div><ShieldCheck size={22} aria-hidden="true" /><p>Learning starts with a clear direction.<span>Explore career requirements and build a personalized roadmap from your skill gaps.</span></p></div><Button to={isAuthenticated ? "/careers" : "/signup"} icon={<ArrowRight size={16} />}>{isAuthenticated ? "Explore careers" : "Build my learning path"}</Button></div><section className="sf-resource-section" aria-labelledby="resources-title"><header><h2 id="resources-title"><BookOpen size={22} aria-hidden="true" /> Learning resources</h2><p>Content belongs to its original creators. Links open at the provider; SkillForge does not independently verify external watch time.</p></header>{isAuthenticated ? <Resources key={id} id={id} /> : <EmptyState title="Keep your learning in one place" description="Log in to browse the existing resource catalog for this skill." action={<Button to="/login">Log in to view resources</Button>} />}</section></>}
  </CatalogLayout>;
}
