import test from "node:test";
import assert from "node:assert/strict";

process.env.DOTENV_CONFIG_PATH="test/does-not-exist.env";
process.env.NODE_ENV="test";
process.env.JWT_SECRET="test-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz";
process.env.DATABASE_URL="postgresql://unused:unused@127.0.0.1:1/unused";

const {dashboardInternals}=await import("../src/services/dashboardService.js");

test("selected course becomes a focused dashboard payload and next action",()=>{
  const focus=dashboardInternals.mapLearningFocus({
    course_id:"10",title:"JavaScript Skill Pass",slug:"javascript-foundations",description:"Build dependable applications.",
    skill_id:"1",skill_name:"JavaScript",difficulty:"intermediate",estimated_hours:24,enrollment_status:"in_progress",
    lesson_count:12,completed_lessons:3,started_at:"2026-01-01T00:00:00.000Z",completed_at:null,
    assessments:[{id:"20",title:"JavaScript final",pass_percent:75,question_count:12}],
    projects:[{id:"30",title:"Service monitor",slug:"service-monitor",short_description:"Build a monitor.",difficulty:"intermediate",estimated_hours:24}],
    careers:[{id:"40",title:"Frontend Developer",slug:"frontend-developer",category:"Technology",importance:3}],
    certificate:{id:"50",title:"JavaScript Completion",slug:"javascript-completion"},
  });
  assert.equal(focus.completion,25);
  assert.equal(focus.assessments[0].questionCount,12);
  assert.equal(focus.projects[0].description,"Build a monitor.");
  assert.equal(focus.careers[0].title,"Frontend Developer");
  assert.deepEqual(dashboardInternals.buildNextAction({focus}),{
    type:"course",title:"Continue JavaScript Skill Pass",
    description:"3 of 12 lessons completed in your selected Skill Pass.",href:"/courses/10",
  });
});
