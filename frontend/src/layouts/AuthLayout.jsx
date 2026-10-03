import { Link, Outlet } from "react-router-dom";
import { GitBranch } from "lucide-react";
import "./AuthLayout.css";

export default function AuthLayout() {
  return (
    <div className="sf-auth">
      <div className="sf-auth__panel">
        <Link to="/" className="sf-auth__brand">
          <span className="sf-auth__mark" aria-hidden="true">
            <GitBranch size={16} strokeWidth={2.4} />
          </span>
          SkillForge <span className="sf-auth__brand-accent">AI</span>
        </Link>
        <main id="main-content" tabIndex="-1"><Outlet /></main>
      </div>
    </div>
  );
}
