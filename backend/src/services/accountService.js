import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { ApiError } from "../middleware/errorHandler.js";
import { findUserByEmail } from "../models/userModel.js";
import * as accountModel from "../models/accountModel.js";

const mapPreferences = (row) => ({
  productUpdates: row.product_updates,
  learningReminders: row.learning_reminders,
  publicProfileVisible: row.public_profile_visible,
  updatedAt: row.updated_at,
});

export async function getPrivacyAccount(userId) {
  const [preferences, consents] = await Promise.all([
    accountModel.getPreferences(userId), accountModel.getConsentHistory(userId),
  ]);
  return { preferences: mapPreferences(preferences), consents };
}

export async function updatePreferences(userId, values) {
  const preferences = await accountModel.updatePreferences(userId, values);
  if (values.productUpdates !== undefined) {
    await accountModel.recordConsent(userId, { type: "marketing", documentVersion: "marketing-preference-v1", granted: values.productUpdates });
  }
  return mapPreferences(preferences);
}

export async function recordConsent(userId, value) {
  return accountModel.recordConsent(userId, value);
}

export async function exportAccount(userId) {
  const data = await accountModel.getExportData(userId);
  if (!data) throw new ApiError(404, "Account not found.");
  return { exportedAt: new Date().toISOString(), formatVersion: "1", ...data };
}

export async function deleteAccount(userId, email, password) {
  const user = await findUserByEmail(email.toLowerCase());
  const matches = user && String(user.id) === String(userId) && await bcrypt.compare(password, user.password_hash);
  if (!matches) throw new ApiError(401, "Your password is incorrect.");
  const replacementHash = await bcrypt.hash(`${crypto.randomUUID()}-${crypto.randomUUID()}`, 12);
  const result = await accountModel.deleteAccount(userId, replacementHash);
  if (!result) throw new ApiError(404, "Account not found.");
  if (result.blocked === "last_admin") throw new ApiError(409, "Assign another administrator before deleting this account.");
  if (result.blocked === "withdrawal") throw new ApiError(409, "Resolve pending withdrawals before deleting this account.");
}

export default { getPrivacyAccount, updatePreferences, recordConsent, exportAccount, deleteAccount };
