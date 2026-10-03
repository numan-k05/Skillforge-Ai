import { getProfileByUserId } from "../models/profileModel.js";
import * as dashboardModel from "../models/dashboardModel.js";
import * as skillAnalysisService from "./skillAnalysisService.js";
import { ApiError } from "../middleware/errorHandler.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function percent(done, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

function buildNextAction({ focus, mission, projects, challenges, roadmap, readiness }) {
  if (focus) {
    return {
      type: "course",
      title: `Continue ${focus.title}`,
      description: `${focus.completedLessons} of ${focus.lessonCount} lessons completed in your selected Skill Pass.`,
      href: `/courses/${focus.courseId}`,
    };
  }
  if (mission?.total > 0 && mission.completed < mission.total) {
    return {
      type: "mission",
      title: "Complete today's next mission",
      description: `${mission.total - mission.completed} mission${mission.total - mission.completed === 1 ? "" : "s"} still need attention today.`,
      href: "/missions",
    };
  }
  if (projects?.in_progress > 0) {
    return {
      type: "project",
      title: "Continue your active project",
      description: `Keep building to turn your skills into practical evidence.`,
      href: "/projects",
    };
  }
  if (challenges?.in_progress > 0) {
    return {
      type: "challenge",
      title: "Finish an open coding challenge",
      description: `Practice a skill before moving to the next topic.`,
      href: "/challenges",
    };
  }
  if (readiness?.topPriorities?.length) {
    const skill = readiness.topPriorities[0];
    return {
      type: "skill",
      title: `Strengthen ${skill.skillName}`,
      description: `${skill.gap} level${skill.gap === 1 ? "" : "s"} behind the selected career requirement.`,
      href: "/skill-analysis",
    };
  }
  if (roadmap) {
    return {
      type: "roadmap",
      title: "Continue your roadmap",
      description: "Review the next roadmap item and keep your learning streak moving.",
      href: "/roadmap",
    };
  }
  return {
    type: "roadmap",
    title: "Generate your personalized roadmap",
    description: "Turn your career goal and skill gaps into a clear sequence of next steps.",
    href: "/roadmap",
  };
}

function mapLearningFocus(row) {
  if (!row) return null;
  const lessonCount=Number(row.lesson_count)||0;
  const completedLessons=Number(row.completed_lessons)||0;
  return {
    courseId:row.course_id,
    title:row.title,
    slug:row.slug,
    description:row.description,
    skillId:row.skill_id,
    skillName:row.skill_name,
    difficulty:row.difficulty,
    estimatedHours:row.estimated_hours,
    enrollmentStatus:row.enrollment_status,
    startedAt:row.started_at,
    completedAt:row.completed_at,
    lessonCount,
    completedLessons,
    completion:percent(completedLessons,lessonCount),
    assessments:(row.assessments||[]).map(item=>({id:item.id,title:item.title,passPercent:item.pass_percent,questionCount:item.question_count})),
    projects:(row.projects||[]).map(item=>({id:item.id,title:item.title,slug:item.slug,description:item.short_description,difficulty:item.difficulty,estimatedHours:item.estimated_hours})),
    careers:(row.careers||[]).map(item=>({id:item.id,title:item.title,slug:item.slug,category:item.category,importance:item.importance})),
    certificate:row.certificate?{id:row.certificate.id,title:row.certificate.title,slug:row.certificate.slug}:null,
  };
}

export async function getDashboardOverview(userId) {
  const [profile,focusRow]=await Promise.all([getProfileByUserId(userId),dashboardModel.getLearningFocus(userId)]);
  if (!profile?.onboarding_completed && !focusRow) {
    throw new ApiError(409, "Finish onboarding before viewing your dashboard overview.", { code: "ONBOARDING_REQUIRED" });
  }

  const date = todayISO();
  const [projects, challenges, missions, roadmap] = await Promise.all([
    dashboardModel.getProjectProgress(userId),
    dashboardModel.getChallengeProgress(userId),
    dashboardModel.getTodayMissionProgress(userId, date),
    dashboardModel.getActiveRoadmapProgress(userId),
  ]);

  let readiness = null;
  try {
    readiness = await skillAnalysisService.getSkillAnalysisSummary(userId);
  } catch (error) {
    if (!(error instanceof ApiError) || !["ONBOARDING_REQUIRED","CAREER_GOAL_REQUIRED", "CAREER_NOT_SUPPORTED"].includes(error.details?.code)) throw error;
  }

  const missionStats = missions || { total: 0, completed: 0, in_progress: 0, skipped: 0, total_minutes: 0, completed_minutes: 0 };
  const learningFocus=mapLearningFocus(focusRow);
  const roadmapProgress = roadmap
    ? percent(roadmap.completed_items, roadmap.total_items)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    date,
    learningFocus,
    career: readiness?.resolvedCareer || profile?.career_goal_title || null,
    readiness: readiness
      ? {
          score: readiness.readinessScore,
          totalSkills: readiness.totalSkills,
          strongCount: readiness.strongCount,
          developingCount: readiness.developingCount,
          missingCount: readiness.missingCount,
          topPriorities: readiness.topPriorities,
        }
      : null,
    roadmap: roadmap
      ? {
          id: roadmap.id,
          careerTitle: roadmap.career_title,
          targetWeeks: roadmap.target_weeks,
          weeklyHours: roadmap.weekly_hours,
          version: roadmap.version,
          phaseCount: roadmap.phase_count,
          totalItems: roadmap.total_items,
          completedItems: roadmap.completed_items,
          completion: roadmapProgress,
        }
      : null,
    projects: {
      total: projects.total,
      inProgress: projects.in_progress,
      completed: projects.completed,
      paused: projects.paused,
    },
    missions: {
      total: missionStats.total,
      completed: missionStats.completed,
      inProgress: missionStats.in_progress,
      skipped: missionStats.skipped,
      totalMinutes: missionStats.total_minutes,
      completedMinutes: missionStats.completed_minutes,
      completion: percent(missionStats.completed, missionStats.total),
    },
    challenges: {
      started: challenges.started,
      inProgress: challenges.in_progress,
      completed: challenges.completed,
      attempts: challenges.attempts,
    },
    nextAction: buildNextAction({ focus:learningFocus, mission: missionStats, projects, challenges, roadmap, readiness }),
  };
}

export default { getDashboardOverview };
export const dashboardInternals={mapLearningFocus,buildNextAction};
