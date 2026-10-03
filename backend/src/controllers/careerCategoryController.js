import { asyncHandler } from "../utils/asyncHandler.js";
import { getCareerCategories } from "../services/careerCategoryService.js";

export const listCareerCategoriesController = asyncHandler(async (req, res) => {
  const categories = await getCareerCategories();
  res.status(200).json({ categories });
});

export default { listCareerCategoriesController };
