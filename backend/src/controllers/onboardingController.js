import { asyncHandler } from "../utils/asyncHandler.js";
import * as onboardingService from "../services/onboardingService.js";

export const getOnboardingStatusController = asyncHandler(async (req, res) => {
  const status = await onboardingService.getOnboardingStatus(req.user.id);
  res.status(200).json(status);
});

export const getOnboardingCatalogController = asyncHandler(async (req, res) => {
  const catalog = await onboardingService.getOnboardingCatalog();
  res.status(200).json(catalog);
});

export const completeOnboardingController = asyncHandler(async (req, res) => {
  const profile = await onboardingService.completeOnboarding(req.user.id, req.validated);
  res.status(200).json({ profile });
});

export default {
  getOnboardingStatusController,
  getOnboardingCatalogController,
  completeOnboardingController,
};
