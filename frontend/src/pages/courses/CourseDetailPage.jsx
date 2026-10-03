import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, LockKeyhole, Play, Route } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import CatalogLayout from "../../layouts/CatalogLayout.jsx";
import useRemoteData from "../../hooks/useRemoteData.js";
import { completeLesson, focusCourse, getCourse, startCourse } from "../../services/courseService.js";
import { useAuth } from "../../context/auth.js";
import { Card, Badge } from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import { ProgressBar } from "../../components/ui/Indicators.jsx";
import "./CoursesPage.css";
import {setPageMeta} from '../../utils/seo.js';

export default function CourseDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fetcher = useCallback(() => getCourse(id), [id]);
  const { data, error, loading, reload } = useRemoteData(fetcher);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(()=>{if(data?.course)setPageMeta({title:data.course.title,description:data.course.description||`Review the ${data.course.title} curriculum, lessons, estimated time, and access options.`,type:'article',structuredData:true});},[data]);

  async function begin() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }
    setBusy(true); setActionError(""); setNotice("");
    try { await startCourse(id); reload(); }
    catch (requestError) { setActionError(requestError.message); }
    finally { setBusy(false); }
  }

  async function selectFocus() {
    setBusy(true); setActionError(""); setNotice("");
    try {
      await focusCourse(id);
      setNotice("This course is now your dashboard focus.");
    } catch (requestError) { setActionError(requestError.message); }
    finally { setBusy(false); }
  }

  async function finish(lessonId) {
    setBusy(true); setActionError(""); setNotice("");
    try { await completeLesson(lessonId); reload(); }
    catch (requestError) { setActionError(requestError.message); }
    finally { setBusy(false); }
  }

  if (loading) return <CatalogLayout><Skeleton rows={6} label="Loading course" /></CatalogLayout>;
  if (error) return <CatalogLayout><ErrorState message={error.message} onRetry={reload} /></CatalogLayout>;
  const course = data.course;
  const lessons = course.modules.flatMap((module) => module.lessons);
  const completed = lessons.filter((lesson) => lesson.completed).length;

  return <CatalogLayout>
    <header className="sf-page-heading">
      <div>
        <span className="sf-eyebrow"><Route size={16} /> {course.skillName}</span>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        <div className="sf-inline-badges"><Badge>{course.difficulty}</Badge><Badge>{course.estimatedHours} hours</Badge>{course.isPremium && <Badge tone="blue">Premium curriculum</Badge>}</div>
      </div>
      <div className="sf-inline-badges">
        {course.enrolled && course.hasAccess && <><Button onClick={selectFocus} disabled={busy}>Use as dashboard focus</Button><Button to={`/assessments?courseId=${course.id}`} variant="secondary">Course assessments</Button></>}
        {!course.enrolled && course.hasAccess && <Button onClick={begin} disabled={busy} icon={<Play size={16} />}>{busy ? "Starting…" : "Start course"}</Button>}
        {!course.hasAccess && <Button to={`/store?type=skill_pass&skillId=${course.skillId}`} variant="secondary">Choose this Skill Pass</Button>}
      </div>
    </header>
    {!course.hasAccess && <Card className="sf-course-access"><LockKeyhole size={20} /><div><strong>Skill Pass access is required</strong><p>Preview lessons are free. Choose this skill or an included career bundle, review the price, and confirm payment to unlock the full course.</p></div></Card>}
    {notice && <p className="sf-store__notice" role="status">{notice}</p>}
    {actionError && <p className="sf-form-error" role="alert">{actionError}</p>}
    {course.prerequisites.length > 0 && <Card><h2>Prerequisites</h2><ul>{course.prerequisites.map((prerequisite) => <li key={prerequisite.id}>{prerequisite.title}</li>)}</ul></Card>}
    {course.enrolled && <Card><ProgressBar label="Course completion" value={lessons.length ? completed / lessons.length * 100 : 0} /></Card>}
    <div className="sf-module-list">{course.modules.map((module) => <Card key={module.id}>
      <span className="sf-eyebrow">MODULE {module.position}</span><h2>{module.title}</h2>{module.description && <p>{module.description}</p>}
      <ol className="sf-lesson-list">{module.lessons.map((lesson) => <li key={lesson.id} className={lesson.locked ? "is-locked" : ""}>
        <div>{lesson.completed ? <Check size={18} /> : lesson.locked ? <LockKeyhole size={18} /> : <Play size={18} />}<span><strong>{lesson.title}</strong><small>{lesson.estimatedMinutes} min · {lesson.lessonType}</small></span></div>
        {lesson.summary && <p>{lesson.summary}</p>}
        {lesson.content && <div className="sf-lesson-guide"><strong>Lesson guide</strong><p className="sf-lesson-content">{lesson.content}</p></div>}
        {!lesson.locked && <div className="sf-lesson-actions">
          {lesson.sourceUrl && <a href={lesson.sourceUrl} target="_blank" rel="noopener noreferrer">Open lesson resource <ExternalLink size={14} /><small>Source: {lesson.provider || "External provider"}</small></a>}
          {course.enrolled && !lesson.completed && <Button variant="secondary" disabled={busy} onClick={() => finish(lesson.id)}>I completed this lesson</Button>}
          {lesson.completed && <span className="sf-lesson-complete"><Check size={15} /> Completed</span>}
        </div>}
        {lesson.locked && <small>{course.hasAccess?"Start this course to unlock the lesson guide and completion button.":"Locked lesson. Purchase the matching Skill Pass or Career Bundle to continue."}</small>}
      </li>)}</ol>
    </Card>)}</div>
  </CatalogLayout>;
}
