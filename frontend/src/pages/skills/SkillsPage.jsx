import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import CatalogLayout from "../../layouts/CatalogLayout.jsx";
import { getSkills } from "../../services/skillService.js";
import useRemoteData from "../../hooks/useRemoteData.js";
import SkillIcon from "../../components/skills/SkillIcon.jsx";
import { Field, Select } from "../../components/ui/Field.jsx";
import { Badge, Card } from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import { CATEGORY_STYLES, filterSkills, skillPresentation } from "../../utils/skillPresentation.js";
import "./SkillsPage.css";

export default function SkillsPage() {
  const { data, error, loading, reload } = useRemoteData(getSkills);
  const [params,setParams]=useSearchParams();
  const [search, setSearch] = useState(params.get('q')||"");
  const [group, setGroup] = useState("all");
  const skills = useMemo(() => filterSkills(data || [], search, group), [data, search, group]);
  return <CatalogLayout><header className="sf-page-heading"><div><span className="sf-eyebrow"><BookOpen size={16} aria-hidden="true" /> THE SKILL LIBRARY</span><h1>Your next chapter starts here.</h1><p>Explore practical skills, find trusted learning sources, and build a path that fits your career goals.</p></div>{data && <Badge tone="blue">{data.length} skills to explore</Badge>}</header>
    <Card className="sf-catalog-filters"><div className="sf-catalog-search"><Search size={18} aria-hidden="true" /><Field label="Search skills" type="search" value={search} onChange={(event) => {const value=event.target.value;setSearch(value);setParams(value?{q:value}:{},{replace:true});}} placeholder="Try coding, website making, React, design, or data analysis" /></div><Select label="Category" value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">All categories</option>{Object.entries(CATEGORY_STYLES).map(([key, category]) => <option key={key} value={key}>{category.label}</option>)}</Select></Card>
    {loading ? <Skeleton rows={6} label="Loading skill catalog" /> : error ? <ErrorState message={error.message} onRetry={reload} /> : <><p className="sf-catalog-count" role="status">{skills.length} {skills.length === 1 ? "skill" : "skills"}{search && ` matching “${search}”`}</p>{skills.length ? <div className="sf-skill-grid">{skills.map((skill) => <Link key={skill.skillId} to={`/skills/${skill.skillId}`} className="sf-skill-card"><div className="sf-skill-card__top"><SkillIcon skill={skill} /><ArrowUpRight size={18} aria-hidden="true" /></div><span className="sf-skill-card__category" style={{ color: skillPresentation(skill).color }}>{skillPresentation(skill).label}</span><h2>{skill.name}</h2><p>{skill.description || "Explore this skill and its learning resources."}</p><div className="sf-skill-card__footer"><Badge>{skill.difficulty || "All levels"}</Badge><span>Explore skill <span aria-hidden="true">→</span></span></div></Link>)}</div> : <EmptyState title="No matching skills" description="Try a different search or choose another category. The complete catalog is still available under All categories." />}</>}
  </CatalogLayout>;
}
