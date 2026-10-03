import { apiRequest } from "./apiClient.js";

export async function getProfile() {
  const data = await apiRequest("/profile", { auth: true });
  return data.profile;
}

export async function updateProfile(fields) {
  const data = await apiRequest("/profile", {
    method: "PUT",
    auth: true,
    body: fields,
  });
  return data.profile;
}

export default { getProfile, updateProfile };
