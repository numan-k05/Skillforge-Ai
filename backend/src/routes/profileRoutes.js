import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../utils/validation.js";
import {
  getProfileController,
  updateProfileController,
} from "../controllers/profileController.js";

const router = Router();

router.get("/", requireAuth, getProfileController);
router.put("/", requireAuth, validate(updateProfileSchema), updateProfileController);

export default router;
