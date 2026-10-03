import { asyncHandler } from "../utils/asyncHandler.js";
import * as skillAnalysisService from "../services/skillAnalysisService.js";

export const getSkillAnalysisController = asyncHandler(async (req, res) => {
  const result = await skillAnalysisService.getSkillAnalysis(req.user.id);
  res.status(200).json(result);
});

export const getSkillAnalysisSummaryController = asyncHandler(async (req, res) => {
  const result = await skillAnalysisService.getSkillAnalysisSummary(req.user.id);
  res.status(200).json(result);
});

export default { getSkillAnalysisController, getSkillAnalysisSummaryController };
