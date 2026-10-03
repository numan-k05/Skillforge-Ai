import { asyncHandler } from "../utils/asyncHandler.js";
import * as accountService from "../services/accountService.js";

export const getAccountPrivacy = asyncHandler(async (req, res) => res.json(await accountService.getPrivacyAccount(req.user.id)));
export const updateAccountPreferences = asyncHandler(async (req, res) => res.json({ preferences: await accountService.updatePreferences(req.user.id, req.validated) }));
export const createConsent = asyncHandler(async (req, res) => res.status(201).json({ consent: await accountService.recordConsent(req.user.id, req.validated) }));
export const exportAccount = asyncHandler(async (req, res) => {
  const data = await accountService.exportAccount(req.user.id);
  res.setHeader("Content-Disposition", `attachment; filename="skillforge-export-${req.user.id}.json"`);
  res.json(data);
});
export const deleteAccount = asyncHandler(async (req, res) => {
  await accountService.deleteAccount(req.user.id, req.user.email, req.validated.password);
  res.status(204).end();
});
