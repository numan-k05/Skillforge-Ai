import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateQuery } from "../middleware/validate.js";
import { learningResourceFiltersQuerySchema } from "../utils/validation.js";
import {
  getRecommendedResourcesController,
  getRoadmapItemResourcesController,
  getSkillResourcesController,
} from "../controllers/learningResourceController.js";

const router = Router();

router.get("/recommended", requireAuth, validateQuery(learningResourceFiltersQuerySchema), getRecommendedResourcesController);
router.get("/roadmap-items/:roadmapItemId", requireAuth, validateQuery(learningResourceFiltersQuerySchema), getRoadmapItemResourcesController);
router.get("/skills/:skillId", requireAuth, validateQuery(learningResourceFiltersQuerySchema), getSkillResourcesController);

export default router;
