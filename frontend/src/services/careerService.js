import { apiRequest } from "./apiClient.js";

// Phase 5A backend endpoints — universal, database-driven career catalog.
// These are public reference data (no auth required by the backend), so
// requests here don't set `auth: true`. Only the profile update used to
// record a chosen career goal (see profileService.js) needs auth.

/**
 * All career categories, in backend display order.
 * Shape: [{ categoryId, name, slug, description, displayOrder }]
 */
export async function getCareerCategories() {
  const data = await apiRequest("/career-categories");
  return data.categories || [];
}

/**
 * The full career catalog, optionally filtered by category on the server.
 * Shape: [{ careerId, title, slug, shortDescription, isActive, category }]
 */
export async function getCareers({ categoryId } = {}) {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
  const data = await apiRequest(`/careers${query}`);
  return data.careers || [];
}

/** One career by id. Shape: { careerId, title, slug, shortDescription, isActive, category } */
export async function getCareer(careerId) {
  const data = await apiRequest(`/careers/${careerId}`);
  return data.career;
}

/**
 * A career's full skill breakdown.
 * Shape: { career, required: [...], recommended: [...], optional: [...] }
 * Each skill entry: { skillId, name, description, category, kind, difficulty,
 *   requirement: { skillType, minLevel, targetLevel, importance, priority } }
 */
export async function getCareerSkills(careerId) {
  return apiRequest(`/careers/${careerId}/skills`);
}

export default { getCareerCategories, getCareers, getCareer, getCareerSkills };
