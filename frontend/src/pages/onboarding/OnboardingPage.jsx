import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.js";
import * as onboardingApi from "../../services/onboardingService.js";
import { ApiError } from "../../services/apiClient.js";
import Button from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import AcademicStep from "./steps/AcademicStep.jsx";
import GoalsStep from "./steps/GoalsStep.jsx";
import InterestsStep from "./steps/InterestsStep.jsx";
import "../auth/AuthForm.css";
import "./OnboardingPage.css";

const STEPS = ["Academic details", "Career goal", "Interests"];
const MAX_INTERESTS = 10;

const INITIAL_FORM = {
  university: "",
  degree: "",
  semester: "",
  country: "",
  careerGoal: "",
  weeklyHoursAvailable: "",
  learningGoals: "",
  interests: [],
};

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location=useLocation();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    onboardingApi
      .getOnboardingCatalog()
      .then((interests) => {
        if (active) setCatalog(interests);
      })
      .catch(() => {
        if (active) setCatalogError(true);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleInterest(name) {
    setForm((f) => {
      const has = f.interests.includes(name);
      if (has) return { ...f, interests: f.interests.filter((i) => i !== name) };
      if (f.interests.length >= MAX_INTERESTS) return f;
      return { ...f, interests: [...f.interests, name] };
    });
  }

  function goNext() {
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleFinish() {
    setSubmitting(true);
    setError("");
    try {
      await onboardingApi.completeOnboarding({
        university: form.university.trim() || undefined,
        degree: form.degree.trim() || undefined,
        semester: form.semester ? Number(form.semester) : undefined,
        country: form.country.trim() || undefined,
        careerGoal: form.careerGoal.trim() || undefined,
        weeklyHoursAvailable: form.weeklyHoursAvailable ? Number(form.weeklyHoursAvailable) : undefined,
        learningGoals: form.learningGoals.trim() || undefined,
        interests: form.interests,
      });

      // Reflect completion in auth context immediately so route guards
      // (RequireOnboarding / OnboardingRoute) don't bounce us back here.
      setUser((u) => (u ? { ...u, onboardingCompleted: true } : u));
      const from=location.state?.from;
      navigate(from?.pathname?from.pathname+(from.search||""):"/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your onboarding details.");
    } finally {
      setSubmitting(false);
    }
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="container sf-onboarding">
      <div className="sf-onboarding__header">
        <p className="sf-onboarding__eyebrow mono">Welcome, {user?.name?.split(" ")[0] || "there"}</p>
        <h1>Let&apos;s set up your profile</h1>
        <p className="sf-onboarding__subtitle">
          A few quick questions so SkillForge can build the right roadmap for you.
        </p>
      </div>

      <div className="sf-onboarding__steps-indicator" role="list">
        {STEPS.map((label, i) => (
          <div
            key={label}
            role="listitem"
            className={`sf-onboarding__step-dot ${i === step ? "is-active" : ""} ${
              i < step ? "is-done" : ""
            }`}
          >
            <span className="sf-onboarding__step-number">{i + 1}</span>
            <span className="sf-onboarding__step-label">{label}</span>
          </div>
        ))}
      </div>

      <Card className="sf-onboarding__card">
        {error && (
          <div className="sf-auth-form__alert" role="alert">
            {error}
          </div>
        )}

        {step === 0 && <AcademicStep form={form} update={update} />}
        {step === 1 && <GoalsStep form={form} update={update} />}
        {step === 2 && (
          <InterestsStep
            catalog={catalog}
            catalogLoading={catalogLoading}
            catalogError={catalogError}
            selected={form.interests}
            onToggle={toggleInterest}
            maxInterests={MAX_INTERESTS}
          />
        )}

        <div className="sf-onboarding__actions">
          {step > 0 ? (
            <Button variant="secondary" size="md" onClick={goBack} disabled={submitting}>
              Back
            </Button>
          ) : (
            <span />
          )}

          {isLastStep ? (
            <Button variant="primary" size="md" onClick={handleFinish} disabled={submitting}>
              {submitting ? "Saving…" : "Finish setup"}
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={goNext}>
              Continue
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
