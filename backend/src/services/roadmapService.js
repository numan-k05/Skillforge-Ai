import { ApiError } from "../middleware/errorHandler.js";
import { getProfileByUserId } from "../models/profileModel.js";
import { getSkillAnalysis, SKILL_PRIORITY } from "./skillAnalysisService.js";
import { resolveCareer } from "../utils/careerMatcher.js";
import { generateText, isAIConfigured } from "./aiService.js";
import {
  saveGeneratedRoadmap,
  getActiveRoadmapForUser,
  getRoadmapWithDetails,
  listRoadmapsForUser as listRoadmapRowsForUser,
  updateRoadmapStatus as updateRoadmapStatusModel,
  deleteRoadmap as deleteRoadmapModel,
} from "../models/roadmapModel.js";

// ---------------------------------------------------------------------
// Phase 6C — AI roadmap generation with validated deterministic fallback.
// The deterministic engine remains the source-of-truth fallback and testable baseline.
//
// This module does NOT compute skill gaps itself. It calls
// skillAnalysisService.getSkillAnalysis(), which is the existing,
// already-tested source of truth for current level / required level /
// gap / importance / priority (see database/schema/007_universal_careers.sql
// and skillAnalysisService.js). The roadmap engine's only job is to
// turn that per-skill breakdown into an ordered set of phases and
// items. No AI API is used — every step below is a pure function of
// the analysis + profile data, so the same inputs always produce the
// same roadmap.
// ---------------------------------------------------------------------

const PRIORITY_WEIGHT = { [SKILL_PRIORITY.HIGH]: 3, [SKILL_PRIORITY.MEDIUM]: 2, [SKILL_PRIORITY.LOW]: 1 };

// Hours-per-level baselines. Deliberately simple and easy to re-tune
// later without changing the shape of the output.
const HOURS_PER_LEVEL_LEARNING = 6; // missing skill: 0 -> required level
const HOURS_PER_LEVEL_PRACTICE = 4; // developing skill: partial -> required level
const PROJECT_ITEM_HOURS = 12;
const ASSESSMENT_ITEM_HOURS = 2;

function importanceFactor(importance) {
  // importance is 1-3 in the data model; scale hours modestly around 1x.
  return 0.8 + (Math.max(1, Math.min(3, importance)) - 1) * 0.2; // 0.8 - 1.2
}

function estimateHours(gap, importance, hoursPerLevel) {
  return Math.max(1, Math.round(gap * hoursPerLevel * importanceFactor(importance)));
}

/** Deterministic ranking: higher priority first, then bigger gap, then higher importance, then name. */
function compareSkillItems(a, b) {
  const priorityDiff = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
  if (priorityDiff !== 0) return priorityDiff;
  if (b.gap !== a.gap) return b.gap - a.gap;
  if (b.importance !== a.importance) return b.importance - a.importance;
  return a.skillName.localeCompare(b.skillName);
}

function buildLearningPhase(missingSkills) {
  return {
    title: "Foundations — Build Missing Skills",
    description:
      "Skills you don't currently have that are required for this career. Tackled in priority order first.",
    estimatedWeeks: null,
    items: missingSkills.map((skill) => ({
      skillId: skill.skillId,
      itemType: "learning",
      title: `Learn ${skill.skillName}`,
      description: `Go from no prior experience to level ${skill.requiredLevel}/5 in ${skill.skillName}.`,
      priority: skill.priority,
      estimatedHours: estimateHours(skill.gap, skill.importance, HOURS_PER_LEVEL_LEARNING),
      resourceNote: skill.category ? `Category: ${skill.category}` : null,
    })),
  };
}

function buildPracticePhase(developingSkills) {
  return {
    title: "Strengthen Developing Skills",
    description:
      "Skills you've already started but haven't reached the level this career requires. Deliberate practice closes the remaining gap.",
    estimatedWeeks: null,
    items: developingSkills.map((skill) => ({
      skillId: skill.skillId,
      itemType: "practice",
      title: `Practice ${skill.skillName}`,
      description: `Go from level ${skill.currentLevel}/5 to level ${skill.requiredLevel}/5 in ${skill.skillName}.`,
      priority: skill.priority,
      estimatedHours: estimateHours(skill.gap, skill.importance, HOURS_PER_LEVEL_PRACTICE),
      resourceNote: skill.category ? `Category: ${skill.category}` : null,
    })),
  };
}

function buildProjectPhase(rankedGapSkills, careerTitle) {
  const topSkills = rankedGapSkills.slice(0, 3);
  const skillNames = topSkills.map((s) => s.skillName).join(", ");
  const anyHighPriority = topSkills.some((s) => s.priority === SKILL_PRIORITY.HIGH);

  return {
    title: "Apply Your Skills",
    description: "A project that puts your highest-priority skills into practice together.",
    estimatedWeeks: null,
    items: [
      {
        skillId: topSkills[0]?.skillId ?? null,
        itemType: "project",
        title: `Build a small project for ${careerTitle}`,
        description: topSkills.length
          ? `Design and build something that exercises ${skillNames}.`
          : `Design and build a small project relevant to ${careerTitle}.`,
        priority: anyHighPriority ? SKILL_PRIORITY.HIGH : SKILL_PRIORITY.MEDIUM,
        estimatedHours: PROJECT_ITEM_HOURS,
        resourceNote: null,
      },
    ],
  };
}

function buildAssessmentPhase(careerTitle) {
  return {
    title: "Validate Readiness",
    description: "Confirm progress before moving on.",
    estimatedWeeks: null,
    items: [
      {
        skillId: null,
        itemType: "assessment",
        title: "Re-run your skill gap analysis",
        description: `After completing the phases above, retake the skill analysis to confirm your readiness for ${careerTitle}.`,
        priority: "medium",
        estimatedHours: ASSESSMENT_ITEM_HOURS,
        resourceNote: null,
      },
    ],
  };
}

/**
 * Pure function: builds the phase/item plan from an already-computed
 * skill analysis + career title. Exported separately from the
 * DB-touching parts so it's easy to unit test with mock data.
 */
export function buildRoadmapPlan({ resolvedCareer, skills }) {
  const meaningfulGaps = skills.filter((s) => s.gap > 0).sort(compareSkillItems);
  const missing = meaningfulGaps.filter((s) => s.status === "missing");
  const developing = meaningfulGaps.filter((s) => s.status === "developing");

  const phases = [];

  if (missing.length > 0) phases.push(buildLearningPhase(missing));
  if (developing.length > 0) phases.push(buildPracticePhase(developing));

  if (meaningfulGaps.length > 0) {
    phases.push(buildProjectPhase(meaningfulGaps, resolvedCareer));
  }

  phases.push(buildAssessmentPhase(resolvedCareer));

  const totalHours = phases.reduce(
    (sum, phase) => sum + phase.items.reduce((s, item) => s + (item.estimatedHours || 0), 0),
    0
  );

  return { phases, totalHours, hasMeaningfulGaps: meaningfulGaps.length > 0 };
}

/**
 * Assigns estimatedWeeks to each phase by splitting the roadmap's total
 * weeks proportionally to each phase's share of total hours (at least
 * 1 week per non-empty phase). Weeks-per-phase is advisory only — it's
 * not read by anything else in Phase 6A.
 */
function distributeWeeksAcrossPhases(phases, totalWeeks, totalHours) {
  if (!totalWeeks || !totalHours) return phases;
  return phases.map((phase) => {
    const phaseHours = phase.items.reduce((s, item) => s + (item.estimatedHours || 0), 0);
    if (phaseHours === 0) return phase;
    const share = Math.max(1, Math.round((phaseHours / totalHours) * totalWeeks));
    return { ...phase, estimatedWeeks: share };
  });
}

/**
 * Generates a personalized roadmap for the given user, saves it, and
 * returns the complete saved roadmap. Throws a clear ApiError (via the
 * skill-analysis call) if the user hasn't finished onboarding, hasn't
 * set a career goal, or their career goal isn't supported yet — the
 * same validation skillAnalysisService already enforces, reused here
 * rather than duplicated.
 */

const AI_SYSTEM_PROMPT = `You are SkillForge AI, a career-learning roadmap planner.
Create practical, realistic learning roadmaps for students.
Return ONLY valid JSON. Do not use markdown fences, comments, or extra text.
Never invent skill IDs. Use only the supplied skill names.
Keep the plan achievable within the supplied weekly hours and target timeline.
Prioritize skill gaps before already-strong skills.`;

function buildRoadmapAIPrompt({ profile, analysis, targetWeeks }) {
  const skillRows = analysis.skills.map((skill) => ({
    skillName: skill.skillName,
    category: skill.category,
    currentLevel: skill.currentLevel,
    requiredLevel: skill.requiredLevel,
    gap: skill.gap,
    status: skill.status,
    priority: skill.priority,
    importance: skill.importance,
  }));

  return `Build a personalized roadmap for this student.

Student profile:
${JSON.stringify({
    university: profile?.university ?? null,
    degree: profile?.degree ?? null,
    semester: profile?.semester ?? null,
    country: profile?.country ?? null,
    weeklyHours: profile?.weekly_hours_available ?? null,
    learningGoals: profile?.learning_goals ?? null,
  }, null, 2)}

Career: ${analysis.resolvedCareer}
Target weeks: ${targetWeeks ?? "not specified"}

Skill analysis (source of truth):
${JSON.stringify(skillRows, null, 2)}

Return exactly this JSON shape:
{
  "title": "string",
  "description": "string",
  "phases": [
    {
      "title": "string",
      "description": "string",
      "estimatedWeeks": 1,
      "items": [
        {
          "skillName": "one supplied skill name or null",
          "itemType": "learning | practice | project | assessment",
          "title": "string",
          "description": "string",
          "priority": "high | medium | low",
          "estimatedHours": 1,
          "resourceNote": "string or null"
        }
      ]
    }
  ]
}

Rules:
- 2 to 5 phases.
- 1 to 8 items per phase.
- Every item needs a useful action, not vague motivation.
- Learning items should target missing skills; practice items should target developing skills.
- Include at least one project item and one assessment item.
- Keep estimated hours positive integers.
- Do not claim a job, income, or employment guarantee.
- If there are no meaningful gaps, focus on projects, deeper practice, and readiness validation.`;
}

function parseJsonObject(text) {
  if (typeof text !== "string") throw new Error("AI response is not text.");
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error("AI response did not contain a JSON object.");
  return JSON.parse(trimmed.slice(first, last + 1));
}

function normalizeAIPlan(raw, { analysis, targetWeeks, weeklyHours }) {
  if (!raw || !Array.isArray(raw.phases) || raw.phases.length < 2 || raw.phases.length > 5) {
    throw new Error("AI roadmap must contain between 2 and 5 phases.");
  }

  const allowedSkills = new Map(analysis.skills.map((s) => [s.skillName.trim().toLowerCase(), s]));
  const allowedTypes = new Set(["learning", "practice", "project", "assessment"]);
  const allowedPriorities = new Set(["high", "medium", "low"]);
  const phases = raw.phases.map((phase, phaseIndex) => {
    if (!phase || typeof phase.title !== "string" || !phase.title.trim() || !Array.isArray(phase.items) || phase.items.length < 1 || phase.items.length > 8) {
      throw new Error(`AI phase ${phaseIndex + 1} is invalid.`);
    }
    return {
      title: phase.title.trim().slice(0, 160),
      description: typeof phase.description === "string" ? phase.description.trim().slice(0, 500) : null,
      estimatedWeeks: Number.isFinite(Number(phase.estimatedWeeks)) && Number(phase.estimatedWeeks) > 0 ? Math.max(1, Math.round(Number(phase.estimatedWeeks))) : null,
      items: phase.items.map((item, itemIndex) => {
        if (!item || typeof item.title !== "string" || !item.title.trim() || !allowedTypes.has(item.itemType)) {
          throw new Error(`AI item ${phaseIndex + 1}.${itemIndex + 1} is invalid.`);
        }
        const matchedSkill = item.skillName ? allowedSkills.get(String(item.skillName).trim().toLowerCase()) : null;
        if (item.skillName && !matchedSkill) throw new Error(`AI referenced unknown skill: ${item.skillName}`);
        const hours = Number(item.estimatedHours);
        if (!Number.isFinite(hours) || hours <= 0 || hours > 80) throw new Error(`AI item ${phaseIndex + 1}.${itemIndex + 1} has invalid estimated hours.`);
        const priority = allowedPriorities.has(item.priority) ? item.priority : matchedSkill?.priority || "medium";
        return {
          skillId: matchedSkill?.skillId ?? null,
          itemType: item.itemType,
          title: item.title.trim().slice(0, 180),
          description: typeof item.description === "string" ? item.description.trim().slice(0, 700) : null,
          priority,
          estimatedHours: Math.round(hours),
          resourceNote: typeof item.resourceNote === "string" ? item.resourceNote.trim().slice(0, 300) : null,
        };
      }),
    };
  });

  const allItems = phases.flatMap((p) => p.items);
  if (!allItems.some((i) => i.itemType === "project")) throw new Error("AI roadmap must include a project item.");
  if (!allItems.some((i) => i.itemType === "assessment")) throw new Error("AI roadmap must include an assessment item.");

  const totalHours = allItems.reduce((sum, item) => sum + item.estimatedHours, 0);
  const availableHours = Number(weeklyHours) || null;
  if (targetWeeks && availableHours && totalHours > targetWeeks * availableHours * 1.35) {
    throw new Error("AI roadmap exceeds the requested weekly workload by too much.");
  }

  return {
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim().slice(0, 180) : `${analysis.resolvedCareer} AI Roadmap`,
    description: typeof raw.description === "string" ? raw.description.trim().slice(0, 700) : `AI-personalized roadmap for ${analysis.resolvedCareer}.`,
    phases,
  };
}

async function generateAIRoadmap(userId, { timelineWeeks } = {}) {
  const [profile, analysis] = await Promise.all([getProfileByUserId(userId), getSkillAnalysis(userId)]);
  const careerRow = await resolveCareer(profile?.career_goal_title);
  if (!careerRow) throw new ApiError(404, `"${analysis.careerGoal}" isn't in the supported career list yet.`, { code: "CAREER_NOT_SUPPORTED" });

  const deterministic = buildRoadmapPlan({ resolvedCareer: analysis.resolvedCareer, skills: analysis.skills });
  const weeklyHours = profile.weekly_hours_available || null;
  const targetWeeks = timelineWeeks ?? (weeklyHours ? Math.max(1, Math.ceil(deterministic.totalHours / weeklyHours)) : null);

  try {
    const result = await generateText({
      system: AI_SYSTEM_PROMPT,
      prompt: buildRoadmapAIPrompt({ profile, analysis, targetWeeks }),
      maxTokens: 3200,
      temperature: 0.2,
    });
    const raw = parseJsonObject(result.text);
    const plan = normalizeAIPlan(raw, { analysis, targetWeeks, weeklyHours });
    const roadmapId = await saveGeneratedRoadmap(userId, {
      careerId: careerRow.id,
      careerTitle: analysis.resolvedCareer,
      title: plan.title,
      description: plan.description,
      targetWeeks,
      weeklyHours,
    }, distributeWeeksAcrossPhases(plan.phases, targetWeeks, plan.phases.flatMap(p => p.items).reduce((s,i) => s + i.estimatedHours, 0)));
    return { ...(await getRoadmapWithDetails(roadmapId, userId)), generation: { mode: "ai", provider: "anthropic", model: result.model || undefined } };
  } catch (err) {
    // AI failure must never make roadmap generation unusable. Fall back to
    // the deterministic engine, but preserve provider errors for logs/debugging.
    if (err?.name !== "AIServiceError") console.warn("[roadmap] AI output rejected; using deterministic fallback:", err?.message || err);
    else console.warn("[roadmap] AI generation failed; using deterministic fallback:", err.code, err.message);
    return generateDeterministicRoadmap(userId, { timelineWeeks, generationMode: "fallback" });
  }
}

export async function generateRoadmap(userId, options = {}) {
  // Live AI is opt-in through AI_API_KEY. Without it, 6C remains fully usable.
  return isAIConfigured() ? generateAIRoadmap(userId, options) : generateDeterministicRoadmap(userId, { ...options, generationMode: "deterministic" });
}

async function generateDeterministicRoadmap(userId, { timelineWeeks, generationMode = "deterministic" } = {}) {
  const [profile, analysis] = await Promise.all([getProfileByUserId(userId), getSkillAnalysis(userId)]);

  const careerRow = await resolveCareer(profile.career_goal_title);
  // analysis already guarantees this resolves (getSkillAnalysis throws otherwise),
  // but guard defensively in case of a race between profile changes.
  if (!careerRow) {
    throw new ApiError(404, `"${analysis.careerGoal}" isn't in the supported career list yet.`, {
      code: "CAREER_NOT_SUPPORTED",
    });
  }

  const { phases, totalHours, hasMeaningfulGaps } = buildRoadmapPlan({
    resolvedCareer: analysis.resolvedCareer,
    skills: analysis.skills,
  });

  const weeklyHours = profile.weekly_hours_available || null;
  const targetWeeks =
    timelineWeeks ?? (weeklyHours ? Math.max(1, Math.ceil(totalHours / weeklyHours)) : null);

  const finalPhases = distributeWeeksAcrossPhases(phases, targetWeeks, totalHours);

  const description = hasMeaningfulGaps
    ? `A personalized plan to close your skill gaps for ${analysis.resolvedCareer}, built from your latest skill analysis.`
    : `You're already covering the required skills for ${analysis.resolvedCareer}. This plan focuses on validating and applying what you know.`;

  const roadmapId = await saveGeneratedRoadmap(
    userId,
    {
      careerId: careerRow.id,
      careerTitle: analysis.resolvedCareer,
      title: `${analysis.resolvedCareer} Roadmap`,
      description,
      targetWeeks,
      weeklyHours,
    },
    finalPhases
  );

  return { ...(await getRoadmapWithDetails(roadmapId, userId)), generation: { mode: generationMode, provider: generationMode === "deterministic" ? "internal" : "anthropic" } };
}

export async function regenerateRoadmap(userId, roadmapId, options) {
  const existing = await getRoadmapWithDetails(roadmapId, userId);
  if (!existing) throw new ApiError(404, "Roadmap not found.");

  // Regeneration always pulls the user's CURRENT career/skills/profile —
  // it never reuses data from the roadmap being replaced.
  return generateRoadmap(userId, options);
}

export async function getActiveRoadmap(userId) {
  const summary = await getActiveRoadmapForUser(userId);
  if (!summary) {
    throw new ApiError(404, "You don't have a roadmap yet. Generate one to get started.", {
      code: "NO_ACTIVE_ROADMAP",
    });
  }
  return getRoadmapWithDetails(summary.id, userId);
}

export async function getRoadmapDetail(userId, roadmapId) {
  const roadmap = await getRoadmapWithDetails(roadmapId, userId);
  if (!roadmap) throw new ApiError(404, "Roadmap not found.");
  return roadmap;
}

export async function listRoadmaps(userId) {
  return listRoadmapRowsForUser(userId);
}

const VALID_STATUSES = ["draft", "active", "completed", "archived"];

export async function setRoadmapStatus(userId, roadmapId, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${VALID_STATUSES.join(", ")}.`);
  }
  const updated = await updateRoadmapStatusModel(roadmapId, userId, status);
  if (!updated) throw new ApiError(404, "Roadmap not found.");
  return updated;
}

export async function removeRoadmap(userId, roadmapId) {
  const deleted = await deleteRoadmapModel(roadmapId, userId);
  if (!deleted) throw new ApiError(404, "Roadmap not found.");
}

export default {
  generateRoadmap,
  regenerateRoadmap,
  getActiveRoadmap,
  getRoadmapDetail,
  listRoadmaps,
  setRoadmapStatus,
  removeRoadmap,
};
