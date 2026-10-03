import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { generateRoadmapSchema, updateRoadmapStatusSchema } from "../utils/validation.js";
import {
  generateRoadmapController,
  getActiveRoadmapController,
  getRoadmapController,
  regenerateRoadmapController,
  updateRoadmapStatusController,
  deleteRoadmapController,
} from "../controllers/roadmapController.js";

const router = Router();

// Every route is authenticated and every lookup/update/delete in the
// service+model layer is scoped by req.user.id (from the verified JWT)
// — there is no way to pass another user's id in, so a user can never
// read, modify, or delete someone else's roadmap.
//
// POST /generate: creates a new active roadmap version from the user's
// CURRENT career/skills/profile. If the user already has an active
// roadmap, it is archived (not deleted) in the same transaction before
// the new one is saved — see roadmapModel.saveGeneratedRoadmap.
router.post("/generate", requireAuth, validate(generateRoadmapSchema), generateRoadmapController);
router.get("/", requireAuth, getActiveRoadmapController);
router.get("/:id", requireAuth, getRoadmapController);
router.post("/:id/regenerate", requireAuth, validate(generateRoadmapSchema), regenerateRoadmapController);
router.patch("/:id/status", requireAuth, validate(updateRoadmapStatusSchema), updateRoadmapStatusController);
router.delete("/:id", requireAuth, deleteRoadmapController);

export default router;
