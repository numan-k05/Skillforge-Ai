import { useEffect, useState } from "react";
import { Award, BookOpen, ClipboardCheck, Compass, Map, Target, Layers3, ArrowRight, Sparkles, TrendingUp, BriefcaseBusiness, LogOut, BadgeDollarSign, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth.js";
import * as profileApi from "../../services/profileService.js";
import * as careerReadinessApi from "../../services/careerReadinessService.js";
import * as roadmapApi from "../../services/roadmapService.js";
import * as projectApi from "../../services/projectService.js";
import * as missionApi from "../../services/missionService.js";
import * as dashboardApi from "../../services/dashboardService.js";
import * as progressApi from "../../services/progressService.js";
import * as portfolioApi from "../../services/portfolioService.js";
import { countCompletedItems, countRoadmapItems, totalEstimatedHours } from "../../utils/roadmapHelpers.js";
import { ApiError } from "../../services/apiClient.js";
import LearningAccessSummary from "../../components/layout/LearningAccessSummary.jsx";
import AppNav from "../../components/layout/AppNav.jsx";
import Button from "../../components/ui/Button.jsx";
import { Card, Badge } from "../../components/ui/Card.jsx";
import "../auth/AuthForm.css";
import "./DashboardPage.css";

const EMPTY_FORM = {
  university: "",
  degree: "",
  semester: "",
  country: "",
  careerGoal: "",
  weeklyHoursAvailable: "",
  learningGoals: "",
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [overview, setOverview] = useState({ status: "loading", data: null });

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await profileApi.getProfile();
        if (!active) return;
        setForm({
          university: data.university || "",
          degree: data.degree || "",
          semester: data.semester ? String(data.semester) : "",
          country: data.country || "",
          careerGoal: data.careerGoal || "",
          weeklyHoursAvailable: data.weeklyHoursAvailable ? String(data.weeklyHoursAvailable) : "",
          learningGoals: data.learningGoals || "",
        });
        setInterests(data.interests || []);
      } catch (err) {
        if (active) setError(err.message || "Could not load your profile.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    dashboardApi.getDashboardOverview()
      .then((data) => { if (active) setOverview({ status: "ready", data }); })
      .catch(() => { if (active) setOverview({ status: "error", data: null }); });
    return () => { active = false; };
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await profileApi.updateProfile({
        university: form.university || null,
        degree: form.degree || null,
        semester: form.semester ? Number(form.semester) : null,
        country: form.country || null,
        careerGoal: form.careerGoal || null,
        weeklyHoursAvailable: form.weeklyHoursAvailable ? Number(form.weeklyHoursAvailable) : null,
        learningGoals: form.learningGoals || null,
      });
      setForm({
        university: updated.university || "",
        degree: updated.degree || "",
        semester: updated.semester ? String(updated.semester) : "",
        country: updated.country || "",
        careerGoal: updated.careerGoal || "",
        weeklyHoursAvailable: updated.weeklyHoursAvailable ? String(updated.weeklyHoursAvailable) : "",
        learningGoals: updated.learningGoals || "",
      });
      setInterests(updated.interests || []);
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AppNav />
      <main id="main-content" tabIndex={-1} className="container sf-dashboard">
        <LearningAccessSummary/>
        <div className="sf-dashboard__header">
          <div>
            <p className="sf-dashboard__eyebrow mono">Dashboard</p>
            <h1>Welcome, {user?.name?.split(" ")[0] || "there"}</h1>
          </div>
          <Button variant="secondary" onClick={handleLogout} icon={<LogOut size={16} />} iconPosition="left">
            Log out
          </Button>
        </div>

        <section className="sf-dashboard-pricing" aria-label="Current pricing">
          <span className="sf-dashboard-pricing__icon" aria-hidden="true"><BadgeDollarSign size={21} /></span>
          <div>
            <strong>Free planning access is active</strong>
            <p>Skill Passes, Career Bundles, and monthly all-access unlock after manual payment approval.</p>
          </div>
          <Button to="/pricing" variant="secondary" size="md">View pricing</Button>
        </section>

        {user?.isOwnerAdmin && <section className="sf-dashboard-pricing" aria-label="Private owner administration">
          <span className="sf-dashboard-pricing__icon" aria-hidden="true"><ShieldCheck size={21} /></span>
          <div>
            <strong>Private owner administration</strong>
            <p>This control area is visible only to your configured owner account.</p>
          </div>
          <Button to="/admin" variant="secondary" size="md">Open administration</Button>
        </section>}

        {overview.data?.learningFocus ? <section className="sf-dashboard-welcome"><div><span className="sf-eyebrow"><Sparkles size={15} aria-hidden="true" /> YOUR SELECTED SKILL PASS</span><h2>Stay focused on {overview.data.learningFocus.skillName}.</h2><p>Your dashboard now shows the course, assessment, projects, careers, and certificate connected to this one Skill Pass.</p><div className="sf-inline-actions"><Button to={`/courses/${overview.data.learningFocus.courseId}`} icon={<ArrowRight size={16} />}>Continue course</Button><Button variant="secondary" to="/learning">Change selected course</Button></div></div><div className="sf-dashboard-welcome__art" aria-hidden="true"><BookOpen size={64} /><span>One skill. Clear next steps.</span></div></section> : <section className="sf-dashboard-welcome"><div><span className="sf-eyebrow"><Sparkles size={15} aria-hidden="true" /> YOUR NEXT STEP</span><h2>Choose one course to begin.</h2><p>Starting a course makes it your dashboard focus and keeps unrelated learning material out of the way.</p><div className="sf-inline-actions"><Button to="/courses" icon={<ArrowRight size={16} />}>Choose a course</Button><Button variant="secondary" to="/careers">Explore careers</Button></div></div><div className="sf-dashboard-welcome__art" aria-hidden="true"><Layers3 size={64} /><span>Choose. Focus. Complete.</span></div></section>}
        <div className="sf-dashboard__grid">
      <Card className="sf-dashboard__card">
        <h2>Your profile</h2>
        <p className="sf-dashboard__meta">{user?.email}</p>

        {loading ? (
          <p className="sf-dashboard__loading">Loading your profile…</p>
        ) : (
          <>
            <form onSubmit={handleSave}>
              {error && (
                <div className="sf-auth-form__alert" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="sf-dashboard__success" role="status">
                  {success}
                </div>
              )}

              <label className="sf-auth-form__field">
                <span>University</span>
                <input type="text" value={form.university} onChange={update("university")} />
              </label>

              <label className="sf-auth-form__field">
                <span>Degree</span>
                <input type="text" value={form.degree} onChange={update("degree")} />
              </label>

              <label className="sf-auth-form__field">
                <span>Semester</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.semester}
                  onChange={update("semester")}
                />
              </label>

              <label className="sf-auth-form__field">
                <span>Country</span>
                <input type="text" value={form.country} onChange={update("country")} />
              </label>

              <label className="sf-auth-form__field">
                <span>Career goal</span>
                <input
                  type="text"
                  value={form.careerGoal}
                  onChange={update("careerGoal")}
                  placeholder="e.g. Backend Engineer"
                />
              </label>

              <label className="sf-auth-form__field">
                <span>Hours you can commit per week</span>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={form.weeklyHoursAvailable}
                  onChange={update("weeklyHoursAvailable")}
                />
              </label>

              <label className="sf-auth-form__field">
                <span>Learning goals</span>
                <textarea rows={3} value={form.learningGoals} onChange={update("learningGoals")} />
              </label>

              <Button type="submit" variant="primary" size="md" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </form>

            {interests.length > 0 && (
              <div className="sf-dashboard__interests">
                <h3>Interests</h3>
                <div className="sf-dashboard__interests-list">
                  {interests.map((name) => (
                    <Badge key={name} tone="neutral">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <div className="sf-dashboard__side">
        {overview.status === "loading" && <Card className="sf-dashboard__card"><p className="sf-dashboard__loading">Loading your selected course…</p></Card>}
        {overview.data?.learningFocus ? <LearningFocusCard focus={overview.data.learningFocus} /> : <>
          <FocusCenterCard />
          <CareerPathCard careerGoal={form.careerGoal} loading={loading} />
          <SkillReadinessCard />
          <ProjectSummaryCard />
          <MissionSummaryCard />
          <RoadmapSummaryCard />
          <ProgressSummaryCard />
          <PortfolioSummaryCard />
        </>}
      </div>
        </div>
      </main>
    </div>
  );
}

function LearningFocusCard({ focus }) {
  return <Card className="sf-dashboard__card sf-learning-focus">
    <div className="sf-learning-focus__heading">
      <div><span className="sf-eyebrow"><BookOpen size={15} /> SELECTED SKILL PASS</span><h2>{focus.title}</h2><p>{focus.description}</p></div>
      <Badge tone="blue">{focus.skillName}</Badge>
    </div>

    <div className="sf-learning-focus__progress">
      <div><strong>{focus.completion}% complete</strong><span>{focus.completedLessons} of {focus.lessonCount} lessons</span></div>
      <div className="sf-progresssummarycard__track"><i style={{ width: `${focus.completion}%` }} /></div>
    </div>
    <div className="sf-inline-actions"><Button to={`/courses/${focus.courseId}`} icon={<ArrowRight size={15} />}>Continue course</Button><Button to="/learning" variant="secondary">Change selected course</Button></div>

    <section className="sf-learning-focus__section">
      <h3><ClipboardCheck size={17} /> Assessment</h3>
      {focus.assessments.length ? focus.assessments.map((assessment) => <div className="sf-learning-focus__item" key={assessment.id}><div><strong>{assessment.title}</strong><span>{assessment.questionCount} questions · Pass {assessment.passPercent}%</span></div><Button to={`/assessments/${assessment.id}`} variant="ghost" size="sm">Open</Button></div>) : <p>No assessment is linked to this course yet.</p>}
    </section>

    <section className="sf-learning-focus__section">
      <h3><Layers3 size={17} /> Skill projects</h3>
      {focus.projects.map((project) => <div className="sf-learning-focus__item" key={project.id}><div><strong>{project.title}</strong><span>{project.difficulty} · {project.estimatedHours} hours</span></div><Button to={`/projects/${project.id}`} variant="ghost" size="sm">Open</Button></div>)}
    </section>

    <section className="sf-learning-focus__section">
      <h3><BriefcaseBusiness size={17} /> Related careers</h3>
      {focus.careers.length ? <div className="sf-learning-focus__careers">{focus.careers.map((career) => <Button key={career.id} to={`/careers/${career.id}`} variant="ghost" size="sm">{career.title}</Button>)}</div> : <p>No career mapping is available for this skill yet.</p>}
    </section>

    {focus.certificate && <section className="sf-learning-focus__certificate"><Award size={20} /><div><strong>{focus.certificate.title}</strong><span>Complete this track’s lessons, assessment, projects, and readiness requirements.</span></div><Button to="/certificates" variant="secondary" size="sm">View</Button></section>}
    <p className="sf-learning-focus__note">Your dashboard is limited to this selected Skill Pass. The course catalog remains available when you intentionally want to change focus.</p>
  </Card>;
}

function PortfolioSummaryCard() {
  const [state, setState] = useState({ status: "loading", portfolio: null });
  useEffect(() => {
    let active = true;
    portfolioApi.getMyPortfolio()
      .then((portfolio) => { if (active) setState({ status: "ready", portfolio }); })
      .catch(() => { if (active) setState({ status: "error", portfolio: null }); });
    return () => { active = false; };
  }, []);

  const portfolio = state.portfolio;
  return <Card className="sf-dashboard__card sf-portfoliosummarycard">
    <div className="sf-projectsumcard__heading"><div><h2>Your Portfolio</h2><p className="sf-projectsumcard__meta">Choose completed work and skills you want to share.</p></div><BriefcaseBusiness size={19} /></div>
    {state.status === "loading" ? <p className="sf-dashboard__loading">Loading your portfolio…</p> : state.status === "error" ? <p className="sf-readinesscard__note">Your portfolio is unavailable right now.</p> : <><p className="sf-portfoliosummarycard__status">{portfolio.isPublic ? "Published" : "Private"} · {portfolio.projects?.length || 0} project{portfolio.projects?.length === 1 ? "" : "s"} featured</p><Button to="/portfolio" variant="secondary" size="md" icon={<BriefcaseBusiness size={15} />}>Open Portfolio Builder</Button></>}
  </Card>;
}

// Phase 8B adds a lightweight dashboard entry point. The full, transparent
// breakdown remains on /progress; this card does not introduce Phase 8C's
// career-readiness scoring or change any existing dashboard calculations.
function ProgressSummaryCard() {
  const [state, setState] = useState({ status: "loading", overall: null });
  useEffect(() => {
    let active = true;
    progressApi.getOverview()
      .then((data) => { if (active) setState({ status: "ready", overall: data?.overall || null }); })
      .catch(() => { if (active) setState({ status: "error", overall: null }); });
    return () => { active = false; };
  }, []);
  const score = Number(state.overall?.overall) || 0;
  return <Card className="sf-dashboard__card sf-progresssummarycard">
    <div className="sf-progresssummarycard__heading"><div><h2>Your Progress</h2><p>One view of the work you have completed.</p></div><TrendingUp size={19} /></div>
    {state.status === "loading" ? <p className="sf-dashboard__loading">Loading progress…</p> : state.status === "error" ? <p className="sf-readinesscard__note">Your progress is unavailable right now.</p> : <><strong className="sf-progresssummarycard__score">{score}%</strong><div className="sf-progresssummarycard__track"><i style={{ width: `${score}%` }} /></div><p className="sf-readinesscard__note">Based on your real roadmap, project, mission, challenge, and skill activity.</p></>}
    <Button to="/progress" variant="secondary" size="md" icon={<TrendingUp size={15} />}>View Progress</Button>
  </Card>;
}

/**
 * "Career Path" dashboard section (Phase 5B). Reuses the careerGoal
 * already loaded by the profile form above — no extra fetch — and
 * links into the new Career Explorer / existing Skill Gap Analysis.
 */
function FocusCenterCard() {
  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    let active = true;
    dashboardApi.getDashboardOverview()
      .then((data) => { if (active) setState({ status: "ready", data }); })
      .catch(() => { if (active) setState({ status: "error", data: null }); });
    return () => { active = false; };
  }, []);

  if (state.status === "loading") {
    return <Card className="sf-dashboard__card sf-focuscard"><p className="sf-dashboard__loading">Building your focus plan…</p></Card>;
  }

  if (state.status === "error" || !state.data) {
    return null;
  }

  const { data } = state;
  const next = data.nextAction;
  const readiness = data.readiness?.score;
  return (
    <Card className="sf-dashboard__card sf-focuscard">
      <div className="sf-focuscard__eyebrow"><Sparkles size={14} /> Your focus</div>
      <h2>{next.title}</h2>
      <p className="sf-focuscard__description">{next.description}</p>

      <div className="sf-focuscard__metrics">
        <div><strong>{data.missions.completed}/{data.missions.total}</strong><span>missions</span></div>
        <div><strong>{data.projects.completed}</strong><span>projects done</span></div>
        <div><strong>{data.challenges.completed}</strong><span>challenges done</span></div>
        {readiness != null && <div><strong>{readiness}%</strong><span>readiness</span></div>}
      </div>

      <Button to={next.href} variant="primary" size="md" icon={<ArrowRight size={15} />}>
        {next.type === "mission" ? "Open missions" : next.type === "project" ? "Open projects" : next.type === "challenge" ? "Practice now" : next.type === "skill" ? "View skill gap" : "Open roadmap"}
      </Button>
    </Card>
  );
}

function CareerPathCard({ careerGoal, loading }) {
  return (
    <Card className="sf-dashboard__card sf-careerpathcard">
      <h2>Career Path</h2>

      {loading ? (
        <p className="sf-dashboard__loading">Loading…</p>
      ) : careerGoal ? (
        <>
          <span className="sf-careerpathcard__label">Your Career Goal</span>
          <p className="sf-careerpathcard__goal mono">{careerGoal}</p>
        </>
      ) : (
        <p className="sf-readinesscard__note">
          You haven&rsquo;t chosen a career goal yet. Explore careers to pick one.
        </p>
      )}

      <div className="sf-careerpathcard__actions">
        <Button to="/careers" variant="secondary" size="md" icon={<Compass size={15} />}>
          Explore Careers
        </Button>
        {careerGoal && (
          <Button to="/skill-analysis" variant="ghost" size="md" icon={<Target size={15} />}>
            View Skill Gap
          </Button>
        )}
      </div>
    </Card>
  );
}


function ProjectSummaryCard() {
  const [state, setState] = useState({ status: "loading", projects: [] });
  useEffect(() => {
    let active = true;
    projectApi.getRecommendedProjects(3).then((data) => {
      if (active) setState({ status: "ready", projects: data.projects || [] });
    }).catch(() => { if (active) setState({ status: "error", projects: [] }); });
    return () => { active = false; };
  }, []);
  return <Card className="sf-dashboard__card sf-projectsumcard">
    <div className="sf-projectsumcard__heading"><div><h2>Build next</h2><p className="sf-projectsumcard__meta">Projects selected from your career and skill gaps.</p></div><Layers3 size={19} /></div>
    {state.status === "loading" ? <p className="sf-dashboard__loading">Finding your best projects…</p> : state.projects.length ? <div className="sf-projectsumcard__list">{state.projects.map((project) => <div key={project.projectId} className="sf-projectsumcard__item"><div><strong>{project.title}</strong><span>{project.difficulty} · {project.estimatedHours} hrs</span></div><ArrowRight size={15} /></div>)}</div> : <p className="sf-readinesscard__note">No recommendations are available yet. Explore the project library after completing your profile.</p>}
    <Button to="/projects" variant="secondary" size="md" icon={<Layers3 size={15} />}>Explore Projects</Button>
  </Card>;
}

function MissionSummaryCard() {
  const [state, setState] = useState({ status: "loading", data: null });
  useEffect(() => {
    let active = true;
    missionApi.getDailyMissions().then((data) => { if (active) setState({ status: "ready", data }); }).catch(() => { if (active) setState({ status: "error", data: null }); });
    return () => { active = false; };
  }, []);
  const stats = state.data?.stats || {};
  const percent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  return <Card className="sf-dashboard__card sf-missionsumcard">
    <div className="sf-missionsumcard__heading"><div><h2>Daily missions</h2><p>Small actions matched to your current skill gaps.</p></div><Sparkles size={19} /></div>
    {state.status === "loading" ? <p className="sf-dashboard__loading">Building today's plan…</p> : state.status === "error" ? <p className="sf-readinesscard__note">Daily missions are unavailable right now.</p> : <><div className="sf-missionsumcard__stats"><strong>{stats.completed || 0}/{stats.total || 0}</strong><span>{percent}% complete</span></div><div className="sf-missionsumcard__progress"><i style={{ width: `${percent}%` }} /></div></>}
    <Button to="/missions" variant="secondary" size="md" icon={<Sparkles size={15} />}>Open Daily Missions</Button>
  </Card>;
}

function RoadmapSummaryCard() {
  const [state, setState] = useState({ status: "loading", data: null, message: "" });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await roadmapApi.getRoadmap();
        if (active) setState({ status: "ready", data, message: "" });
      } catch (err) {
        if (!active) return;
        const code = err instanceof ApiError ? err.details?.code : null;
        if (err?.status === 404 || code === "NO_ACTIVE_ROADMAP") {
          setState({ status: "empty", data: null, message: "You haven't generated a roadmap yet." });
        } else if (code === "ONBOARDING_REQUIRED" || code === "CAREER_GOAL_REQUIRED") {
          setState({ status: "setup", data: null, message: "Finish your profile to generate a personalized roadmap." });
        } else {
          setState({ status: "error", data: null, message: "Couldn't load your roadmap." });
        }
      }
    }

    load();
    return () => { active = false; };
  }, []);

  const data = state.data;
  const roadmap = data?.roadmap;
  const phases = data?.phases || [];
  const totalItems = countRoadmapItems(phases);
  const completedItems = countCompletedItems(phases);
  const completion = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;
  const hours = totalEstimatedHours(phases);

  return (
    <Card className="sf-dashboard__card sf-roadmapsumcard">
      <div className="sf-roadmapsumcard__heading">
        <div>
          <h2>Your Roadmap</h2>
          <p className="sf-roadmapsumcard__meta">Personalized next steps for your career.</p>
        </div>
        <Map size={19} aria-hidden="true" />
      </div>

      {state.status === "loading" && <p className="sf-dashboard__loading">Loading…</p>}

      {(state.status === "empty" || state.status === "setup") && (
        <>
          <p className="sf-readinesscard__note">{state.message}</p>
          <Button to="/roadmap" variant="secondary" size="md">
            Open Roadmap
          </Button>
        </>
      )}

      {state.status === "error" && <p className="sf-readinesscard__note">{state.message}</p>}

      {state.status === "ready" && roadmap && (
        <>
          <p className="sf-roadmapsumcard__career mono">{roadmap.career_title}</p>
          <div className="sf-roadmapsumcard__stats">
            <span><strong>{phases.length}</strong> phases</span>
            <span><strong>{totalItems}</strong> items</span>
            <span><strong>{hours}</strong> hrs</span>
          </div>
          <div className="sf-roadmapsumcard__progress" aria-label={`Roadmap ${completion}% complete`}>
            <div className="sf-roadmapsumcard__progress-track"><span style={{ width: `${completion}%` }} /></div>
            <span>{completion}% complete</span>
          </div>
          <Button to="/roadmap" variant="secondary" size="md">
            Open Roadmap
          </Button>
        </>
      )}
    </Card>
  );
}

function readinessTone(score) {
  if (score >= 75) return "teal";
  if (score >= 40) return "amber";
  return "red";
}

/**
 * Small dashboard summary card backed by the Phase 8C transparent readiness API.
 * Deliberately swallows the "not ready yet" errors (onboarding/career
 * goal/unsupported career) into a friendly prompt instead of an error
 * banner, and never lets a failure here break the rest of the dashboard.
 */
function SkillReadinessCard() {
  const [state, setState] = useState({ status: "loading", summary: null, message: "" });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const readiness = await careerReadinessApi.getCareerReadinessOverview();
        const summary = {
          readinessScore: readiness.score,
          developingCount: readiness.skillCoverage?.developingCount || 0,
          missingCount: readiness.skillCoverage?.missingCount || 0,
        };
        if (active) setState({ status: "ready", summary, message: "" });
      } catch (err) {
        if (!active) return;
        const code = err instanceof ApiError ? err.details?.code : null;
        if (code === "ONBOARDING_REQUIRED" || code === "CAREER_GOAL_REQUIRED") {
          setState({
            status: "setup",
            summary: null,
            message:
              code === "CAREER_GOAL_REQUIRED"
                ? "Set a career goal above to unlock your skill analysis."
                : "Finish onboarding to unlock your skill analysis.",
          });
        } else if (code === "CAREER_NOT_SUPPORTED") {
          setState({
            status: "setup",
            summary: null,
            message: "Your career goal isn't in the supported list yet.",
          });
        } else {
          setState({ status: "error", summary: null, message: "Couldn't load your skill readiness." });
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="sf-dashboard__card sf-readinesscard">
      <h2>Career Readiness</h2>

      {state.status === "loading" && <p className="sf-dashboard__loading">Loading…</p>}

      {state.status === "ready" && state.summary && (
        <>
          <p className={`sf-readinesscard__score mono sf-readinesscard__score--${readinessTone(state.summary.readinessScore)}`}>
            {state.summary.readinessScore}%
          </p>
          <p className="sf-readinesscard__note">
            {state.summary.developingCount + state.summary.missingCount} skill
            {state.summary.developingCount + state.summary.missingCount === 1 ? "" : "s"} need improvement
          </p>
          <Button to="/progress" variant="secondary" size="md">
            View readiness
          </Button>
        </>
      )}

      {state.status === "setup" && (
        <>
          <p className="sf-readinesscard__note">{state.message}</p>
          <Button to="/skill-analysis" variant="secondary" size="md">
            View Skill Analysis
          </Button>
        </>
      )}

      {state.status === "error" && <p className="sf-dashboard__loading">{state.message}</p>}
    </Card>
  );
}
