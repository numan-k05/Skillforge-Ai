import { apiRequest } from "./apiClient.js";

function query(filters = {}) {
  const params = new URLSearchParams();
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.free !== undefined) params.set("free", String(filters.free));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function getRecommendedResources(filters) {
  return apiRequest(`/learning-resources/recommended${query(filters)}`, { auth: true });
}

export function getResourcesForRoadmapItem(roadmapItemId, filters) {
  return apiRequest(`/learning-resources/roadmap-items/${encodeURIComponent(roadmapItemId)}${query(filters)}`, { auth: true });
}

export function getResourcesForSkill(skillId, filters) {
  return apiRequest(`/learning-resources/skills/${encodeURIComponent(skillId)}${query(filters)}`, { auth: true });
}

export default { getRecommendedResources, getResourcesForRoadmapItem, getResourcesForSkill };
