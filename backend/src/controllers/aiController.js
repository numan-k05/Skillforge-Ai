import { asyncHandler } from "../utils/asyncHandler.js";
import { getAIStatus } from "../services/aiService.js";

export const getAIStatusController = asyncHandler(async (req, res) => {
  res.status(200).json({ ai: getAIStatus() });
});

export default { getAIStatusController };
