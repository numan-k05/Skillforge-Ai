import { afterEach, beforeEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import { apiRequest, getToken, setToken, ApiError, resolveApiBaseUrl } from "../src/services/apiClient.js";
import { login, logout } from "../src/services/authService.js";
import { getCourse } from "../src/services/courseService.js";

beforeEach(() => {
  const storage = () => {
    const values = new Map();
    return {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    };
  };
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
});
afterEach(() => { mock.restoreAll(); delete globalThis.localStorage; delete globalThis.sessionStorage; });

test("API base URL validation prevents unsafe production configuration", () => {
  assert.equal(resolveApiBaseUrl(undefined), "http://localhost:4000/api");
  assert.equal(resolveApiBaseUrl(undefined, { production: true }), "/api");
  assert.equal(resolveApiBaseUrl(" https://api.example.com/api/ ", { production: true }), "https://api.example.com/api");
  assert.throws(() => resolveApiBaseUrl("not a URL"), /valid absolute URL/);
  assert.throws(() => resolveApiBaseUrl("http://api.example.com/api", { production: true }), /HTTPS/);
});

test("login stores a tab-scoped token and protected calls attach it; public calls omit it", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ token: "test-token", user: { id: "1" } })));
  assert.deepEqual(await login({ email: "a@example.com", password: "password" }), { id: "1" });
  assert.equal(getToken(), "test-token");
  await apiRequest("/profile", { auth: true });
  assert.equal(fetchMock.mock.calls[1].arguments[1].headers.Authorization, "Bearer test-token");
  await apiRequest("/careers");
  assert.equal(fetchMock.mock.calls[2].arguments[1].headers.Authorization, undefined);
});

test("persistent tokens from older builds are removed and cannot restore a session", () => {
  localStorage.setItem("skillforge_token", "legacy-persistent-token");
  assert.equal(getToken(), null);
  assert.equal(localStorage.getItem("skillforge_token"), null);
});

test("API errors preserve status and field details", async () => {
  const details = [{ field: "email", message: "Invalid email" }];
  mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ error: { message: "Validation failed", details } }), { status: 400 }));
  await assert.rejects(apiRequest("/auth/signup"), (error) => error instanceof ApiError && error.status === 400 && error.details[0].field === "email");
});

test("network failures, non-JSON errors, and invalid success bodies produce useful errors", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(apiRequest("/health"), (error) => error.status === 0 && /reach the server/.test(error.message));
  fetchMock.mock.mockImplementation(async () => new Response("Gateway failure", { status: 502 }));
  await assert.rejects(apiRequest("/health"), (error) => error.status === 502);
  fetchMock.mock.mockImplementation(async () => new Response("Not JSON"));
  await assert.rejects(apiRequest("/health"), /invalid response/);
  fetchMock.mock.mockImplementation(async () => new Response(null, { status: 204 }));
  assert.equal(await apiRequest("/health"), null);
});

test("logout clears local authentication even when the backend is unavailable", async () => {
  setToken("test-token");
  mock.method(globalThis, "fetch", async () => { throw new TypeError("offline"); });
  await logout();
  assert.equal(getToken(), null);
});

test("protected 401 clears only the token used by the rejected request", async () => {
  setToken("expired-token");
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response("{}", { status: 401 }));
  await assert.rejects(apiRequest("/profile", { auth: true }));
  assert.equal(getToken(), null);
  setToken("old-token");
  fetchMock.mock.mockImplementation(async () => {
    setToken("new-session-token");
    return new Response("{}", { status: 401 });
  });
  await assert.rejects(apiRequest("/profile", { auth: true }));
  assert.equal(getToken(), "new-session-token");
});

test("public course detail retries without a stale session token", async () => {
  setToken("expired-token");
  const course = { id: "6", title: "React Skill Pass", modules: [] };
  const fetchMock = mock.method(globalThis, "fetch", async (_url, options) => options.headers.Authorization
    ? new Response(JSON.stringify({ error: { message: "Session expired" } }), { status: 401 })
    : new Response(JSON.stringify({ course })));
  assert.deepEqual(await getCourse("6"), { course });
  assert.equal(fetchMock.mock.callCount(), 2);
  assert.equal(fetchMock.mock.calls[0].arguments[1].headers.Authorization, "Bearer expired-token");
  assert.equal(fetchMock.mock.calls[1].arguments[1].headers.Authorization, undefined);
  assert.equal(getToken(), null);
});
