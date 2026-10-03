import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import { ApiError } from "../middleware/errorHandler.js";
import crypto from "node:crypto";
import { createUser, findUserByEmail, findUserById, updateUserPassword } from "../models/userModel.js";
import { createProfileForUser, getProfileByUserId } from "../models/profileModel.js";
import { signAccessToken } from "../utils/jwt.js";
import { deletePasswordResetsForUser, getActivePasswordResetByEmail, recordFailedPasswordResetAttempt, replacePasswordReset, consumePasswordReset } from "../models/passwordResetModel.js";
import { sendPasswordResetOtp } from "./mailService.js";

import { isOwnerAdmin } from '../middleware/ownerAdmin.js';
const SALT_ROUNDS = 12;
const dummyPasswordHash = bcrypt.hash("not-an-account-password", SALT_ROUNDS);
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// Includes onboardingCompleted so the frontend's routing guards
// (OnboardingRoute / RequireOnboarding) can decide where to send the
// user right after signup/login without an extra round trip.
async function toPublicUser(user) {
  const profile = await getProfileByUserId(user.id);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isOwnerAdmin: isOwnerAdmin(user),
    onboardingCompleted: Boolean(profile?.onboarding_completed),
  };
}

export async function signup({ name, email, password }) {
  email = email.trim().toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const client = await pool.connect();
  let user;
  try {
    await client.query("BEGIN");
    user = await createUser({ name, email, passwordHash }, client);
    await createProfileForUser(user.id, client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const token = signAccessToken({ id: user.id, email: user.email });
  return { token, user: await toPublicUser(user) };
}

export async function login({ email, password }) {
  email = email.trim().toLowerCase();
  const user = await findUserByEmail(email);
  const passwordMatches = await bcrypt.compare(password, user?.password_hash || await dummyPasswordHash);
  if (!user || !passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = signAccessToken({ id: user.id, email: user.email });
  return { token, user: await toPublicUser(user) };
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(401, "Authentication required. Please log in.");
  }
  return toPublicUser(user);
}

export async function requestPasswordReset({ email }) {
  email = email.trim().toLowerCase();
  const user = await findUserByEmail(email);
  // Do not reveal whether an email address is registered.
  if (!user) return;

  const otp = String(crypto.randomInt(100000, 1000000));
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
  await replacePasswordReset({ userId: user.id, otpHash, expiresAt: new Date(Date.now() + OTP_EXPIRY_MS) });

  try {
    await sendPasswordResetOtp({ to: user.email, otp });
  } catch {
    await deletePasswordResetsForUser(user.id);
    // Keep the same public response for registered and unknown addresses.
    console.error("[mail] Password reset delivery failed. Check the SMTP configuration.");
  }
}

export async function resetPassword({ email, otp, password }) {
  email = email.trim().toLowerCase();
  const reset = await getActivePasswordResetByEmail(email);
  if (!reset || reset.attempts >= MAX_OTP_ATTEMPTS) {
    throw new ApiError(400, "That code is invalid or has expired. Request a new code and try again.");
  }

  const isValid = await bcrypt.compare(otp, reset.otp_hash);
  if (!isValid) {
    await recordFailedPasswordResetAttempt(reset.id);
    throw new ApiError(400, "That code is invalid or has expired. Request a new code and try again.");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const consumed = await consumePasswordReset(reset.id, client);
    if (!consumed) throw new ApiError(400, "That code is invalid or has expired. Request a new code and try again.");
    await updateUserPassword(consumed.user_id, passwordHash, client);
    await deletePasswordResetsForUser(consumed.user_id, client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default { signup, login, getCurrentUser, requestPasswordReset, resetPassword };
