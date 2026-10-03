import { ApiError } from "../middleware/errorHandler.js";
import { getProfileByUserId } from "../models/profileModel.js";
import { getRequirementsForCareer } from "../models/careerSkillModel.js";
import { getUserSkills } from "../models/userSkillModel.js";
import * as projectModel from "../models/projectModel.js";
import * as missionModel from "../models/missionModel.js";
import { resolveCareerTitle } from "../utils/careerMatcher.js";

const VALID_STATUSES = new Set(["pending", "in_progress", "completed", "skipped"]);
const TYPES = ["learn", "practice", "build", "review", "challenge"];

function isoDate(value) {
  if (value === undefined) return new Date().toISOString().slice(0, 10);
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ApiError(400, "Date must use YYYY-MM-DD format.");
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new ApiError(400, "Date must use YYYY-MM-DD format.");
  return value;
}

function mapMission(row) {
  return {
    missionId: row.id,
    date: row.mission_date,
    order: row.mission_order,
    title: row.title,
    description: row.description,
    type: row.mission_type,
    difficulty: row.difficulty,
    estimatedMinutes: row.estimated_minutes,
    skill: row.skill_id ? { skillId: row.skill_id, name: row.skill_name, category: row.skill_category } : null,
    project: row.project_id ? { projectId: row.project_id, title: row.project_title, slug: row.project_slug } : null,
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildMissions({ gaps, activeProject, weeklyHours = 10 }) {
  const top = gaps.slice(0, 3);
  const minutesBudget = Math.max(45, Math.min(180, Math.round((Number(weeklyHours) || 10) * 60 / 5)));
  const missions = [];

  if (top[0]) missions.push({
    type: "learn", difficulty: top[0].gap >= 3 ? "beginner" : "intermediate", estimatedMinutes: Math.min(45, minutesBudget),
    skillId: top[0].skillId, title: `Learn ${top[0].name} fundamentals`,
    description: `Study the core concepts of ${top[0].name} and write down three ideas you can explain without notes.`
  });
  if (top[0]) missions.push({
    type: "practice", difficulty: top[0].gap >= 3 ? "beginner" : "intermediate", estimatedMinutes: 30,
    skillId: top[0].skillId, title: `Practice ${top[0].name}`,
    description: `Complete a focused practice task using ${top[0].name}. Aim to solve it independently before checking a reference.`
  });
  if (activeProject) missions.push({
    type: "build", difficulty: activeProject.difficulty, estimatedMinutes: Math.min(60, Math.max(30, Number(activeProject.estimated_hours) * 2)),
    projectId: activeProject.project_id, title: `Build: ${activeProject.title}`,
    description: `Spend one focused session advancing the next unfinished part of ${activeProject.title}. Keep the change small enough to finish today.`
  });
  if (top[1]) missions.push({
    type: "challenge", difficulty: top[1].gap >= 3 ? "beginner" : "intermediate", estimatedMinutes: 25,
    skillId: top[1].skillId, title: `Challenge yourself on ${top[1].name}`,
    description: `Solve one small problem involving ${top[1].name} without copying a solution. Review what you missed afterward.`
  });
  if (top[2]) missions.push({
    type: "review", difficulty: "beginner", estimatedMinutes: 15,
    skillId: top[2].skillId, title: `Review ${top[2].name}`,
    description: `Review your notes or previous work for ${top[2].name}, then write a short summary of what you now understand.`
  });

  if (!missions.length) missions.push({
    type: "learn", difficulty: "beginner", estimatedMinutes: 30,
    title: "Strengthen your next career skill", description: "Choose one skill from your career requirements and spend a focused session learning and practicing it."
  });

  return missions.slice(0, 5).map((mission, index) => ({ ...mission, order: index + 1 }));
}

async function generateForDate(userId, missionDate) {
  const profile = await getProfileByUserId(userId);
  if (!profile?.onboarding_completed) throw new ApiError(409, "Finish onboarding before using Daily Missions.", { code: "ONBOARDING_REQUIRED" });
  if (!profile.career_goal_title) throw new ApiError(409, "Set a career goal before using Daily Missions.", { code: "CAREER_GOAL_REQUIRED" });

  const career = await resolveCareerTitle(profile.career_goal_title);
  if (!career) throw new ApiError(404, "Your career goal is not supported yet.", { code: "CAREER_NOT_SUPPORTED" });
  const [requirements, userSkills, userProjects] = await Promise.all([
    getRequirementsForCareer(career), getUserSkills(userId), projectModel.listUserProjects(userId)
  ]);
  const current = new Map(userSkills.map((s) => [s.skill_id, s.proficiency_level]));
  const gaps = requirements.map((r) => ({
    skillId: r.skill_id, name: r.skill_name, gap: Math.max(0, r.required_level - (current.get(r.skill_id) ?? 0)), importance: r.importance
  })).filter((g) => g.gap > 0).sort((a,b) => b.gap * b.importance - a.gap * a.importance || a.name.localeCompare(b.name));
  const activeProject = userProjects.find((p) => p.status === "in_progress") || null;
  const generated = buildMissions({ gaps, activeProject, weeklyHours: profile.weekly_hours_available });
  return missionModel.createDailyMissions(userId, missionDate, generated);
}

export async function getDailyMissions(userId, date) {
  const missionDate = isoDate(date);
  let rows = await missionModel.getMissionsByDate(userId, missionDate);
  if (!rows.length) rows = await generateForDate(userId, missionDate);
  const stats = await missionModel.getMissionStats(userId, missionDate);
  return { date: missionDate, missions: rows.map(mapMission), stats, engine: "personalized" };
}

export async function regenerateDailyMissions(userId, date) {
  const missionDate = isoDate(date);
  const existing = await missionModel.getMissionsByDate(userId, missionDate);
  if (existing.some((m) => m.status === "completed" || m.status === "in_progress")) {
    throw new ApiError(409, "Today's missions already have progress. Finish or skip them instead of regenerating.", { code: "MISSION_PROGRESS_EXISTS" });
  }
  if (existing.length) {
    // Keep the database history simple: today's unstarted set is retained and returned.
    return { date: missionDate, missions: existing.map(mapMission), stats: await missionModel.getMissionStats(userId, missionDate), engine: "personalized" };
  }
  return getDailyMissions(userId, missionDate);
}

export async function updateMission(userId, missionId, status) {
  if (!VALID_STATUSES.has(status)) throw new ApiError(400, "Invalid mission status.");
  const row = await missionModel.updateMissionStatus(userId, missionId, status);
  if (!row) throw new ApiError(404, "Mission not found.");
  return { mission: mapMission(await missionModel.getMissionById(userId, missionId)) };
}

export async function getMissionStats(userId, date) {
  const missionDate = isoDate(date);
  return missionModel.getMissionStats(userId, missionDate);
}

export { TYPES };
