import { asyncHandler } from "../utils/asyncHandler.js";
import { getCareerSkillMap } from "../services/careerSkillService.js";

export const getCareerSkillsController = asyncHandler(async (req, res) => {
  const result = await getCareerSkillMap(req.query.career);
  res.status(200).json(result);
});

export default { getCareerSkillsController };
