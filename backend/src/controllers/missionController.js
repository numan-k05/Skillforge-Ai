import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import * as missionService from "../services/missionService.js";

export const getDailyMissionsController = asyncHandler(async (req, res) => {
  const result = await missionService.getDailyMissions(req.user.id, req.query.date);
  res.status(200).json(result);
});

export const generateDailyMissionsController = asyncHandler(async (req, res) => {
  const result = await missionService.regenerateDailyMissions(req.user.id, req.query.date);
  res.status(200).json(result);
});

export const updateMissionController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Mission id must be a positive integer.");
  const result = await missionService.updateMission(req.user.id, id, req.validated?.status);
  res.status(200).json(result);
});

export default { getDailyMissionsController, generateDailyMissionsController, updateMissionController };
