// Thin fetch wrapper shared by every service module. Centralizes the
// API base URL, auth token handling, and error shape.

export function resolveApiBaseUrl(configured, { production = false } = {}) {
  const value = configured?.trim();
  if (!value) return production ? "/api" : "http://localhost:4000/api";

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("VITE_API_BASE_URL must be a valid absolute URL.");
  }
  if (production && url.protocol !== "https:") {
    throw new Error("VITE_API_BASE_URL must use HTTPS in production.");
  }
  return value.replace(/\/$/, "");
}

const API_BASE_URL = resolveApiBaseUrl(import.meta.env?.VITE_API_BASE_URL, { production: Boolean(import.meta.env?.PROD) });
export const apiUrl = (path) => `${API_BASE_URL}${path}`;
const TOKEN_KEY = "skillforge_token";

export function getToken() {
  // Authentication is intentionally scoped to the current browser tab.
  // Remove tokens written by older builds so they cannot restore a session
  // after the browser has been closed and reopened.
  localStorage.removeItem(TOKEN_KEY);
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.removeItem(TOKEN_KEY);
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * @param {string} path e.g. "/auth/login"
 * @param {{method?: string, body?: object, auth?: boolean}} options
 */
export async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  const requestToken = auth ? getToken() : null;

  if (requestToken) headers.Authorization = `Bearer ${requestToken}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (auth && response.status === 401 && requestToken === getToken()) {
      setToken(null);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("skillforge:unauthorized"));
    }
    const message = data?.error?.message || "Something went wrong. Please try again.";
    throw new ApiError(response.status, message, data?.error?.details);
  }

  if (data === null && response.status !== 204) {
    throw new ApiError(response.status, "The server returned an invalid response. Please try again.");
  }
  return data;
}

export default apiRequest;
