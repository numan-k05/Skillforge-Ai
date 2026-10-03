import { apiRequest } from "./apiClient.js";

export async function getOnboardingStatus() {
  const data = await apiRequest("/onboarding/status", { auth: true });
  return Boolean(data.onboardingCompleted);
}

export async function getOnboardingCatalog() {
  const data = await apiRequest("/onboarding/catalog", { auth: true });
  return data.interests || [];
}

export async function completeOnboarding(payload) {
  const data = await apiRequest("/onboarding/complete", {
    method: "POST",
    auth: true,
    body: payload,
  });
  return data.profile;
}

export default { getOnboardingStatus, getOnboardingCatalog, completeOnboarding };
