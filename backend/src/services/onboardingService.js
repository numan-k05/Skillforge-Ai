import { pool } from "../config/db.js";
import { ApiError } from "../middleware/errorHandler.js";
import { findUserById } from "../models/userModel.js";
import { getProfileByUserId } from "../models/profileModel.js";
import { getOrCreateCareerGoalIdTx } from "../models/careerGoalModel.js";
import { listInterests, replaceUserInterestsTx } from "../models/interestModel.js";
import { getFullProfile } from "./profileService.js";

const MAX_INTERESTS = 10;

function cleanInterestNames(interests = []) {
  return [...new Set(interests.map((i) => i.trim()).filter(Boolean))].slice(0, MAX_INTERESTS);
}

export async function getOnboardingStatus(userId) {
  const profile = await getProfileByUserId(userId);
  return { onboardingCompleted: Boolean(profile?.onboarding_completed) };
}

export async function getOnboardingCatalog() {
  const interests = await listInterests();
  return { interests };
}

/**
 * Completes onboarding for a user in a single atomic transaction:
 *  - upserts the profile's academic/career fields
 *  - get-or-creates the career goal (if provided)
 *  - replaces the user's interests (get-or-creating any custom ones)
 *  - flips onboarding_completed to true with a timestamp
 * Any failure rolls the whole thing back, so a user is never left with a
 * half-completed onboarding state.
 */
export async function completeOnboarding(userId, payload) {
  const user = await findUserById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  const {
    university,
    degree,
    semester,
    country,
    careerGoal,
    interests = [],
    weeklyHoursAvailable,
    learningGoals,
  } = payload;

  const cleanedInterests = cleanInterestNames(interests);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Every user gets a profile row at signup, but guard against it
    // missing (e.g. a user created before Phase 2's signup flow existed).
    await client.query(`INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [
      userId,
    ]);

    let careerGoalId = null;
    if (careerGoal) {
      careerGoalId = await getOrCreateCareerGoalIdTx(client, userId, careerGoal);
    }

    await client.query(
      `UPDATE profiles
       SET university             = COALESCE($2, university),
           degree                 = COALESCE($3, degree),
           semester               = COALESCE($4, semester),
           country                = COALESCE($5, country),
           career_goal_id         = COALESCE($6, career_goal_id),
           weekly_hours_available = COALESCE($7, weekly_hours_available),
           learning_goals         = COALESCE($8, learning_goals),
           onboarding_completed   = true,
           onboarding_completed_at = now()
       WHERE user_id = $1`,
      [
        userId,
        university ?? null,
        degree ?? null,
        semester ?? null,
        country ?? null,
        careerGoalId,
        weeklyHoursAvailable ?? null,
        learningGoals ?? null,
      ]
    );

    await replaceUserInterestsTx(client, userId, cleanedInterests);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return getFullProfile(userId);
}

export default { getOnboardingStatus, getOnboardingCatalog, completeOnboarding };
