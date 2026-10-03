import { UnlockButton } from "../../components/ui/ContentAccess.jsx";
import { useCallback, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Sparkles, XCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import CatalogLayout from "../../layouts/CatalogLayout.jsx";
import useRemoteData from "../../hooks/useRemoteData.js";
import { getQuiz, startAttempt, submitAttempt } from "../../services/assessmentService.js";
import { Card, Badge } from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import { ScoreIndicator } from "../../components/ui/Indicators.jsx";
import "./AssessmentsPage.css";

function sourceBadge(attempt) {
  if (attempt.generatedByAI) return <Badge tone="teal"><Sparkles size={14} /> AI-generated for this attempt</Badge>;
  if (attempt.generationMode === "ai_fallback") return <Badge tone="amber">Reviewed fallback set</Badge>;
  return <Badge>Reviewed question set</Badge>;
}

export default function QuizPage() {
  const { id } = useParams();
  const fetcher = useCallback(() => getQuiz(id), [id]);
  const { data, error, loading, reload } = useRemoteData(fetcher);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true);
    setActionError("");
    try {
      const payload = await startAttempt(id);
      setAttempt(payload.attempt);
      setAnswers(Object.fromEntries(payload.attempt.questions.map((question) => [question.id, []])));
      setResult(null);
      setCurrentIndex(0);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function toggle(questionId, optionId) {
    setAnswers((current) => ({
      ...current,
      [questionId]: current[questionId].includes(optionId)
        ? current[questionId].filter((answerId) => answerId !== optionId)
        : [...current[questionId], optionId],
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setActionError("");
    try {
      const payload = await submitAttempt(attempt.id, attempt.questions.map((question) => ({
        questionId: question.id,
        selectedOptionIds: answers[question.id] || [],
      })));
      setResult(payload);
      setAttempt(payload.attempt);
      setCurrentIndex(0);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <CatalogLayout><Skeleton rows={5} /></CatalogLayout>;
  if (error) return <CatalogLayout><ErrorState message={error.message} onRetry={reload} /></CatalogLayout>;

  const quiz = data.quiz;
  const resultByQuestion = new Map((result?.answers || []).map((answer) => [String(answer.questionId), answer]));
  const currentQuestion = attempt?.questions[currentIndex];
  const graded = currentQuestion ? resultByQuestion.get(String(currentQuestion.id)) : null;
  const selectedAnswers = currentQuestion ? answers[currentQuestion.id] || [] : [];
  const questionCount = attempt?.questions.length || 0;
  const progress = questionCount ? ((currentIndex + 1) / questionCount) * 100 : 0;

  return <CatalogLayout>
    <header className="sf-page-heading">
      <div>
        <span className="sf-eyebrow"><ClipboardCheck size={16} /> VERSION {quiz.version}</span>
        <h1>{quiz.title}</h1>
        <p>{quiz.description}</p>
        <div className="sf-inline-badges">
          <Badge>Pass {quiz.passPercent}%</Badge>
          <Badge>{quiz.maxAttempts} attempts</Badge>
          {quiz.cooldownMinutes > 0 && <Badge>{quiz.cooldownMinutes} min cooldown</Badge>}
          {attempt && sourceBadge(attempt)}
        </div>
        {!attempt && <p className="sf-assessment-note">A fresh question set is prepared for each new attempt when server-side AI generation is enabled.</p>}
      </div>
      {!attempt && <Button onClick={begin} disabled={busy || !quiz.hasAccess}>{busy ? "Preparing fresh questions…" : "Start assessment"}</Button>}
    </header>

    {!quiz.hasAccess && <Card>{quiz.requiresEnrollment?<><p>Start the included course before taking its assessment.</p><Button to={quiz.courseId?`/courses/${quiz.courseId}`:"/learning"}>Open course</Button></>:<><p>This assessment is locked. It unlocks with the matching Skill Pass or Career Bundle.</p><UnlockButton item={quiz}/></>}</Card>}
    {actionError && <p role="alert" className="sf-form-error">{actionError}</p>}

    {result && <Card className="sf-result-summary">
      <ScoreIndicator label="Score" value={attempt.scorePercent} />
      <div><h2>{attempt.passed ? "Assessment passed" : "Keep learning and try again"}</h2><p>Your submitted version is saved in assessment history.</p></div>
    </Card>}

    {attempt && currentQuestion && <form className="sf-question-stage" onSubmit={submit}>
      <div className="sf-question-stage__status" aria-live="polite">
        <div><strong>Question {currentIndex + 1} of {questionCount}</strong><span>{result ? "Reviewing your answers" : `${Object.values(answers).filter((value) => value.length).length} answered`}</span></div>
        <div className="sf-question-stage__track" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
      </div>

      <Card as="fieldset" className={graded ? graded.isCorrect ? "is-correct" : "is-incorrect" : ""}>
        <legend>{currentQuestion.prompt} <small>{currentQuestion.points} {currentQuestion.points === 1 ? "point" : "points"}</small></legend>
        <p className="sf-question-hint">Select every answer that applies.</p>
        {currentQuestion.options.map((option) => <label key={option.id}>
          <input type="checkbox" checked={selectedAnswers.includes(option.id)} disabled={Boolean(result)} onChange={() => toggle(currentQuestion.id, option.id)} />
          <span>{option.text}</span>
        </label>)}
        {graded && <div className="sf-answer-feedback">
          {graded.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>
            <strong>{graded.isCorrect ? "Correct" : "Not quite"}</strong>
            {currentQuestion.explanation && <small>{currentQuestion.explanation}</small>}
            <small>Correct option{currentQuestion.correctOptionIds.length === 1 ? "" : "s"}: {currentQuestion.options.filter((option) => currentQuestion.correctOptionIds.includes(option.id)).map((option) => option.text).join(", ")}</small>
          </span>
        </div>}
      </Card>

      <div className="sf-question-stage__actions">
        <Button type="button" variant="secondary" icon={<ChevronLeft size={16} />} disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>Previous</Button>
        {currentIndex < questionCount - 1
          ? <Button type="button" icon={<ChevronRight size={16} />} iconPosition="right" disabled={!result && selectedAnswers.length === 0} onClick={() => setCurrentIndex((index) => index + 1)}>Next question</Button>
          : !result && <Button type="submit" disabled={busy || selectedAnswers.length === 0}>{busy ? "Grading…" : "Submit assessment"}</Button>}
      </div>
      {!result && selectedAnswers.length === 0 && <p className="sf-question-stage__hint">Choose an answer to continue.</p>}
    </form>}
  </CatalogLayout>;
}
