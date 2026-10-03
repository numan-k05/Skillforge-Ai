import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { updateProjectStatusSchema } from "../utils/validation.js";
import {
  listProjectsController,
  getProjectController,
  getRecommendedProjectsController,
  getMyProjectsController,
  startProjectController,
  updateProjectStatusController,
} from "../controllers/projectController.js";

const router = Router();

// Public catalog routes.
router.get("/",optionalAuth, listProjectsController);

// Personalized routes must appear before /:id.
router.get("/recommended", requireAuth, getRecommendedProjectsController);
router.get("/mine", requireAuth, getMyProjectsController);
router.post("/:id/start", requireAuth, startProjectController);
router.patch("/:id/status", requireAuth, validate(updateProjectStatusSchema), updateProjectStatusController);
router.get("/:id", requireAuth, getProjectController);

export default router;
