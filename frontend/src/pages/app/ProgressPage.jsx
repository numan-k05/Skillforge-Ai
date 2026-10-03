import { useRef, useCallback, useEffect, useState } from "react";
import {
  Award, BarChart3, CheckCircle2, ClipboardList, Code2, Flag, Layers3,
  Map, RefreshCw, Sparkles, TrendingUp,
} from "lucide-react";
import AppNav from "../../components/layout/AppNav.jsx";
import Button from "../../components/ui/Button.jsx";
import { Card, Badge } from "../../components/ui/Card.jsx";
import { ApiError } from "../../services/apiClient.js";
import * as progressApi from "../../services/progressService.js";
import * as careerReadinessApi from "../../services/careerReadinessService.js";
import "./ProgressPage.css";

const labelFor = {
  roadmap_item_completed: "Roadmap item completed",
  project_completed: "Project completed",
  mission_completed: "Mission completed",
  challenge_completed: "Challenge completed",
  skill_level_increased: "Skill level increased",
};

function number(value) {
  return Number(value) || 0;
}

function percent(value) {
  return Math.max(0, Math.min(100, Math.round(number(value))));
}

function formatWhen(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Recently" : date.toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

function eventDescription(event) {
  const metadata = event.metadata || {};
  if (metadata.title) return metadata.title;
  if (event.event_type === "skill_level_increased" && metadata.to_level != null) {
    return `Reached level ${metadata.to_level}${metadata.from_level != null ? ` from level ${metadata.from_level}` : ""}`;
  }
  if (metadata.mission_date) return `Completed for ${formatWhen(metadata.mission_date)}`;
  if (metadata.attempts_count != null) return `${metadata.attempts_count} attempt${number(metadata.attempts_count) === 1 ? "" : "s"}`;
  return "A meaningful milestone was recorded.";
}

function completionForChallenges(challenges) {
  const started = number(challenges?.started);
  return started ? percent((number(challenges?.completed) / started) * 100) : 0;
}

export default function ProgressPage() {
  const [state, setState] = useState({ status: "loading", data: null, error: "" });

  const requestVersion = useRef(0);
  const fetchData = useCallback(async () => {
    const version = ++requestVersion.current;
    const commit = (update) => { if (version === requestVersion.current) update(); };
    try {
      // Keep each endpoint independently connected. Overview gives the unified
      // calculation, while the detail endpoints power the transparent breakdown.
      const [overview, history, roadmap, projects, missions, challenges, skills] = await Promise.all([
        progressApi.getOverview(),
        progressApi.getHistory(),
        progressApi.getRoadmapProgress(),
        progressApi.getProjectProgress(),
        progressApi.getMissionProgress(),
        progressApi.getChallengeProgress(),
        progressApi.getSkillProgress(),
      ]);

      let readiness = null;
      try {
        readiness = await careerReadinessApi.getCareerReadinessOverview();
      } catch {
        // Progress is still useful before a career goal has been selected.
      }
      commit(() => setState({ status: "ready", error: "", data: { overview, history, roadmap, projects, missions, challenges, skills, readiness } }));
    } catch (error) {
      commit(() => setState({
        status: "error",
        data: null,
        error: error instanceof ApiError ? error.message : "Could not load your progress right now.",
      }));
    }
  }, []);
  function load() {
    setState((current) => ({ ...current, status: "loading", error: "" }));
    return fetchData();
  }

  useEffect(() => {
    fetchData();
    return () => { requestVersion.current += 1; };
  }, [fetchData]);

  return (
    <div>
      <AppNav />
      <main id="main-content" tabIndex="-1" className="container sf-progress">
        <header className="sf-progress__hero">
          <div>
            <div className="sf-progress__eyebrow"><TrendingUp size={15} /> Your learning journey</div>
            <h1>Progress</h1>
            <p>See the real work you have completed across your roadmap, projects, missions, challenges, and skills.</p>
          </div>
          <Button variant="secondary" onClick={load} disabled={state.status === "loading"} icon={<RefreshCw className={state.status === "loading" ? "spin" : ""} size={15} />}>
            Refresh
          </Button>
        </header>

        {state.status === "loading" && <LoadingState />}
        {state.status === "error" && <ErrorState message={state.error} onRetry={load} />}
        {state.status === "ready" && <ProgressContent data={state.data} />}
      </main>
    </div>
  );
}

function LoadingState() {
  return <Card className="sf-progress__state"><RefreshCw className="spin" size={24} /><h2>Loading your progress…</h2><p>Collecting milestones from your SkillForge journey.</p></Card>;
}

function ErrorState({ message, onRetry }) {
  return <Card className="sf-progress__state sf-progress__state--error" role="alert"><Flag size={24} /><h2>Progress is unavailable</h2><p>{message}</p><Button variant="secondary" onClick={onRetry}>Try again</Button></Card>;
}

function ProgressContent({ data }) {
  const overall = percent(data.overview?.overall?.overall);
  const components = data.overview?.overall?.components || {};
  const roadmap = Array.isArray(data.roadmap) ? data.roadmap : [];
  const history = Array.isArray(data.history) ? data.history : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const activeRoadmap = roadmap.find((item) => item.status === "active") || roadmap[0];
  const stats = [
    { label: "Roadmap", value: percent(activeRoadmap?.completion ?? components.roadmap), detail: activeRoadmap ? `${number(activeRoadmap.completed_items)} of ${number(activeRoadmap.total_items)} items` : "No roadmap yet", icon: Map, tone: "blue", to: "/roadmap" },
    { label: "Projects", value: percent(data.projects?.completion ?? components.projects), detail: `${number(data.projects?.completed)} of ${number(data.projects?.total)} completed`, icon: Layers3, tone: "violet", to: "/projects" },
    { label: "Missions", value: percent(data.missions?.completion ?? components.missions), detail: `${number(data.missions?.completed)} of ${number(data.missions?.total)} completed`, icon: Sparkles, tone: "teal", to: "/missions" },
    { label: "Challenges", value: completionForChallenges(data.challenges), detail: `${number(data.challenges?.completed)} of ${number(data.challenges?.started)} completed`, icon: Code2, tone: "amber", to: "/challenges" },
  ];
  const totalMilestones = stats.reduce((total, item) => total + (item.label === "Roadmap" ? number(activeRoadmap?.completed_items) : item.label === "Projects" ? number(data.projects?.completed) : item.label === "Missions" ? number(data.missions?.completed) : number(data.challenges?.completed)), 0);

  return <>
    <section className="sf-progress__overview" aria-label="Overall progress">
      <Card className="sf-progress__score">
        <div className="sf-progress__score-ring" style={{ "--progress": `${overall}%` }} aria-label={`${overall}% overall progress`}><div><strong>{overall}%</strong><span>overall</span></div></div>
        <div><div className="sf-progress__section-label"><BarChart3 size={15} /> Unified progress</div><h2>Keep building momentum</h2><p>Your overall progress is an average of the progress signals you have actually created. Nothing is estimated or invented.</p></div>
      </Card>
      <Card className="sf-progress__milestones"><Award size={22} /><span>Completed milestones</span><strong>{totalMilestones}</strong><p>across active learning activities</p></Card>
    </section>

    {data.readiness && <CareerReadinessCard readiness={data.readiness} />}

    <section className="sf-progress__stat-grid" aria-label="Progress by activity">
      {stats.map((stat) => <ProgressStat key={stat.label} {...stat} />)}
    </section>

    <section className="sf-progress__content-grid">
      <Card className="sf-progress__panel sf-progress__panel--activity">
        <div className="sf-progress__panel-heading"><div><div className="sf-progress__section-label"><ClipboardList size={15} /> Recent activity</div><h2>Your timeline</h2></div><Badge tone="neutral">{history.length} milestone{history.length === 1 ? "" : "s"}</Badge></div>
        <Timeline history={history} />
      </Card>
      <Card className="sf-progress__panel">
        <div className="sf-progress__panel-heading"><div><div className="sf-progress__section-label"><CheckCircle2 size={15} /> Skill development</div><h2>Skills you are building</h2></div><Badge tone="neutral">{skills.length} tracked</Badge></div>
        <SkillsList skills={skills} />
      </Card>
    </section>

    <section className="sf-progress__roadmaps">
      <div className="sf-progress__section-heading"><div><div className="sf-progress__section-label"><Map size={15} /> Roadmap status</div><h2>Your roadmaps</h2></div></div>
      {roadmap.length ? <div className="sf-progress__roadmap-grid">{roadmap.map((item) => <RoadmapCard key={item.id} roadmap={item} />)}</div> : <EmptyPanel icon={<Map size={24} />} title="No roadmap progress yet" detail="Create a personalized roadmap to start seeing completed learning steps here." to="/roadmap" action="Open Roadmap" />}
    </section>
  </>;
}

function CareerReadinessCard({ readiness }) {
  const coverage = readiness.skillCoverage || {};
  const score = percent(readiness.score);
  return <Card className="sf-progress__readiness"><div className="sf-progress__readiness-score"><div className="sf-progress__score-ring sf-progress__score-ring--small" style={{ "--progress": `${score}%` }}><div><strong>{score}%</strong><span>ready</span></div></div><div><div className="sf-progress__section-label"><Award size={15} /> Career readiness</div><h2>{readiness.career}</h2><p>{readiness.methodology}</p></div></div><div className="sf-progress__readiness-stats"><span><strong>{number(coverage.strongCount)}</strong> strong</span><span><strong>{number(coverage.developingCount)}</strong> developing</span><span><strong>{number(coverage.missingCount)}</strong> missing</span><Button to="/skill-analysis" variant="secondary" size="sm">Improve score</Button></div></Card>;
}

function ProgressStat({ label, value, detail, icon: Icon, tone, to }) {
  return <Card className={`sf-progress-stat sf-progress-stat--${tone}`}><div className="sf-progress-stat__icon"><Icon size={19} /></div><div className="sf-progress-stat__heading"><span>{label}</span><strong>{value}%</strong></div><div className="sf-progress__bar"><i style={{ width: `${value}%` }} /></div><p>{detail}</p><Button to={to} variant="ghost" size="sm">View {label}</Button></Card>;
}

function Timeline({ history }) {
  if (!history.length) return <EmptyPanel compact icon={<TrendingUp size={22} />} title="Your timeline will appear here" detail="Complete a roadmap step, project, mission, challenge, or skill level to record a milestone." />;
  return <ol className="sf-progress__timeline">{history.map((event) => <li key={event.id}><span className="sf-progress__timeline-dot" /><div><strong>{labelFor[event.event_type] || "Progress updated"}</strong><p>{eventDescription(event)}</p></div><time dateTime={event.occurred_at}>{formatWhen(event.occurred_at)}</time></li>)}</ol>;
}

function SkillsList({ skills }) {
  if (!skills.length) return <EmptyPanel compact icon={<Award size={22} />} title="No skills tracked yet" detail="Complete your profile and skill analysis to begin tracking development." to="/skill-analysis" action="Open Skill Analysis" />;
  return <div className="sf-progress__skills">{skills.slice(0, 8).map((skill) => { const level = number(skill.proficiency_level); return <div className="sf-progress__skill" key={skill.skill_id}><div><strong>{skill.name}</strong><span>{skill.category || "Skill"}</span></div><div className="sf-progress__skill-level"><div className="sf-progress__bar"><i style={{ width: `${percent((level / 5) * 100)}%` }} /></div><span>Level {level}/5</span></div></div>; })}</div>;
}

function RoadmapCard({ roadmap }) {
  const completion = percent(roadmap.completion);
  return <Card className="sf-progress__roadmap-card"><div className="sf-progress__roadmap-top"><Badge tone={roadmap.status === "active" ? "teal" : "neutral"}>{roadmap.status || "saved"}</Badge><strong>{completion}%</strong></div><h3>{roadmap.career_title || "Career roadmap"}</h3><p>{number(roadmap.completed_items)} completed · {number(roadmap.in_progress_items)} in progress · {number(roadmap.total_items)} total items</p><div className="sf-progress__bar"><i style={{ width: `${completion}%` }} /></div><small>{number(roadmap.target_weeks)} week plan · {number(roadmap.weekly_hours)} hrs/week</small></Card>;
}

function EmptyPanel({ icon, title, detail, to, action, compact = false }) {
  return <div className={`sf-progress__empty${compact ? " sf-progress__empty--compact" : ""}`}>{icon}<div><h3>{title}</h3><p>{detail}</p>{to && <Button to={to} variant="secondary" size="sm">{action}</Button>}</div></div>;
}
