import { apiRequest } from "./apiClient.js";

// Phase 4A backend endpoints — this file only calls what already
// exists (GET /skill-analysis, GET /skill-analysis/summary,
// GET /career-skills). No new backend logic is introduced here.

/**
 * Full per-skill breakdown for the current user's career goal.
 * Shape: { careerGoal, resolvedCareer, skills: [...] }
 * Throws ApiError with .status and .details.code for the known
 * "not ready yet" cases (see errorCodeFor below).
 */
export async function getSkillAnalysis() {
  return apiRequest("/skill-analysis", { auth: true });
}

/**
 * Aggregated summary: readiness score, counts, top priorities.
 * Shape: { careerGoal, resolvedCareer, readinessScore, totalSkills,
 *          strongCount, developingCount, missingCount, topPriorities, disclaimer }
 */
export async function getSkillAnalysisSummary() {
  return apiRequest("/skill-analysis/summary", { auth: true });
}

/**
 * Full requirement map for one resolved career, grouped by the caller.
 * Shape: { careers: [{ career, requirements: [...] }] }
 */
export async function getCareerRequirements(career) {
  const data = await apiRequest(`/career-skills?career=${encodeURIComponent(career)}`, {
    auth: true,
  });
  return data.careers?.[0]?.requirements || [];
}

/**
 * Loads everything the Skill Gap Analysis page needs in one call.
 * The summary and skills calls fail the same way (same guard clauses
 * in the backend), so if either rejects we surface that error and
 * skip the career-requirements call rather than issuing it pointlessly.
 */
export async function loadSkillAnalysisPageData() {
  const [summary, analysis] = await Promise.all([getSkillAnalysisSummary(), getSkillAnalysis()]);
  const requirements = await getCareerRequirements(analysis.resolvedCareer);
  return { summary, skills: analysis.skills, requirements };
}

// Known backend error codes (see ApiError .details.code in
// skillAnalysisService.js on the backend) mapped to the friendly
// copy this page shows instead of a raw error message.
export const SKILL_ANALYSIS_ERROR_COPY = {
  ONBOARDING_REQUIRED: "Complete your profile to generate your skill analysis.",
  CAREER_GOAL_REQUIRED: "Select a career goal to see your required skills.",
  CAREER_NOT_SUPPORTED: null, // handled specially — includes the supported list
};

export default {
  getSkillAnalysis,
  getSkillAnalysisSummary,
  getCareerRequirements,
  loadSkillAnalysisPageData,
  SKILL_ANALYSIS_ERROR_COPY,
};
