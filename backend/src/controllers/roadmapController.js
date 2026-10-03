import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import * as roadmapService from "../services/roadmapService.js";

function parseId(raw, label) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `${label} must be a positive integer.`);
  }
  return id;
}

export const generateRoadmapController = asyncHandler(async (req, res) => {
  const { timelineWeeks } = req.validated || {};
  const roadmap = await roadmapService.generateRoadmap(req.user.id, { timelineWeeks });
  res.status(201).json(roadmap);
});

export const getActiveRoadmapController = asyncHandler(async (req, res) => {
  const roadmap = await roadmapService.getActiveRoadmap(req.user.id);
  res.status(200).json(roadmap);
});

export const getRoadmapController = asyncHandler(async (req, res) => {
  const roadmapId = parseId(req.params.id, "Roadmap id");
  const roadmap = await roadmapService.getRoadmapDetail(req.user.id, roadmapId);
  res.status(200).json(roadmap);
});

export const regenerateRoadmapController = asyncHandler(async (req, res) => {
  const roadmapId = parseId(req.params.id, "Roadmap id");
  const { timelineWeeks } = req.validated || {};
  const roadmap = await roadmapService.regenerateRoadmap(req.user.id, roadmapId, { timelineWeeks });
  res.status(200).json(roadmap);
});

export const updateRoadmapStatusController = asyncHandler(async (req, res) => {
  const roadmapId = parseId(req.params.id, "Roadmap id");
  const { status } = req.validated;
  const roadmap = await roadmapService.setRoadmapStatus(req.user.id, roadmapId, status);
  res.status(200).json({ roadmap });
});

export const deleteRoadmapController = asyncHandler(async (req, res) => {
  const roadmapId = parseId(req.params.id, "Roadmap id");
  await roadmapService.removeRoadmap(req.user.id, roadmapId);
  res.status(204).send();
});

export default {
  generateRoadmapController,
  getActiveRoadmapController,
  getRoadmapController,
  regenerateRoadmapController,
  updateRoadmapStatusController,
  deleteRoadmapController,
};
