import { useRef, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import AppNav from "../../components/layout/AppNav.jsx";
import Button from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import ReadinessOverview from "../../components/skill-analysis/ReadinessOverview.jsx";
import SkillGapCategories from "../../components/skill-analysis/SkillGapCategories.jsx";
import SkillProgressBars from "../../components/skill-analysis/SkillProgressBars.jsx";
import PriorityFocus from "../../components/skill-analysis/PriorityFocus.jsx";
import CareerRequirements from "../../components/skill-analysis/CareerRequirements.jsx";
import {
  AnalysisLoading,
  AnalysisMessage,
  InlineBanner,
} from "../../components/skill-analysis/SkillAnalysisStatus.jsx";
import * as skillAnalysisApi from "../../services/skillAnalysisService.js";
import { ApiError } from "../../services/apiClient.js";
import "./SkillAnalysisPage.css";

export default function SkillAnalysisPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const requestVersion = useRef(0);
  const fetchData = useCallback(async () => {
    const version = ++requestVersion.current;
    const commit = (update) => { if (version === requestVersion.current) update(); };
    try {
      const result = await skillAnalysisApi.loadSkillAnalysisPageData();
      commit(() => setError(null));
      commit(() => setData(result));
    } catch (err) {
      commit(() => setError(err instanceof ApiError ? err : new ApiError(0, "Unable to load your skill analysis. Please try again.")));
    } finally {
      commit(() => setLoading(false));
      commit(() => setRefreshing(false));
    }
  }, []);
  function load({ isRefresh = false } = {}) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    return fetchData();
  }

  useEffect(() => {
    fetchData();
    return () => { requestVersion.current += 1; };
  }, [fetchData]);

  return (
    <>
      <AppNav />
      <div className="container sf-skillanalysis">
        <div className="sf-skillanalysis__header">
          <div>
            <p className="sf-skillanalysis__eyebrow mono">Skill Gap Analysis</p>
            <h1>Skill Gap Analysis</h1>
            <p className="sf-skillanalysis__subtitle">
              See where you stand and what skills you need to reach your career goal.
            </p>
          </div>
          {data && (
            <div className="sf-skillanalysis__goal">
              <span className="sf-skillanalysis__goal-label">Career Goal</span>
              <span className="sf-skillanalysis__goal-value mono">{data.summary.careerGoal}</span>
            </div>
          )}
        </div>

        {loading && <AnalysisLoading />}

        {!loading && error && <ErrorState error={error} onRetry={() => load()} navigate={navigate} />}

        {!loading && !error && data && (
          <>
            <div className="sf-skillanalysis__toolbar">
              <Button
                variant="secondary"
                size="md"
                onClick={() => load({ isRefresh: true })}
                disabled={refreshing}
                icon={<RefreshCw size={15} className={refreshing ? "sf-spin" : ""} />}
              >
                {refreshing ? "Refreshing…" : "Refresh Analysis"}
              </Button>
            </div>

            {data.summary.totalSkills === 0 && (
              <InlineBanner message="No required skills are set up for this career yet." />
            )}
            {data.summary.totalSkills > 0 &&
              data.summary.strongCount === 0 &&
              data.summary.developingCount === 0 && (
                <InlineBanner message="Add your skills to get a more accurate analysis." />
              )}

            <ReadinessOverview summary={data.summary} />
            <PriorityFocus topPriorities={data.summary.topPriorities} />
            <SkillGapCategories skills={data.skills} />
            <SkillProgressBars skills={data.skills} />
            <CareerRequirements career={data.summary.resolvedCareer} requirements={data.requirements} />

            <p className="sf-skillanalysis__disclaimer">{data.summary.disclaimer}</p>
          </>
        )}
      </div>
    </>
  );
}

function ErrorState({ error, onRetry, navigate }) {
  const code = error.details?.code;

  if (code === "ONBOARDING_REQUIRED") {
    return (
      <AnalysisMessage
        title="Finish your profile first"
        message="Complete your profile to generate your skill analysis."
        actionLabel="Go to onboarding"
        onAction={() => navigate("/onboarding")}
      />
    );
  }

  if (code === "CAREER_GOAL_REQUIRED") {
    return (
      <AnalysisMessage
        title="Set a career goal"
        message="Select a career goal to see your required skills."
        actionLabel="Go to dashboard"
        onAction={() => navigate("/dashboard")}
      />
    );
  }

  if (code === "CAREER_NOT_SUPPORTED") {
    const supportedCareers = error.details?.supportedCareers || [];
    return (
      <Card className="sf-skillanalysis__unsupported">
        <h2>Career not supported yet</h2>
        <p>{error.message}</p>
        {supportedCareers.length > 0 && (
          <>
            <p className="sf-skillanalysis__unsupported-lead">Currently supported careers:</p>
            <ul className="sf-skillanalysis__unsupported-list">
              {supportedCareers.map((career) => (
                <li key={career} className="mono">
                  {career}
                </li>
              ))}
            </ul>
          </>
        )}
        <Link to="/dashboard" className="sf-skillanalysis__unsupported-link">
          ← Update your career goal on the dashboard
        </Link>
      </Card>
    );
  }

  return (
    <AnalysisMessage
      tone="error"
      title="Something went wrong"
      message="Unable to load your skill analysis. Please try again."
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
}
