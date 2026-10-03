export const THEME_STORAGE_KEY = "skillforge_theme";
export const THEMES = Object.freeze(["light", "dark"]);

export function normalizeTheme(value) {
  return THEMES.includes(value) ? value : null;
}

export function resolveTheme(storedTheme, prefersDark = true) {
  return normalizeTheme(storedTheme) || (prefersDark ? "dark" : "light");
}

export function readBrowserTheme() {
  let storedTheme = null;
  try {
    storedTheme = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in a privacy-restricted browser context.
  }
  const prefersDark = globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  return resolveTheme(storedTheme, prefersDark);
}

export function applyDocumentTheme(theme, documentObject = globalThis.document) {
  const resolved = resolveTheme(theme);
  if (!documentObject?.documentElement) return resolved;
  documentObject.documentElement.dataset.theme = resolved;
  documentObject.documentElement.style.colorScheme = resolved;
  const themeColor = documentObject.querySelector('meta[name="theme-color"]');
  themeColor?.setAttribute("content", resolved === "light" ? "#F5F7FB" : "#07111F");
  return resolved;
}
