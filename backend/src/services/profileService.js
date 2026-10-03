import { ApiError } from "../middleware/errorHandler.js";
import { findUserById, updateUserName } from "../models/userModel.js";
import {
  getProfileByUserId,
  updateProfileFields,
  createProfileForUser,
} from "../models/profileModel.js";
import { createCareerGoal, findCareerGoalByTitle } from "../models/careerGoalModel.js";
import { getUserInterestNames, replaceUserInterests } from "../models/interestModel.js";

const MAX_INTERESTS = 10;

function toPublicProfile(user, profile, interests = []) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    university: profile?.university ?? null,
    degree: profile?.degree ?? null,
    semester: profile?.semester ?? null,
    country: profile?.country ?? null,
    careerGoal: profile?.career_goal_title ?? null,
    weeklyHoursAvailable: profile?.weekly_hours_available ?? null,
    learningGoals: profile?.learning_goals ?? null,
    interests,
    onboardingCompleted: Boolean(profile?.onboarding_completed),
    onboardingCompletedAt: profile?.onboarding_completed_at ?? null,
    createdAt: user.created_at,
  };
}

function cleanInterestNames(interests) {
  return [...new Set(interests.map((i) => i.trim()).filter(Boolean))].slice(0, MAX_INTERESTS);
}

export async function getFullProfile(userId) {
  const user = await findUserById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  let profile = await getProfileByUserId(userId);
  if (!profile) {
    // Defensive fallback — every user should get a profile row at signup.
    await createProfileForUser(userId);
    profile = await getProfileByUserId(userId);
  }

  const interests = await getUserInterestNames(userId);
  return toPublicProfile(user, profile, interests);
}

export async function updateFullProfile(
  userId,
  { name, university, degree, semester, country, careerGoal, weeklyHoursAvailable, learningGoals, interests }
) {
  const user = await findUserById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  if (name !== undefined) {
    await updateUserName(userId, name);
  }

  let careerGoalId;
  if (careerGoal === null) {
    careerGoalId = null;
  } else if (careerGoal !== undefined) {
    const existingGoal = await findCareerGoalByTitle(userId, careerGoal);
    const goal = existingGoal || (await createCareerGoal(userId, careerGoal));
    careerGoalId = goal.id;
  }

  await updateProfileFields(userId, {
    university,
    degree,
    semester,
    careerGoalId,
    country,
    weeklyHoursAvailable,
    learningGoals,
  });

  if (interests !== undefined) {
    await replaceUserInterests(userId, cleanInterestNames(interests));
  }

  return getFullProfile(userId);
}

export default { getFullProfile, updateFullProfile };
