import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getAIStatusController } from "../controllers/aiController.js";

const router = Router();

// Configuration/status only. Actual AI generation is wired into roadmap
// generation in Phase 6C-2.
router.get("/status", requireAuth, getAIStatusController);

export default router;
