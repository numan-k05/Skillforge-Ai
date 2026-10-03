import { ApiError } from "../middleware/errorHandler.js";
import { getProfileByUserId } from "../models/profileModel.js";
import { getUserSkills } from "../models/userSkillModel.js";
import { getRequirementsForCareer, listSupportedCareers } from "../models/careerSkillModel.js";
import { resolveCareerTitle } from "../utils/careerMatcher.js";

export const SKILL_STATUS = {
  STRONG: "strong",
  DEVELOPING: "developing",
  MISSING: "missing",
};

export const SKILL_PRIORITY = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

function statusFor(currentLevel, requiredLevel) {
  if (currentLevel <= 0) return SKILL_STATUS.MISSING;
  if (currentLevel >= requiredLevel) return SKILL_STATUS.STRONG;
  return SKILL_STATUS.DEVELOPING;
}

/**
 * Deterministic priority from gap size (1-5) x skill importance (1-3).
 * Same inputs always produce the same output — no randomness anywhere
 * in this calculation.
 */
function priorityFor(gap, importance) {
  if (gap <= 0) return null;
  const score = gap * importance; // range: 1-15
  if (score >= 6) return SKILL_PRIORITY.HIGH;
  if (score >= 3) return SKILL_PRIORITY.MEDIUM;
  return SKILL_PRIORITY.LOW;
}

export async function getSupportedCareers() {
  return listSupportedCareers();
}

/**
 * Loads the user's profile + career goal + skills, resolves the career
 * goal against the supported career list, and computes a per-skill
 * breakdown. Throws a clear, actionable ApiError for every case where
 * analysis isn't possible yet (onboarding incomplete, no career goal
 * set, or career goal not in the supported list).
 */
async function buildAnalysis(userId) {
  const profile = await getProfileByUserId(userId);

  if (!profile || !profile.onboarding_completed) {
    throw new ApiError(409, "Finish onboarding before viewing your skill analysis.", {
      code: "ONBOARDING_REQUIRED",
    });
  }

  const rawCareerGoal = profile.career_goal_title;
  if (!rawCareerGoal) {
    throw new ApiError(409, "Set a career goal on your profile before viewing your skill analysis.", {
      code: "CAREER_GOAL_REQUIRED",
    });
  }

  const resolvedCareer = await resolveCareerTitle(rawCareerGoal);
  if (!resolvedCareer) {
    const supportedCareers = await listSupportedCareers();
    throw new ApiError(404, `"${rawCareerGoal}" isn't in the supported career list yet.`, {
      code: "CAREER_NOT_SUPPORTED",
      supportedCareers,
    });
  }

  const [requirements, userSkills] = await Promise.all([
    getRequirementsForCareer(resolvedCareer),
    getUserSkills(userId),
  ]);

  const currentLevelByName = new Map(
    userSkills.map((row) => [row.name.trim().toLowerCase(), row.proficiency_level])
  );

  const items = requirements.map((req) => {
    const currentLevel = currentLevelByName.get(req.skill_name.trim().toLowerCase()) ?? 0;
    const gap = Math.max(0, req.required_level - currentLevel);

    return {
      skillId: req.skill_id,
      skillName: req.skill_name,
      category: req.skill_category,
      requiredLevel: req.required_level,
      currentLevel,
      gap,
      importance: req.importance,
      status: statusFor(currentLevel, req.required_level),
      priority: priorityFor(gap, req.importance),
    };
  });

  return { careerGoal: rawCareerGoal, resolvedCareer, items };
}

/**
 * Overall readiness: how much of the career's required skill "weight"
 * the student currently covers, capped per-skill at 100% so being far
 * above the requirement in one skill can't offset being missing in
 * another. Deterministic and simple to re-tune later (e.g. weighting
 * by importance) without changing its shape.
 */
function calculateReadinessScore(items) {
  const totalRequired = items.reduce((sum, item) => sum + item.requiredLevel, 0);
  if (totalRequired === 0) return 0;

  const totalAchieved = items.reduce(
    (sum, item) => sum + Math.min(item.currentLevel, item.requiredLevel),
    0
  );

  return Math.round((totalAchieved / totalRequired) * 100);
}

function summarize({ careerGoal, resolvedCareer, items }) {
  const strongCount = items.filter((i) => i.status === SKILL_STATUS.STRONG).length;
  const developingCount = items.filter((i) => i.status === SKILL_STATUS.DEVELOPING).length;
  const missingCount = items.filter((i) => i.status === SKILL_STATUS.MISSING).length;

  const priorityOrder = { [SKILL_PRIORITY.HIGH]: 0, [SKILL_PRIORITY.MEDIUM]: 1, [SKILL_PRIORITY.LOW]: 2 };
  const topPriorities = items
    .filter((i) => i.priority)
    .sort((a, b) => {
      const orderDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return orderDiff !== 0 ? orderDiff : b.gap - a.gap;
    })
    .slice(0, 5)
    .map((i) => ({
      skillName: i.skillName,
      currentLevel: i.currentLevel,
      requiredLevel: i.requiredLevel,
      gap: i.gap,
      priority: i.priority,
    }));

  return {
    careerGoal,
    resolvedCareer,
    readinessScore: calculateReadinessScore(items),
    totalSkills: items.length,
    strongCount,
    developingCount,
    missingCount,
    topPriorities,
    disclaimer:
      "This score reflects skill coverage for the selected career only. It does not guarantee employment, freelance income, or a job offer.",
  };
}

export async function getSkillAnalysis(userId) {
  const { careerGoal, resolvedCareer, items } = await buildAnalysis(userId);
  return { careerGoal, resolvedCareer, skills: items };
}

export async function getSkillAnalysisSummary(userId) {
  const analysis = await buildAnalysis(userId);
  return summarize(analysis);
}

export default { getSupportedCareers, getSkillAnalysis, getSkillAnalysisSummary };
