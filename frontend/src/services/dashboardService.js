import { apiRequest } from "./apiClient.js";

export async function getDashboardOverview() {
  return apiRequest("/dashboard/overview", { auth: true });
}

export default { getDashboardOverview };
