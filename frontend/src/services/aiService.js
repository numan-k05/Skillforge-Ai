import { apiRequest } from "./apiClient.js";

export async function getAIStatus() {
  return apiRequest("/ai/status", { auth: true });
}

export default { getAIStatus };
