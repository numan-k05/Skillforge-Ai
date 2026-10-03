import { withContentAccess } from "./contentAccessService.js";
import { ApiError } from "../middleware/errorHandler.js";
import { getProfileByUserId } from "../models/profileModel.js";
import { getRequirementsForCareer } from "../models/careerSkillModel.js";
import { resolveCareerTitle } from "../utils/careerMatcher.js";
import { getCareerByTitle } from "../models/careerModel.js";
import * as projectModel from "../models/projectModel.js";
import { getUserSkills } from "../models/userSkillModel.js";
import { requireEntityAccess } from "./commerceService.js";

const VALID_DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);
const VALID_STATUSES = new Set(["not_started", "in_progress", "completed", "paused"]);

function toPublicProject(row, { skills = [], careers = [], milestones = [], userProject = null } = {}) {
  return {
    projectId: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.short_description,
    description: row.description,
    difficulty: row.difficulty,
    estimatedHours: row.estimated_hours,
    projectType: row.project_type,
    isActive: row.is_active,
    skills: skills.map((skill) => ({
      skillId: skill.skill_id,
      name: skill.name,
      category: skill.category,
      description: skill.description,
      importance: skill.importance,
    })),
    careers: careers.map((career) => ({
      careerId: career.career_id,
      title: career.title,
      slug: career.slug,
      relevance: career.relevance,
    })),
    milestones: milestones.map((milestone) => ({
      milestoneId: milestone.id,
      order: milestone.milestone_order,
      title: milestone.title,
      description: milestone.description,
      estimatedHours: milestone.estimated_hours,
    })),
    userProject: userProject
      ? {
          id: userProject.id,
          status: userProject.status,
          startedAt: userProject.started_at,
          completedAt: userProject.completed_at,
          createdAt: userProject.created_at,
          updatedAt: userProject.updated_at,
        }
      : null,
  };
}

async function getProjectDetail(projectId, userId = null) {
  const row = await projectModel.getProjectById(projectId);
  if (!row || !row.is_active) throw new ApiError(404, "Project not found.");

  const [skills, careers, milestones, userProject] = await Promise.all([
    projectModel.getProjectSkills(projectId),
    projectModel.getProjectCareers(projectId),
    projectModel.getProjectMilestones(projectId),
    userId ? projectModel.getUserProject(userId, projectId) : null,
  ]);

  return toPublicProject(row, { skills, careers, milestones, userProject });
}

export async function getProjects({ careerId, skillId, difficulty } = {},userId=null) {
  if (difficulty && !VALID_DIFFICULTIES.has(difficulty)) {
    throw new ApiError(400, "Difficulty must be beginner, intermediate, or advanced.");
  }
  const rows = await projectModel.listProjects({ careerId, skillId, difficulty });
  return withContentAccess(rows.map((row) => toPublicProject(row)),userId,"project","projectId");
}

export async function getProject(projectId, userId = null) {
  const detail=await getProjectDetail(projectId,userId);
  const [project]=await withContentAccess([detail],userId,"project","projectId");
  return project.hasAccess?project:{...project,description:project.shortDescription,milestones:[]};
}

/**
 * Personalized project ranking:
 * 1) projects mapped to the user's resolved career receive a relevance bonus;
 * 2) projects covering the user's largest skill gaps receive another bonus;
 * 3) stronger overlap wins, while completed projects are pushed down.
 * This is deterministic and does not claim that a project guarantees work/income.
 */
export async function getRecommendedProjects(userId, { limit = 6 } = {}) {
  const profile = await getProfileByUserId(userId);
  if (!profile || !profile.onboarding_completed) {
    throw new ApiError(409, "Finish onboarding before viewing project recommendations.", {
      code: "ONBOARDING_REQUIRED",
    });
  }
  if (!profile.career_goal_title) {
    throw new ApiError(409, "Set a career goal before viewing project recommendations.", {
      code: "CAREER_GOAL_REQUIRED",
    });
  }

  const resolvedCareer = await resolveCareerTitle(profile.career_goal_title);
  if (!resolvedCareer) {
    throw new ApiError(404, `"${profile.career_goal_title}" isn't in the supported career list yet.`, {
      code: "CAREER_NOT_SUPPORTED",
    });
  }

  const [careers, userSkills] = await Promise.all([
    projectModel.listProjects(),
    getUserSkills(userId),
  ]);

  const career = await getCareerByTitle(resolvedCareer);
  const requirements = await getRequirementsForCareer(resolvedCareer);
  const currentBySkillId = new Map();
  for (const skill of userSkills) {
    currentBySkillId.set(skill.skill_id, skill.proficiency_level);
  }

  const gapBySkillId = new Map(
    requirements.map((req) => [req.skill_id, {
      gap: Math.max(0, req.required_level - (currentBySkillId.get(req.skill_id) ?? 0)),
      importance: req.importance,
    }])
  );

  const userProjects = await projectModel.listUserProjects(userId);
  const statusByProjectId = new Map(userProjects.map((item) => [item.project_id, item.status]));

  const detailed = await Promise.all(
    careers.map(async (project) => {
      const skills = await projectModel.getProjectSkills(project.id);
      const careerMappings = await projectModel.getProjectCareers(project.id);
      const careerMapping = careerMappings.find((item) => item.career_id === career?.id);
      let gapScore = 0;
      let gapSkills = 0;
      for (const skill of skills) {
        const gap = gapBySkillId.get(skill.skill_id);
        if (gap?.gap > 0) {
          gapScore += gap.gap * gap.importance * skill.importance;
          gapSkills += 1;
        }
      }

      let score = gapScore * 10;
      if (careerMapping) score += careerMapping.relevance * 20;
      if (project.project_type === "portfolio") score += 5;
      if (project.project_type === "capstone") score += 8;
      if (project.difficulty === "beginner") score += 2;
      if (statusByProjectId.get(project.id) === "completed") score -= 1000;
      if (statusByProjectId.get(project.id) === "in_progress") score += 15;

      return {
        ...toPublicProject(project, { skills, careers: careerMappings }),
        recommendation: {
          score,
          careerMatch: Boolean(careerMapping),
          gapSkillsCovered: gapSkills,
          reason: careerMapping
            ? gapSkills > 0
              ? `Matches your ${resolvedCareer} path and targets ${gapSkills} skill gap${gapSkills === 1 ? "" : "s"}.`
              : `Strong portfolio fit for your ${resolvedCareer} career path.`
            : gapSkills > 0
              ? `Builds ${gapSkills} skill gap${gapSkills === 1 ? "" : "s"} relevant to your career target.`
              : "A useful practice project for broad skill development.",
        },
      };
    })
  );

  detailed.sort((a, b) => b.recommendation.score - a.recommendation.score || a.title.localeCompare(b.title));

  return {
    careerGoal: profile.career_goal_title,
    resolvedCareer,
    projects: await withContentAccess(detailed.slice(0, Math.max(1, Math.min(Number(limit) || 6, 20))),userId,"project","projectId"),
    disclaimer: "Project recommendations support skill development and portfolio building. They do not guarantee employment, freelance income, or a job offer.",
  };
}

export async function getMyProjects(userId) {
  const rows = await projectModel.listUserProjects(userId);
  return withContentAccess(rows.map((row) => ({
    projectId: row.project_id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.short_description,
    difficulty: row.difficulty,
    estimatedHours: row.estimated_hours,
    projectType: row.project_type,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })),userId,"project","projectId");
}

export async function startProject(userId, projectId) {
  await requireEntityAccess(userId,"project",projectId);
  const project = await projectModel.getProjectById(projectId);
  if (!project || !project.is_active) throw new ApiError(404, "Project not found.");
  const userProject = await projectModel.startOrGetUserProject(userId, projectId);
  return { project: await getProject(projectId, userId), userProject };
}

export async function setProjectStatus(userId, projectId, status) {
  await requireEntityAccess(userId,"project",projectId);
  if (!VALID_STATUSES.has(status)) {
    throw new ApiError(400, "Status must be not_started, in_progress, completed, or paused.");
  }
  const project = await projectModel.getProjectById(projectId);
  if (!project || !project.is_active) throw new ApiError(404, "Project not found.");

  let userProject = await projectModel.getUserProject(userId, projectId);
  if (!userProject) {
    userProject = status === "not_started"
      ? await projectModel.createUserProject(userId, projectId)
      : await projectModel.startOrGetUserProject(userId, projectId);
  }

  if (userProject.status !== status) {
    userProject = await projectModel.updateUserProjectStatus(userId, projectId, status);
  }

  return { project: await getProject(projectId, userId), userProject };
}

export default {
  getProjects,
  getProject,
  getRecommendedProjects,
  getMyProjects,
  startProject,
  setProjectStatus,
};
