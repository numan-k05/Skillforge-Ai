import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { onboardingCompleteSchema } from "../utils/validation.js";
import {
  getOnboardingStatusController,
  getOnboardingCatalogController,
  completeOnboardingController,
} from "../controllers/onboardingController.js";

const router = Router();

router.get("/status", requireAuth, getOnboardingStatusController);
router.get("/catalog", requireAuth, getOnboardingCatalogController);
router.post("/complete", requireAuth, validate(onboardingCompleteSchema), completeOnboardingController);

export default router;
