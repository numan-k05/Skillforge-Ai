import StatementHero from "../../components/marketing/StatementHero.jsx";
import { AccessBadge, UnlockButton } from "../../components/ui/ContentAccess.jsx";
import { useCallback, useState } from "react";
import { BookOpen, Clock3, Search } from "lucide-react";
import CatalogLayout from "../../layouts/CatalogLayout.jsx";
import useRemoteData from "../../hooks/useRemoteData.js";
import { getCourses } from "../../services/courseService.js";
import { Card, Badge } from "../../components/ui/Card.jsx";
import { Field, Select } from "../../components/ui/Field.jsx";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import Button from "../../components/ui/Button.jsx";
import "./CoursesPage.css";

export default function CoursesPage(){
  const [filters,setFilters]=useState({search:"",difficulty:""});
  const fetcher=useCallback(()=>getCourses(filters),[filters]); const {data,error,loading,reload}=useRemoteData(fetcher);
  return <CatalogLayout><StatementHero>Learn new skills through structured courses and practical lessons.</StatementHero><div className="statement-hero__tools"><Button to="/learning" variant="secondary">My learning</Button></div>
    <Card className="sf-catalog-filters"><div className="sf-catalog-search"><Search size={18}/><Field label="Search courses" type="search" value={filters.search} onChange={e=>setFilters(v=>({...v,search:e.target.value}))} placeholder="Search by title or topic"/></div><Select label="Difficulty" value={filters.difficulty} onChange={e=>setFilters(v=>({...v,difficulty:e.target.value}))}><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></Card>
    {loading?<Skeleton rows={4} label="Loading courses"/>:error?<ErrorState message={error.message} onRetry={reload}/>:data.courses.length?<div className="sf-course-grid">{data.courses.map(course=><Card as="article" key={course.id} className="sf-course-card"><div><Badge tone="blue">{course.skillName}</Badge><Badge>{course.difficulty}</Badge></div><AccessBadge item={course}/><h2>{course.title}</h2><p>{course.description}</p><dl><div><BookOpen size={16}/><dt>Lessons</dt><dd>{course.lessonCount}</dd></div><div><Clock3 size={16}/><dt>Time</dt><dd>{course.estimatedHours}h</dd></div></dl><Button to={`/courses/${course.id}`}>{course.hasAccess?"Open course":"Free preview"}</Button>{!course.hasAccess&&<UnlockButton item={course}/>}</Card>)}</div>:<EmptyState title="Courses are being prepared" description="No courses have been published yet. Content administrators can build courses from the existing skill and learning-resource catalog without changing those sources."/>}
  </CatalogLayout>;
}
