import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/theme.js";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const Icon = nextTheme === "light" ? Sun : Moon;

  return <button
    type="button"
    className="sf-theme-toggle"
    onClick={toggleTheme}
    aria-label={`Switch to ${nextTheme} theme`}
    title={`Switch to ${nextTheme} theme`}
  >
    <Icon size={18} aria-hidden="true" />
    <span>{nextTheme === "light" ? "Light" : "Dark"}</span>
  </button>;
}
