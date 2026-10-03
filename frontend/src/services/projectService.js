import { apiRequest } from "./apiClient.js";

export async function getProjects({ careerId, skillId, difficulty } = {}) {
  const params = new URLSearchParams();
  if (careerId) params.set("careerId", careerId);
  if (skillId) params.set("skillId", skillId);
  if (difficulty) params.set("difficulty", difficulty);
  const query = params.toString();
  const data = await apiRequest(`/projects${query ? `?${query}` : ""}`, { auth: true });
  return data.projects || [];
}

export async function getProject(projectId) {
  const data = await apiRequest(`/projects/${projectId}`, { auth: true });
  return data.project;
}

export async function getRecommendedProjects(limit = 6) {
  const data = await apiRequest(`/projects/recommended?limit=${encodeURIComponent(limit)}`, { auth: true });
  return data;
}

export async function getMyProjects() {
  const data = await apiRequest("/projects/mine", { auth: true });
  return data.projects || [];
}

export async function startProject(projectId) {
  const data = await apiRequest(`/projects/${projectId}/start`, { method: "POST", auth: true });
  return data;
}

export async function updateProjectStatus(projectId, status) {
  const data = await apiRequest(`/projects/${projectId}/status`, {
    method: "PATCH",
    auth: true,
    body: { status },
  });
  return data;
}

export default { getProjects, getProject, getRecommendedProjects, getMyProjects, startProject, updateProjectStatus };
