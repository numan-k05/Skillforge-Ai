import { ApiError } from "../middleware/errorHandler.js";
import { getProfileByUserId } from "../models/profileModel.js";
import { getActiveRoadmapForUser, getRoadmapWithDetails } from "../models/roadmapModel.js";
import { getSkillAnalysis } from "./skillAnalysisService.js";
import { generateText, isAIConfigured } from "./aiService.js";
import {
  countResourcesForSkill,
  getRoadmapItemForUser,
  getSkillById,
  listResourcesForSkill,
  listResourcesForSkills,
} from "../models/learningResourceModel.js";

function toPublicResource(row) {
  return {
    id: row.id,
    skillId: row.skill_id,
    skillName: row.skill_name,
    title: row.title,
    description: row.description,
    provider: row.provider,
    resourceType: row.resource_type,
    url: row.url,
    difficulty: row.difficulty,
    estimatedHours: row.estimated_hours,
    isFree: row.is_free,
  };
}

function pagination(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function getResourcesForSkill(skillId, filters) {
  const skill = await getSkillById(skillId);
  if (!skill) throw new ApiError(404, "Skill not found.");
  const all = await listResourcesForSkill(skillId, filters);
  const total = await countResourcesForSkill(skillId, filters);
  const start = (filters.page - 1) * filters.limit;
  return { skill: { id: skill.id, name: skill.name }, resources: all.slice(start, start + filters.limit).map(toPublicResource), pagination: pagination(filters.page, filters.limit, total) };
}

export async function getResourcesForRoadmapItem(userId, roadmapItemId, filters) {
  const item = await getRoadmapItemForUser(roadmapItemId, userId);
  if (!item) throw new ApiError(404, "Roadmap item not found.");
  if (!item.skill_id) throw new ApiError(409, "This roadmap item is not tied to one skill, so it has no skill-specific resources.");
  const payload = await getResourcesForSkill(item.skill_id, filters);
  return { roadmapItem: { id: item.id, title: item.title, itemType: item.item_type, status: item.status }, ...payload };
}

function deterministicScore(resource, skill, roadmapSkillIds, weeklyHours) {
  let score = (skill.gap * 20) + (skill.importance * 8);
  if (roadmapSkillIds.has(resource.skill_id)) score += 15;
  if (resource.is_free) score += 4;
  if (resource.estimated_hours && weeklyHours && resource.estimated_hours <= weeklyHours * 2) score += 5;
  const idealDifficulty = skill.currentLevel <= 1 ? "beginner" : skill.currentLevel < skill.requiredLevel ? "intermediate" : "advanced";
  if (resource.difficulty === idealDifficulty) score += 8;
  if (resource.resource_type === "practice" && skill.status === "developing") score += 5;
  if (["course", "tutorial", "documentation"].includes(resource.resource_type) && skill.status === "missing") score += 4;
  return score;
}

function parseResourceIds(text, allowedIds) {
  const match = typeof text === "string" && text.match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const ids = JSON.parse(match[0]).resourceIds;
    if (!Array.isArray(ids)) return [];
    return [...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && allowedIds.has(id)))];
  } catch { return []; }
}

async function aiRank(resources, skills) {
  if (!isAIConfigured() || resources.length < 2) return null;
  const allowedIds = new Set(resources.map((resource) => resource.id));
  const prompt = `Rank verified learning resource IDs for a learner. Return only JSON: {"resourceIds":[1,2]}.
Use only the listed IDs. Never create a URL or resource.
Skill gaps: ${JSON.stringify(skills.map((skill) => ({ id: skill.skillId, name: skill.skillName, current: skill.currentLevel, required: skill.requiredLevel, gap: skill.gap, importance: skill.importance })))}
Verified catalog: ${JSON.stringify(resources.slice(0, 40).map((resource) => ({ id: resource.id, skillId: resource.skill_id, title: resource.title, provider: resource.provider, type: resource.resource_type, difficulty: resource.difficulty, hours: resource.estimated_hours, free: resource.is_free })))} `;
  try {
    const result = await generateText({ system: "You rank only supplied verified learning resources. Never output URLs.", prompt, maxTokens: 300, temperature: 0.1 });
    return parseResourceIds(result.text, allowedIds);
  } catch { return null; }
}

export async function getRecommendedResources(userId, filters) {
  const [profile, analysis, activeRoadmap] = await Promise.all([
    getProfileByUserId(userId),
    getSkillAnalysis(userId),
    getActiveRoadmapForUser(userId),
  ]);
  const gapSkills = analysis.skills.filter((skill) => skill.gap > 0);
  const targetSkills = gapSkills.length ? gapSkills : analysis.skills;
  const skillById = new Map(targetSkills.map((skill) => [skill.skillId, skill]));
  const resources = await listResourcesForSkills([...skillById.keys()], filters);
  const roadmapDetail = activeRoadmap ? await getRoadmapWithDetails(activeRoadmap.id, userId) : null;
  const roadmapSkillIds = new Set((roadmapDetail?.phases || []).flatMap((phase) => phase.items).filter((item) => item.status !== "completed" && item.skill_id).map((item) => item.skill_id));
  const ranked = resources
    .map((resource) => ({ resource, score: deterministicScore(resource, skillById.get(resource.skill_id), roadmapSkillIds, profile?.weekly_hours_available) }))
    .sort((a, b) => b.score - a.score || a.resource.estimated_hours - b.resource.estimated_hours || a.resource.title.localeCompare(b.resource.title));
  const aiIds = await aiRank(ranked.map((entry) => entry.resource), targetSkills);
  const aiOrder = new Map((aiIds || []).map((id, index) => [id, index]));
  if (aiOrder.size) ranked.sort((a, b) => (aiOrder.get(a.resource.id) ?? 999) - (aiOrder.get(b.resource.id) ?? 999) || b.score - a.score);
  const start = (filters.page - 1) * filters.limit;
  return {
    career: analysis.resolvedCareer,
    recommendationMode: aiOrder.size ? "ai-ranked" : "personalized",
    resources: ranked.slice(start, start + filters.limit).map(({ resource }) => toPublicResource(resource)),
    pagination: pagination(filters.page, filters.limit, ranked.length),
  };
}

export default { getResourcesForSkill, getResourcesForRoadmapItem, getRecommendedResources };
