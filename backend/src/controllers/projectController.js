import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import * as projectService from "../services/projectService.js";

function parseId(raw, label) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `${label} must be a positive integer.`);
  }
  return id;
}

function parseOptionalId(raw, label) {
  return raw === undefined ? undefined : parseId(raw, label);
}

export const listProjectsController = asyncHandler(async (req, res) => {
  const careerId = parseOptionalId(req.query.careerId, "careerId");
  const skillId = parseOptionalId(req.query.skillId, "skillId");
  const difficulty = req.query.difficulty?.trim().toLowerCase();
  const projects = await projectService.getProjects({ careerId, skillId, difficulty },req.user?.id||null);
  res.status(200).json({ projects });
});

export const getProjectController = asyncHandler(async (req, res) => {
  const projectId = parseId(req.params.id, "Project id");
  const project = await projectService.getProject(projectId, req.user?.id);
  res.status(200).json({ project });
});

export const getRecommendedProjectsController = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 6;
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new ApiError(400, "limit must be a whole number between 1 and 20.");
  }
  const result = await projectService.getRecommendedProjects(req.user.id, { limit });
  res.status(200).json(result);
});

export const getMyProjectsController = asyncHandler(async (req, res) => {
  const projects = await projectService.getMyProjects(req.user.id);
  res.status(200).json({ projects });
});

export const startProjectController = asyncHandler(async (req, res) => {
  const projectId = parseId(req.params.id, "Project id");
  const result = await projectService.startProject(req.user.id, projectId);
  res.status(201).json(result);
});

export const updateProjectStatusController = asyncHandler(async (req, res) => {
  const projectId = parseId(req.params.id, "Project id");
  const { status } = req.validated || {};
  const result = await projectService.setProjectStatus(req.user.id, projectId, status);
  res.status(200).json(result);
});

export default {
  listProjectsController,
  getProjectController,
  getRecommendedProjectsController,
  getMyProjectsController,
  startProjectController,
  updateProjectStatusController,
};
