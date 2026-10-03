import { Router } from "express";
import { getCareerSkillsController } from "../controllers/careerSkillController.js";

const router = Router();

// Public reference data — not user-specific, so no auth required.
// GET /api/career-skills            -> every supported career's requirements
// GET /api/career-skills?career=X   -> just career X's requirements
router.get("/", getCareerSkillsController);

export default router;
