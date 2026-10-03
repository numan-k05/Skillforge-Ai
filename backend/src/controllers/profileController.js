import { asyncHandler } from "../utils/asyncHandler.js";
import * as profileService from "../services/profileService.js";

export const getProfileController = asyncHandler(async (req, res) => {
  const profile = await profileService.getFullProfile(req.user.id);
  res.status(200).json({ profile });
});

export const updateProfileController = asyncHandler(async (req, res) => {
  const profile = await profileService.updateFullProfile(req.user.id, req.validated);
  res.status(200).json({ profile });
});

export default { getProfileController, updateProfileController };
