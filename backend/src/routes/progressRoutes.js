import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getOverviewController, getHistoryController, getRoadmapController,
  getProjectsController, getMissionsController, getChallengesController,
  getSkillsController,
} from "../controllers/progressController.js";

const router = Router();
router.use(requireAuth);
router.get("/overview", getOverviewController);
router.get("/history", getHistoryController);
router.get("/roadmap", getRoadmapController);
router.get("/projects", getProjectsController);
router.get("/missions", getMissionsController);
router.get("/challenges", getChallengesController);
router.get("/skills", getSkillsController);
export default router;
