import { asyncHandler } from "../utils/asyncHandler.js";
import * as dashboardService from "../services/dashboardService.js";

export const getDashboardOverviewController = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getDashboardOverview(req.user.id);
  res.status(200).json(overview);
});

export default { getDashboardOverviewController };
