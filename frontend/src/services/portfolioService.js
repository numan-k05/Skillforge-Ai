import { apiRequest } from "./apiClient.js";

export async function getMyPortfolio() {
  const data = await apiRequest("/portfolios/me", { auth: true });
  return data.portfolio;
}

export async function updateMyPortfolio(fields) {
  const data = await apiRequest("/portfolios/me", { method: "PUT", auth: true, body: fields });
  return data.portfolio;
}

export async function updateMyPortfolioContent(fields) {
  const data = await apiRequest("/portfolios/me/content", { method: "PUT", auth: true, body: fields });
  return data.portfolio;
}
export async function updateMyEvidenceEntries(entries){const data=await apiRequest("/portfolios/me/evidence",{method:"PUT",auth:true,body:{entries}});return data.portfolio;}

export async function getPublicPortfolio(slug) {
  const data = await apiRequest(`/portfolios/public/${encodeURIComponent(slug)}`);
  return data.portfolio;
}

export default { getMyPortfolio, updateMyPortfolio, updateMyPortfolioContent, updateMyEvidenceEntries, getPublicPortfolio };
