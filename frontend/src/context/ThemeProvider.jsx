import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./theme.js";
import { applyDocumentTheme, normalizeTheme, readBrowserTheme, THEME_STORAGE_KEY } from "../utils/theme.js";

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readBrowserTheme);

  useEffect(() => {
    applyDocumentTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The theme still applies for this page when browser storage is blocked.
    }
  }, [theme]);

  useEffect(() => {
    const syncTheme = event => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const storedTheme = normalizeTheme(event.newValue);
      if (storedTheme) setTheme(storedTheme);
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  const toggleTheme = useCallback(() => setTheme(current => current === "dark" ? "light" : "dark"), []);
  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
