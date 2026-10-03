import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Layers3, RefreshCw, Search, Sparkles } from "lucide-react";
import AppNav from "../../components/layout/AppNav.jsx";
import Button from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import ProjectCard from "../../components/projects/ProjectCard.jsx";
import * as projectApi from "../../services/projectService.js";
import { ApiError } from "../../services/apiClient.js";
import "./ProjectsPage.css";

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tab, setTab] = useState("recommended");

  const requestVersion = useRef(0);
  const fetchData = useCallback(async () => {
    const version = ++requestVersion.current;
    const commit = (update) => { if (version === requestVersion.current) update(); };
    try {
      const [all, mineList] = await Promise.all([projectApi.getProjects(), projectApi.getMyProjects()]);
      commit(() => setError(null));

      commit(() => setProjects(all)); commit(() => setMine(mineList));
    } catch (err) {
      commit(() => setError(err instanceof ApiError ? err : new ApiError(0, "Could not load projects.")));
    } finally { commit(() => setLoading(false)); }
    commit(() => setRecommendationLoading(true));
    try { const data = await projectApi.getRecommendedProjects(8); commit(() => setRecommended(data.projects || [])); }
    catch { commit(() => setRecommended([])); }
    finally { commit(() => setRecommendationLoading(false)); }
  }, []);
  function load() {
    setLoading(true); setError(null);
    return fetchData();
  }

  useEffect(() => {
    fetchData();
    return () => { requestVersion.current += 1; };
  }, [fetchData]);

  const visible = useMemo(() => {
    const source = tab === "recommended" ? recommended : tab === "mine" ? mine : projects;
    const term = search.trim().toLowerCase();
    return source.filter((p) => {
      const matchesDifficulty = !difficulty || p.difficulty === difficulty;
      const text = `${p.title} ${p.shortDescription || ""} ${p.description || ""} ${(p.skills || []).map(s => s.name).join(" ")}`.toLowerCase();
      return matchesDifficulty && (!term || text.includes(term));
    });
  }, [tab, recommended, mine, projects, search, difficulty]);

  const inProgress = mine.filter((p) => p.status === "in_progress").length;
  const completed = mine.filter((p) => p.status === "completed").length;

  return <div><AppNav /><main id="main-content" tabIndex="-1" className="container sf-projects">
    <header className="sf-projects__header">
      <div><p className="sf-projects__eyebrow mono">Build Lab</p><h1>Projects</h1><p className="sf-projects__subtitle">Turn your skill gaps into real things you can build, practice, and add to your portfolio.</p></div>
      <Button variant="secondary" onClick={load} disabled={loading || recommendationLoading} icon={<RefreshCw size={15} />}>Refresh</Button>
    </header>

    <Card className="sf-projects__hero"><div className="sf-projects__hero-icon"><Sparkles size={23} /></div><div><strong>Projects matched to your career path</strong><p>SkillForge ranks projects using your career target, current skill gaps, and project progress.</p></div><div className="sf-projects__hero-stats"><span><strong>{inProgress}</strong> active</span><span><strong>{completed}</strong> completed</span></div></Card>

    <div className="sf-projects__tabs" role="tablist">
      <button className={tab === "recommended" ? "active" : ""} onClick={() => setTab("recommended")}>For you <Sparkles size={14} /></button>
      <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>All projects</button>
      <button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>My projects</button>
    </div>

    <div className="sf-projects__filters"><label className="sf-projects__search"><Search size={16}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search projects or skills…" /></label><label className="sf-projects__difficulty"><Filter size={15}/><select value={difficulty} onChange={(e)=>setDifficulty(e.target.value)}><option value="">All levels</option>{DIFFICULTIES.map(d=><option key={d} value={d}>{d[0].toUpperCase()+d.slice(1)}</option>)}</select></label></div>

    {error && <Card className="sf-projects__error"><strong>Couldn't load projects</strong><p>{error.message}</p><Button variant="secondary" onClick={load}>Try again</Button></Card>}
    {loading && <ProjectState text="Loading your project catalog…" />}
    {!loading && !error && tab === "recommended" && recommendationLoading && <ProjectState text="Finding projects for your skill gaps…" />}
    {!loading && !error && !(tab === "recommended" && recommendationLoading) && visible.length === 0 && <ProjectState empty text={tab === "mine" ? "You haven't started any projects yet." : "No projects match your filters."} />}
    {!loading && !error && !(tab === "recommended" && recommendationLoading) && visible.length > 0 && <div className="sf-projects__grid">{visible.map(p=><ProjectCard key={p.projectId} project={p} recommended={tab === "recommended"} />)}</div>}
  </main></div>;
}
function ProjectState({ text, empty=false }) { return <Card className="sf-projects__state"><div className="sf-projects__state-icon"><Layers3 size={24}/></div><h2>{empty ? "Nothing here yet" : "Loading projects"}</h2><p>{text}</p></Card>; }
