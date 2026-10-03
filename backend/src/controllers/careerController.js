import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import * as careerService from "../services/careerService.js";

function parseId(raw, label) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `${label} must be a positive integer.`);
  }
  return id;
}

export const listCareersController = asyncHandler(async (req, res) => {
  const categoryId = req.query.categoryId ? parseId(req.query.categoryId, "categoryId") : undefined;
  const careers = await careerService.getCareers({ categoryId });
  res.status(200).json({ careers });
});

export const getCareerController = asyncHandler(async (req, res) => {
  const careerId = parseId(req.params.id, "Career id");
  const career = await careerService.getCareerDetail(careerId);
  res.status(200).json({ career });
});

export const getCareerSkillsController = asyncHandler(async (req, res) => {
  const careerId = parseId(req.params.id, "Career id");
  const result = await careerService.getSkillsForCareer(careerId);
  res.status(200).json(result);
});

export default { listCareersController, getCareerController, getCareerSkillsController };
