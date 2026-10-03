import { apiRequest } from "./apiClient.js";

// Phase 8B keeps the progress API behind the same small service boundary as
// the other SkillForge features. Every endpoint is authenticated by apiRequest.
export const getOverview = () => apiRequest("/progress/overview", { auth: true });
export const getHistory = (limit = 50) => apiRequest(`/progress/history?limit=${encodeURIComponent(limit)}`, { auth: true });
export const getRoadmapProgress = () => apiRequest("/progress/roadmap", { auth: true });
export const getProjectProgress = () => apiRequest("/progress/projects", { auth: true });
export const getMissionProgress = () => apiRequest("/progress/missions", { auth: true });
export const getChallengeProgress = () => apiRequest("/progress/challenges", { auth: true });
export const getSkillProgress = () => apiRequest("/progress/skills", { auth: true });

export default {
  getOverview,
  getHistory,
  getRoadmapProgress,
  getProjectProgress,
  getMissionProgress,
  getChallengeProgress,
  getSkillProgress,
};
