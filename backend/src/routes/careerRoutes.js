import { Router } from "express";
import {
  listCareersController,
  getCareerController,
  getCareerSkillsController,
} from "../controllers/careerController.js";

const router = Router();

// Public reference data — the career catalog and each career's skill
// requirements are the same for every user, so none of this needs auth.
// GET /api/careers                 -> full catalog (optionally ?categoryId=)
// GET /api/careers/:id             -> one career
// GET /api/careers/:id/skills      -> that career's required/recommended/optional skills
router.get("/", listCareersController);
router.get("/:id", getCareerController);
router.get("/:id/skills", getCareerSkillsController);

export default router;
