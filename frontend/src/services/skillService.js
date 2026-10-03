import { apiRequest } from "./apiClient.js";

export async function getSkills() {
  const data = await apiRequest("/skills");
  return data.skills || [];
}

export async function getSkill(id) {
  const data = await apiRequest(`/skills/${encodeURIComponent(id)}`);
  return data.skill;
}

export async function getMySkills() {
  const data = await apiRequest("/skills/me", { auth: true });
  return data.skills || [];
}

export default { getMySkills };
