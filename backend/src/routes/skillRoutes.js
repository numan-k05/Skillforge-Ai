import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { updateSkillsSchema } from "../utils/validation.js";
import {
  getSkillsCatalogController,
  getMySkillsController,
  updateMySkillsController,
  listUniversalSkillsController,
  getSkillController,
  listSkillCategoriesController,
} from "../controllers/skillController.js";

const router = Router();

// ---- Phase 4A: a user's own self-assessed skills (auth required) ------
router.get("/catalog", requireAuth, getSkillsCatalogController);
router.get("/me", requireAuth, getMySkillsController);
router.put("/me", requireAuth, validate(updateSkillsSchema), updateMySkillsController);

// ---- Phase 5A: universal skill catalog (public reference data) --------
// Registered after the static "/catalog" and "/me" paths above so those
// keep matching first — "/:id" below only catches everything else.
router.get("/categories", listSkillCategoriesController);
router.get("/", listUniversalSkillsController);
router.get("/:id", getSkillController);

export default router;
