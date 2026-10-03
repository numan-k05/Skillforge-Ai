import { apiRequest } from "./apiClient.js";

export async function getDailyMissions(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiRequest(`/missions/today${query}`, { auth: true });
}

export async function generateDailyMissions(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiRequest(`/missions/generate${query}`, { method: "POST", auth: true });
}

export async function updateMissionStatus(missionId, status) {
  return apiRequest(`/missions/${missionId}/status`, {
    method: "PATCH", auth: true, body: { status },
  });
}

export default { getDailyMissions, generateDailyMissions, updateMissionStatus };
