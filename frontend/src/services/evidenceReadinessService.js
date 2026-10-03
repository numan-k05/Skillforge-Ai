import { apiRequest } from "./apiClient.js";
export const getEvidenceReadiness=()=>apiRequest("/evidence-readiness/overview",{auth:true});
export const getEvidenceReadinessHistory=(limit=24)=>apiRequest(`/evidence-readiness/history?limit=${encodeURIComponent(limit)}`,{auth:true});
export default{getEvidenceReadiness,getEvidenceReadinessHistory};
