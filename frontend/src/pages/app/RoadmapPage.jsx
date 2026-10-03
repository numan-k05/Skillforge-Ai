import { useRef, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Map, RefreshCw, Sparkles, Trash2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppNav from "../../components/layout/AppNav.jsx";
import Button from "../../components/ui/Button.jsx";
import { Badge, Card } from "../../components/ui/Card.jsx";
import PhaseCard from "../../components/roadmap/PhaseCard.jsx";
import ConfirmDialog from "../../components/roadmap/ConfirmDialog.jsx";
import { ApiError } from "../../services/apiClient.js";
import * as aiApi from "../../services/aiService.js";
import * as roadmapApi from "../../services/roadmapService.js";
import { countCompletedItems, countRoadmapItems, formatStatus, statusTone, totalEstimatedHours } from "../../utils/roadmapHelpers.js";
import "./RoadmapPage.css";

const TIMELINE_OPTIONS = [4, 8, 12, 16, 24];

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [timelineWeeks, setTimelineWeeks] = useState("");
  const [aiStatus, setAiStatus] = useState({ loading: true, configured: false });

  const requestVersion = useRef(0);
  const fetchData = useCallback(async () => {
    const version = ++requestVersion.current;
    const commit = (update) => { if (version === requestVersion.current) update(); };
    try {
      const data = await roadmapApi.getRoadmap();
      commit(() => setError(null));
      commit(() => setRoadmapData(data));
      if (data?.roadmap?.target_weeks) commit(() => setTimelineWeeks(String(data.roadmap.target_weeks)));
    } catch (err) {
      commit(() => setError(err instanceof ApiError ? err : new ApiError(0, "Unable to load your roadmap.")));
    } finally { commit(() => setLoading(false)); }
  }, []);
  function loadRoadmap() {
    setLoading(true); setError(null);
    return fetchData();
  }

  useEffect(() => {
    fetchData();
    return () => { requestVersion.current += 1; };
  }, [fetchData]);

  useEffect(() => {
    let active = true;
    aiApi.getAIStatus()
      .then((data) => { if (active) setAiStatus({ loading: false, ...data?.ai }); })
      .catch(() => { if (active) setAiStatus({ loading: false, configured: false, mode: "fallback" }); });
    return () => { active = false; };
  }, []);

  async function runAction(name, fn) {
    setAction(name); setError(null);
    try {
      const result = await fn();
      if (result?.roadmap && result?.phases) {
        setRoadmapData(result);
        if (result.roadmap.target_weeks) setTimelineWeeks(String(result.roadmap.target_weeks));
      } else await loadRoadmap();
    } catch (err) { setError(err instanceof ApiError ? err : new ApiError(0, "The roadmap action failed.")); }
    finally { setAction(""); }
  }

  function generate() { runAction("generate", () => roadmapApi.generateRoadmap(timelineWeeks ? { timelineWeeks } : {})); }
  function regenerate() { runAction("regenerate", () => roadmapApi.regenerateRoadmap(roadmapData.roadmap.id, timelineWeeks ? { timelineWeeks } : {})); }
  function changeStatus(status) {
    if (status === roadmapData.roadmap.status) return;
    runAction("status", async () => {
      const result = await roadmapApi.updateRoadmapStatus(roadmapData.roadmap.id, status);
      return { ...roadmapData, roadmap: result.roadmap || result };
    });
  }
  function deleteRoadmap() { setDialog({ type: "delete" }); }
  async function confirmDelete() {
    setDialog(null); setAction("delete"); setError(null);
    try { await roadmapApi.deleteRoadmap(roadmapData.roadmap.id); setRoadmapData(null); }
    catch (err) { setError(err instanceof ApiError ? err : new ApiError(0, "Could not delete the roadmap.")); }
    finally { setAction(""); }
  }

  if (loading) return <RoadmapShell><RoadmapLoading /></RoadmapShell>;
  if (error && !roadmapData) return <RoadmapShell><RoadmapError error={error} onRetry={loadRoadmap} onGenerate={generate} busy={action === "generate"} navigate={navigate} aiConfigured={aiStatus.configured} /></RoadmapShell>;
  if (!roadmapData) return <RoadmapShell><RoadmapEmpty onGenerate={generate} busy={action === "generate"} navigate={navigate} aiConfigured={aiStatus.configured} timelineWeeks={timelineWeeks} setTimelineWeeks={setTimelineWeeks} /></RoadmapShell>;

  const roadmap = roadmapData.roadmap;
  const phases = roadmapData.phases || [];
  const totalItems = countRoadmapItems(phases);
  const completedItems = countCompletedItems(phases);
  const hours = totalEstimatedHours(phases);
  const completion = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;
  const generation = roadmapData.generation || { mode: "deterministic" };
  const isAi = generation.mode === "ai";

  return (
    <RoadmapShell>
      <header className="sf-roadmap__header sf-roadmap__header--full">
        <div>
          <p className="sf-roadmap__eyebrow mono">Personalized Roadmap</p>
          <h1>{roadmap.title || `${roadmap.career_title} Roadmap`}</h1>
          <p className="sf-roadmap__subtitle">{roadmap.description || "Your personalized learning plan, built from your current skills and career goal."}</p>
        </div>
        <div className="sf-roadmap__actions">
          <Button variant="secondary" onClick={regenerate} disabled={Boolean(action)} icon={<RefreshCw size={15} />}>
            {action === "regenerate" ? "Regenerating…" : isAi ? "Regenerate roadmap" : "Regenerate roadmap"}
          </Button>
          <Button variant="ghost" onClick={() => navigate("/careers")} disabled={Boolean(action)}>Change career</Button>
          <Button variant="ghost" onClick={deleteRoadmap} disabled={Boolean(action)} icon={<Trash2 size={15} />}>Delete</Button>
        </div>
      </header>

      {error && <Card className="sf-roadmap__inline-error" role="alert"><span>{error.message}</span><Button variant="ghost" onClick={() => setError(null)}>Dismiss</Button></Card>}

      <Card className={`sf-roadmap__ai-banner ${isAi ? "sf-roadmap__ai-banner--live" : ""}`}>
        <div className="sf-roadmap__ai-icon"><Sparkles size={18} /></div>
        <div className="sf-roadmap__ai-copy">
          <strong>{isAi ? "AI-personalized roadmap" : "Smart roadmap engine"}</strong>
          <p>{isAi ? `Generated for your current profile and skill gaps${generation.model ? ` with ${generation.model}` : ""}. Regeneration re-checks your latest data.` : "Your roadmap is built from your current skill gaps and career requirements. Regenerate it when your skills or availability change."}</p>
        </div>
        <Badge tone={isAi ? "teal" : "blue"}><Zap size={12} /> {isAi ? "AI active" : "Database-driven"}</Badge>
      </Card>

      <section className="sf-roadmap__overview" aria-label="Roadmap overview">
        <Card className="sf-roadmap__hero-card">
          <div className="sf-roadmap__hero-top">
            <div className="sf-roadmap__hero-icon"><Map size={22} /></div>
            <div><span className="sf-roadmap__label">Career target</span><strong>{roadmap.career_title}</strong></div>
            <Badge tone={statusTone(roadmap.status)}>{formatStatus(roadmap.status)}</Badge>
          </div>
          <div className="sf-roadmap__hero-meta">
            {roadmap.weekly_hours && <span><Clock3 size={14} /> {roadmap.weekly_hours} hrs/week</span>}
            {roadmap.target_weeks && <span><Clock3 size={14} /> {roadmap.target_weeks} weeks</span>}
            <span><Sparkles size={14} /> Version {roadmap.version}</span>
          </div>
        </Card>
        <div className="sf-roadmap__stats">
          <Stat value={phases.length} label="Phases" />
          <Stat value={totalItems} label="Roadmap items" />
          <Stat value={hours} label="Estimated hours" />
          <Stat value={`${completion}%`} label="Completed" icon={<CheckCircle2 size={15} />} />
        </div>
      </section>

      <Card className="sf-roadmap__control-card">
        <div><span className="sf-roadmap__label">Plan controls</span><strong>Refine the next generation</strong><p>Choose a target timeline, then regenerate to rebuild the plan from your latest skills.</p></div>
        <div className="sf-roadmap__control-actions">
          <label><span>Target timeline</span><select value={timelineWeeks} onChange={(e) => setTimelineWeeks(e.target.value)} disabled={Boolean(action)}><option value="">Auto</option>{TIMELINE_OPTIONS.map((weeks) => <option key={weeks} value={weeks}>{weeks} weeks</option>)}</select></label>
          <Button onClick={regenerate} disabled={Boolean(action)} icon={<Sparkles size={15} />}>{action === "regenerate" ? "Generating…" : isAi ? "Regenerate plan" : "Regenerate plan"}</Button>
        </div>
      </Card>

      <Card className="sf-roadmap__status-card">
        <div><span className="sf-roadmap__label">Roadmap status</span><strong>{formatStatus(roadmap.status)}</strong><p>Change the plan status as your journey progresses.</p></div>
        <select value={roadmap.status} onChange={(e) => changeStatus(e.target.value)} disabled={Boolean(action)} aria-label="Roadmap status">
          <option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option>
        </select>
      </Card>

      <section className="sf-roadmap__phases" aria-label="Roadmap phases">
        <div className="sf-roadmap__section-heading"><div><p className="sf-roadmap__eyebrow mono">Your plan</p><h2>Work through each phase</h2></div><span>{completedItems} of {totalItems} items completed</span></div>
        {phases.map((phase, index) => <PhaseCard key={phase.id || `${phase.phase_order}-${phase.title}`} phase={phase} index={index} />)}
      </section>

      <ConfirmDialog open={dialog?.type === "delete"} title="Delete this roadmap?" message="This removes the saved roadmap and its phases. Your profile and skill analysis will not be affected." confirmLabel="Delete roadmap" danger busy={action === "delete"} onCancel={() => setDialog(null)} onConfirm={confirmDelete} />
    </RoadmapShell>
  );
}

function RoadmapShell({ children }) { return <div><AppNav /><main id="main-content" tabIndex="-1" className="container sf-roadmap">{children}</main></div>; }
function Stat({ value, label, icon }) { return <Card className="sf-roadmap__stat"><strong>{value}</strong><span>{icon}{label}</span></Card>; }
function RoadmapLoading() { return <div className="sf-roadmap__state" role="status" aria-live="polite"><div className="sf-roadmap__spinner" /><h2>Loading your roadmap…</h2><p>Fetching your latest personalized plan.</p></div>; }
function RoadmapError({ error, onRetry, onGenerate, busy, navigate, aiConfigured }) { const missing = error.status === 404 && error.details?.code === "NO_ACTIVE_ROADMAP"; return missing ? <RoadmapEmpty onGenerate={onGenerate} busy={busy} navigate={navigate} aiConfigured={aiConfigured} /> : <Card className="sf-roadmap__error" role="alert"><div className="sf-roadmap__state-icon">!</div><div><h2>We couldn't load your roadmap</h2><p>{error.message}</p><div className="sf-roadmap__state-actions"><Button variant="secondary" onClick={onRetry}>Try again</Button><Button variant="ghost" onClick={() => navigate("/skill-analysis")}>View skill analysis</Button></div></div></Card>; }
function RoadmapEmpty({ onGenerate, busy, navigate, aiConfigured, timelineWeeks, setTimelineWeeks }) { return <Card className="sf-roadmap__state sf-roadmap__empty"><div className="sf-roadmap__empty-icon"><Map size={28} /></div><h2>Build your personalized roadmap</h2><p>Turn your current skill gaps into an ordered learning plan with phases for learning, practice, projects, and readiness.</p><label className="sf-roadmap__empty-timeline"><span>Target timeline</span><select value={timelineWeeks} onChange={(e) => setTimelineWeeks(e.target.value)} disabled={busy}><option value="">Auto based on your weekly hours</option>{TIMELINE_OPTIONS.map((weeks) => <option key={weeks} value={weeks}>{weeks} weeks</option>)}</select></label><div className="sf-roadmap__state-actions"><Button onClick={onGenerate} disabled={busy} icon={<Sparkles size={15} />}>{busy ? "Generating…" : aiConfigured ? "Generate with AI" : "Generate roadmap"}</Button><Button variant="ghost" onClick={() => navigate("/skill-analysis")}>View skill analysis</Button></div></Card>; }
