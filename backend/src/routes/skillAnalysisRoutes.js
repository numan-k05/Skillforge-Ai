import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getSkillAnalysisController,
  getSkillAnalysisSummaryController,
} from "../controllers/skillAnalysisController.js";

const router = Router();

// Both routes use req.user.id from the verified JWT only — there is no
// way to pass another user's id in, so a user can never read someone
// else's analysis.
router.get("/", requireAuth, getSkillAnalysisController);
router.get("/summary", requireAuth, getSkillAnalysisSummaryController);

export default router;
