import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getDashboardOverviewController } from "../controllers/dashboardController.js";

const router = Router();
router.use(requireAuth);
router.get("/overview", getDashboardOverviewController);

export default router;
