import { useRef, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, Target } from "lucide-react";
import AppNav from "../../components/layout/AppNav.jsx";
import Button from "../../components/ui/Button.jsx";
import { Card, Badge } from "../../components/ui/Card.jsx";
import SkillRequirementGroup from "../../components/careers/SkillRequirementGroup.jsx";
import { CareerLoading, CareerError } from "../../components/careers/CareerStatus.jsx";
import * as careerApi from "../../services/careerService.js";
import * as profileApi from "../../services/profileService.js";
import { ApiError } from "../../services/apiClient.js";
import "./CareerDetailsPage.css";

function CareerDetailsPageContent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [career, setCareer] = useState(null);
  const [skillGroups, setSkillGroups] = useState(null);
  const [currentCareerGoal, setCurrentCareerGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [choosing, setChoosing] = useState(false);
  const [chooseError, setChooseError] = useState("");
  const [justChosen, setJustChosen] = useState(false);

  const requestVersion = useRef(0);
  const fetchData = useCallback(async () => {
    const version = ++requestVersion.current;
    const commit = (update) => { if (version === requestVersion.current) update(); };
    try {
      const [careerDetail, skills, profile] = await Promise.all([
        careerApi.getCareer(id),
        careerApi.getCareerSkills(id),
        profileApi.getProfile(),
      ]);
      commit(() => setError(null));

      commit(() => setCareer(careerDetail));
      commit(() => setSkillGroups(skills));
      commit(() => setCurrentCareerGoal(profile.careerGoal || null));
    } catch (err) {
      commit(() => setError(err instanceof ApiError ? err : new ApiError(0, "Could not load this career.")));
    } finally {
      commit(() => setLoading(false));
    }
  }, [id]);
  function load() {
    setLoading(true);
    setError(null);
    setJustChosen(false);
    return fetchData();
  }

  useEffect(() => {
    fetchData();
    return () => { requestVersion.current += 1; };
  }, [fetchData]);

  async function handleChooseCareer() {
    if (!career) return;
    setChoosing(true);
    setChooseError("");
    try {
      const updated = await profileApi.updateProfile({ careerGoal: career.title });
      setCurrentCareerGoal(updated.careerGoal || career.title);
      setJustChosen(true);
    } catch (err) {
      setChooseError(err instanceof ApiError ? err.message : "Could not save your career goal.");
    } finally {
      setChoosing(false);
    }
  }

  const isCurrentCareer =
    career && currentCareerGoal && currentCareerGoal.trim().toLowerCase() === career.title.trim().toLowerCase();

  return (
    <div>
      <AppNav />
      <div className="container sf-careerdetail">
        <Link to="/careers" className="sf-careerdetail__back">
          <ChevronLeft size={16} aria-hidden="true" /> Back to Career Explorer
        </Link>

        {loading && <CareerLoading message="Loading career…" />}

        {!loading && error && (
          <CareerError
            message={error.status === 404 ? "This career could not be found." : error.message}
            onAction={error.status === 404 ? () => navigate("/careers") : load}
            actionLabel={error.status === 404 ? "Back to Career Explorer" : "Try again"}
          />
        )}

        {!loading && !error && career && (
          <>
            <div className="sf-careerdetail__header">
              <div>
                {career.category?.name && <Badge tone="blue">{career.category.name}</Badge>}
                <h1>{career.title}</h1>
                {career.shortDescription && (
                  <p className="sf-careerdetail__desc">{career.shortDescription}</p>
                )}
              </div>

              <Card className="sf-careerdetail__goalcard">
                {isCurrentCareer ? (
                  <>
                    <span className="sf-careerdetail__goalcard-label">Your Current Career Goal</span>
                    <span className="sf-careerdetail__goalcard-value mono">{career.title}</span>
                    <div className="sf-careerdetail__goalcard-actions">
                      <Button variant="primary" size="md" to="/skill-analysis" icon={<Target size={15} />}>
                        View Skill Gap
                      </Button>
                      <Button variant="ghost" size="md" to="/careers">
                        Change Career
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {currentCareerGoal && (
                      <p className="sf-careerdetail__goalcard-current">
                        Current goal: <span className="mono">{currentCareerGoal}</span>
                      </p>
                    )}
                    {justChosen ? (
                      <>
                        <p className="sf-careerdetail__goalcard-success">
                          <CheckCircle2 size={16} aria-hidden="true" /> Career goal updated.
                        </p>
                        <Button variant="primary" size="md" to="/skill-analysis" icon={<Target size={15} />}>
                          View Skill Gap
                        </Button>
                      </>
                    ) : (
                      <>
                        {chooseError && (
                          <p className="sf-careerdetail__goalcard-error" role="alert">
                            {chooseError}
                          </p>
                        )}
                        <Button variant="primary" size="md" onClick={handleChooseCareer} disabled={choosing}>
                          {choosing ? "Saving…" : "Choose This Career"}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </Card>
            </div>

            <section className="sf-section" aria-labelledby="career-skills-heading">
              <h2 id="career-skills-heading" className="sf-section__title">
                Skills Required for This Career
              </h2>

              {skillGroups &&
              skillGroups.required.length === 0 &&
              skillGroups.recommended.length === 0 &&
              skillGroups.optional.length === 0 ? (
                <Card>
                  <p className="sf-careerdetail__nogaps">
                    No skill requirements are set up for this career yet.
                  </p>
                </Card>
              ) : (
                <div className="sf-careerdetail__reqgroups">
                  <SkillRequirementGroup title="Required" tone="red" skills={skillGroups?.required} />
                  <SkillRequirementGroup
                    title="Recommended"
                    tone="amber"
                    skills={skillGroups?.recommended}
                  />
                  <SkillRequirementGroup title="Optional" tone="neutral" skills={skillGroups?.optional} />
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function CareerDetailsPage() {
  const { id } = useParams();
  return <CareerDetailsPageContent key={id} />;
}
