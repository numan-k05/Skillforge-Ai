import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validate, validateParams } from "../middleware/validate.js";
import { portfolioContentSchema, portfolioEvidenceSchema, portfolioProfileSchema, portfolioSlugParamSchema } from "../utils/validation.js";
import {
  getMyPortfolioController, updateMyPortfolioController,
  replaceMyPortfolioContentController, getPublicPortfolioController,
  updateMyEvidenceEntriesController,
} from "../controllers/portfolioController.js";

const router = Router();

// Public route is deliberately registered before authenticated management
// endpoints and does not use requireAuth.
router.get("/public/:slug", validateParams(portfolioSlugParamSchema), getPublicPortfolioController);
router.get("/me", requireAuth, getMyPortfolioController);
router.put("/me", requireAuth, validate(portfolioProfileSchema), updateMyPortfolioController);
router.put("/me/content", requireAuth, validate(portfolioContentSchema), replaceMyPortfolioContentController);
router.put("/me/evidence", requireAuth, validate(portfolioEvidenceSchema), updateMyEvidenceEntriesController);

export default router;
