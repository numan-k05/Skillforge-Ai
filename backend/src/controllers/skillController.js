import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import * as skillService from "../services/skillService.js";
import * as skillCatalogService from "../services/skillCatalogService.js";

function parseId(raw, label) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `${label} must be a positive integer.`);
  }
  return id;
}

export const getSkillsCatalogController = asyncHandler(async (req, res) => {
  const skills = await skillService.getSkillsCatalog();
  res.status(200).json({ skills });
});

export const getMySkillsController = asyncHandler(async (req, res) => {
  const skills = await skillService.getMySkills(req.user.id);
  res.status(200).json({ skills });
});

export const updateMySkillsController = asyncHandler(async (req, res) => {
  const skills = await skillService.updateMySkills(req.user.id, req.validated.skills);
  res.status(200).json({ skills });
});

// ---- Phase 5A: universal skill catalog (public reference data) --------

export const listUniversalSkillsController = asyncHandler(async (req, res) => {
  const skillCategoryId = req.query.categoryId ? parseId(req.query.categoryId, "categoryId") : undefined;
  const skills = await skillCatalogService.getSkillCatalog({ skillCategoryId });
  res.status(200).json({ skills });
});

export const getSkillController = asyncHandler(async (req, res) => {
  const skillId = parseId(req.params.id, "Skill id");
  const skill = await skillCatalogService.getSkillDetail(skillId);
  res.status(200).json({ skill });
});

export const listSkillCategoriesController = asyncHandler(async (req, res) => {
  const categories = await skillCatalogService.getSkillCategories();
  res.status(200).json({ categories });
});

export default {
  getSkillsCatalogController,
  getMySkillsController,
  updateMySkillsController,
  listUniversalSkillsController,
  getSkillController,
  listSkillCategoriesController,
};
