import { Router } from "express";
import { listCareerCategoriesController } from "../controllers/careerCategoryController.js";

const router = Router();

// Public reference data.
// GET /api/career-categories
router.get("/", listCareerCategoriesController);

export default router;
