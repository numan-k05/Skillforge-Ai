import { apiRequest, setToken } from "./apiClient.js";

export async function signup({ name, email, password, confirmPassword }) {
  const data = await apiRequest("/auth/signup", {
    method: "POST",
    body: { name, email, password, confirmPassword },
  });
  setToken(data.token);
  return data.user;
}

export async function login({ email, password }) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  setToken(data.token);
  return data.user;
}

export async function requestPasswordReset(email) {
  return apiRequest("/auth/forgot-password", { method: "POST", body: { email } });
}

export async function resetPassword({ email, otp, password, confirmPassword }) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: { email, otp, password, confirmPassword },
  });
}

export async function logout() {
  try {
    await apiRequest("/auth/logout", { method: "POST", auth: true });
  } catch {
    // Stateless logout must still finish locally when the server is unavailable.
  } finally {
    setToken(null);
  }
}

export async function fetchCurrentUser() {
  const data = await apiRequest("/auth/me", { auth: true });
  return data.user;
}

export default { signup, login, requestPasswordReset, resetPassword, logout, fetchCurrentUser };
