import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getCareerReadinessHistoryController, getCareerReadinessOverviewController } from "../controllers/careerReadinessController.js";

const router = Router();
router.use(requireAuth);
router.get("/overview", getCareerReadinessOverviewController);
router.get("/history", getCareerReadinessHistoryController);
export default router;
