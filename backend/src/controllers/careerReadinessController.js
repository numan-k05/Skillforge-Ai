import { asyncHandler } from "../utils/asyncHandler.js";
import * as careerReadinessService from "../services/careerReadinessService.js";

export const getCareerReadinessOverviewController = asyncHandler(async (req, res) => res.json(await careerReadinessService.getCareerReadinessOverview(req.user.id)));
export const getCareerReadinessHistoryController = asyncHandler(async (req, res) => res.json(await careerReadinessService.getCareerReadinessHistory(req.user.id, req.query.limit)));
export default { getCareerReadinessOverviewController, getCareerReadinessHistoryController };
