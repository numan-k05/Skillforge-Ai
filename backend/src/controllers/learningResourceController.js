import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import * as learningResourceService from "../services/learningResourceService.js";

function positiveId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, `${label} must be a positive integer.`);
  return id;
}

export const getRecommendedResourcesController = asyncHandler(async (req, res) => {
  const payload = await learningResourceService.getRecommendedResources(req.user.id, req.validatedQuery);
  res.status(200).json(payload);
});

export const getSkillResourcesController = asyncHandler(async (req, res) => {
  const payload = await learningResourceService.getResourcesForSkill(positiveId(req.params.skillId, "Skill id"), req.validatedQuery);
  res.status(200).json(payload);
});

export const getRoadmapItemResourcesController = asyncHandler(async (req, res) => {
  const payload = await learningResourceService.getResourcesForRoadmapItem(req.user.id, positiveId(req.params.roadmapItemId, "Roadmap item id"), req.validatedQuery);
  res.status(200).json(payload);
});

export default { getRecommendedResourcesController, getSkillResourcesController, getRoadmapItemResourcesController };
