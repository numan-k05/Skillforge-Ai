import { AccessBadge, UnlockButton } from "../../components/ui/ContentAccess.jsx";
import { useRef, useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, FileCheck2, Layers3, Play, Target } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AppNav from "../../components/layout/AppNav.jsx";
import Button from "../../components/ui/Button.jsx";
import { Badge, Card } from "../../components/ui/Card.jsx";
import * as projectApi from "../../services/projectService.js";
import { ApiError } from "../../services/apiClient.js";
import "./ProjectDetailsPage.css";

const STATUS = { not_started:"Not started", in_progress:"In progress", completed:"Completed (self-reported)", paused:"Paused" };

function ProjectDetailsPageContent() {
  const { id } = useParams(); const navigate = useNavigate();
  const [project,setProject]=useState(null); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const requestVersion = useRef(0);
  const fetchData = useCallback(async () => {
    const version = ++requestVersion.current;
    const commit = (update) => { if (version === requestVersion.current) update(); };
    try{const result = await projectApi.getProject(id); commit(() => setProject(result));}catch(e){commit(() => setError(e instanceof ApiError?e.message:"Could not load this project."));}finally{commit(() => setLoading(false))}}, [id]);
  function load() {setLoading(true);setError("");return fetchData();
  }

  useEffect(() => {
    fetchData();
    return () => { requestVersion.current += 1; };
  }, [fetchData]);
  async function setStatus(status){setBusy(true);setError("");try{const result=await projectApi.updateProjectStatus(id,status);setProject(result.project||project)}catch(e){setError(e instanceof ApiError?e.message:"Could not update project status.")}finally{setBusy(false)}}
  async function start(){setBusy(true);setError("");try{const result=await projectApi.startProject(id);setProject(result.project||project)}catch(e){setError(e instanceof ApiError?e.message:"Could not start project.")}finally{setBusy(false)}}
  if(loading)return <PageState text="Loading project…"/>;
  if(error&&!project)return <PageState text={error} error onRetry={load}/>;
  const status=project.userProject?.status||"not_started";
  return <div><AppNav/><main id="main-content" tabIndex="-1" className="container sf-project-detail">
    <Button variant="ghost" onClick={()=>navigate("/projects")} icon={<ArrowLeft size={15}/>} iconPosition="left">Back to projects</Button>
    {error&&<Card className="sf-project-detail__alert">{error}</Card>}
    <header className="sf-project-detail__header"><div><div className="sf-project-detail__eyebrow"><Layers3 size={15}/> Project brief</div><AccessBadge item={project}/><h1>{project.title}</h1><p>{project.description||project.shortDescription}</p><div className="sf-project-detail__badges"><Badge tone="blue">{project.difficulty}</Badge><Badge tone="neutral">{project.projectType}</Badge><Badge tone={status==="completed"?"teal":"neutral"}>{STATUS[status]}</Badge></div></div><div className="sf-project-detail__cta">{project.hasAccess===false?<UnlockButton item={project}/>:status==="not_started"?<Button onClick={start} disabled={busy} icon={<Play size={15}/>}>{busy?"Starting…":"Start project"}</Button>:status!=="completed"?<Button onClick={()=>setStatus("completed")} disabled={busy} icon={<CheckCircle2 size={15}/>}>{busy?"Saving…":"Mark completed"}</Button>:<Badge tone="teal"><CheckCircle2 size={14}/> Completed</Badge>}</div></header>
    <section className="sf-project-detail__layout"><div className="sf-project-detail__main">
      <Card><div className="sf-project-detail__card-title"><Target size={18}/><h2>Skills you'll practice</h2></div><div className="sf-project-detail__skills">{(project.skills||[]).map(s=><div key={s.skillId}><strong>{s.name}</strong><span>{s.category}</span></div>)}</div></Card>
      <Card><div className="sf-project-detail__card-title"><CheckCircle2 size={18}/><h2>Milestones</h2></div>{project.hasAccess===false&&<p>Locked. Unlock the matching Skill Pass or Career Bundle to see the project tasks and submit your work.</p>}<div className="sf-project-detail__milestones">{(project.milestones||[]).map((m,i)=><div className="sf-project-detail__milestone" key={m.milestoneId}><div className="sf-project-detail__number">{i+1}</div><div><strong>{m.title}</strong><p>{m.description}</p><span><Clock3 size={13}/> {m.estimatedHours} hrs</span></div></div>)}</div></Card>
    </div><aside><Card className="sf-project-detail__side"><span className="sf-project-detail__label">Estimated effort</span><strong className="sf-project-detail__hours">{project.estimatedHours} hrs</strong><span className="sf-project-detail__side-note">Designed as a focused build for your learning path.</span><hr/><span className="sf-project-detail__label">Related careers</span><div className="sf-project-detail__careers">{(project.careers||[]).map(c=><Badge key={c.careerId} tone="neutral">{c.title}</Badge>)}</div><hr/><span className="sf-project-detail__label">Update status</span><select value={status} disabled={busy||project.hasAccess===false} onChange={e=>setStatus(e.target.value)}>{Object.entries(STATUS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>{project.hasAccess!==false&&status!=="not_started"&&<><hr/><Button to={`/projects/${project.projectId}/evidence`} variant="secondary" icon={<FileCheck2 size={15}/>}>Submit evidence</Button></>}</Card></aside></section>
  </main></div>;
}
function PageState({text,error,onRetry}){return <div><AppNav/><main id="main-content" tabIndex="-1" className="container sf-project-detail__state"><Card><h2>{error?"Project unavailable":"Loading project"}</h2><p>{text}</p>{onRetry&&<Button variant="secondary" onClick={onRetry}>Try again</Button>}</Card></main></div>}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  return <ProjectDetailsPageContent key={id} />;
}
