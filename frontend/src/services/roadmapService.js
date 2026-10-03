import { apiRequest } from "./apiClient.js";

/**
 * Phase 6B-1 — frontend access layer for the existing Phase 6A roadmap API.
 * This module only calls endpoints that already exist on the backend.
 */
export async function getRoadmap() {
  return apiRequest("/roadmap", { auth: true });
}

export async function getRoadmapById(roadmapId) {
  return apiRequest(`/roadmap/${encodeURIComponent(roadmapId)}`, { auth: true });
}

export async function generateRoadmap({ timelineWeeks } = {}) {
  const body = timelineWeeks != null ? { timelineWeeks: Number(timelineWeeks) } : {};
  return apiRequest("/roadmap/generate", {
    method: "POST",
    body,
    auth: true,
  });
}

export async function regenerateRoadmap(roadmapId, { timelineWeeks } = {}) {
  const body = timelineWeeks != null ? { timelineWeeks: Number(timelineWeeks) } : {};
  return apiRequest(`/roadmap/${encodeURIComponent(roadmapId)}/regenerate`, {
    method: "POST",
    body,
    auth: true,
  });
}

export async function updateRoadmapStatus(roadmapId, status) {
  return apiRequest(`/roadmap/${encodeURIComponent(roadmapId)}/status`, {
    method: "PATCH",
    body: { status },
    auth: true,
  });
}

export async function deleteRoadmap(roadmapId) {
  return apiRequest(`/roadmap/${encodeURIComponent(roadmapId)}`, {
    method: "DELETE",
    auth: true,
  });
}

export default {
  getRoadmap,
  getRoadmapById,
  generateRoadmap,
  regenerateRoadmap,
  updateRoadmapStatus,
  deleteRoadmap,
};
