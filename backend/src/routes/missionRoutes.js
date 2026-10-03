import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { updateMissionStatusSchema } from "../utils/validation.js";
import { getDailyMissionsController, generateDailyMissionsController, updateMissionController } from "../controllers/missionController.js";

const router = Router();
router.use(requireAuth);
router.get("/today", getDailyMissionsController);
router.get("/", getDailyMissionsController);
router.post("/generate", generateDailyMissionsController);
router.patch("/:id/status", validate(updateMissionStatusSchema), updateMissionController);
export default router;
