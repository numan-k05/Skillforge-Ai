import { apiRequest } from "./apiClient.js";

export const getCareerReadinessOverview = () => apiRequest("/career-readiness/overview", { auth: true });
export const getCareerReadinessHistory = (limit = 24) => apiRequest(`/career-readiness/history?limit=${encodeURIComponent(limit)}`, { auth: true });
export default { getCareerReadinessOverview, getCareerReadinessHistory };
