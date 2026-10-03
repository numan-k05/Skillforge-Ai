import * as skillAnalysisService from "./skillAnalysisService.js";
import * as progressService from "./progressService.js";
import * as careerReadinessModel from "../models/careerReadinessModel.js";

/**
 * The score is the existing deterministic required-skill coverage score. Real
 * activity is returned as separate evidence so no arbitrary weighting can make
 * a student appear more career-ready than their current skills support.
 */
export async function getCareerReadinessOverview(userId) {
  const [skillSummary, progress] = await Promise.all([skillAnalysisService.getSkillAnalysisSummary(userId), progressService.getOverview(userId)]);
  const skillCoverage = { totalSkills: skillSummary.totalSkills, strongCount: skillSummary.strongCount, developingCount: skillSummary.developingCount, missingCount: skillSummary.missingCount };
  const recorded = await careerReadinessModel.recordSnapshotIfChanged(userId, { careerTitle: skillSummary.resolvedCareer, score: skillSummary.readinessScore, summary: skillCoverage });
  return {
    generatedAt: new Date().toISOString(), career: skillSummary.resolvedCareer, score: skillSummary.readinessScore, skillCoverage, topPriorities: skillSummary.topPriorities,
    progressEvidence: { overallProgress: progress.overall.overall, components: progress.overall.components },
    historyRecorded: recorded.created,
    methodology: "Career readiness equals the percentage of required skill levels currently covered for the selected career. Each skill is capped at its required level, so one strong skill cannot offset a missing required skill.",
    disclaimer: skillSummary.disclaimer,
  };
}

export const getCareerReadinessHistory = (userId, limit) => careerReadinessModel.getSnapshotHistory(userId, limit);
export default { getCareerReadinessOverview, getCareerReadinessHistory };
