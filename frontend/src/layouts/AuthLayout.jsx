import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, GitBranch, ArrowUpRight } from "lucide-react";
import ThemeToggle from "../components/ui/ThemeToggle.jsx";
import "./AuthLayout.css";

export default function AuthLayout() {
  const { pathname } = useLocation();
  const signup = pathname === "/signup";
  return (
    <div className="sf-auth">
      <header className="sf-auth__topbar">
        <Link to="/" className="sf-auth__brand">
          <span className="sf-auth__mark" aria-hidden="true">
            <GitBranch size={16} strokeWidth={2.4} />
          </span>
          SkillForge <span className="sf-auth__brand-accent">AI</span>
        </Link>
        <div className="sf-auth__navigation"><Link to="/" className="sf-auth__home" aria-label="Back to home"><ArrowLeft size={16} aria-hidden="true" /><span>Back to home</span></Link><ThemeToggle /></div>
      </header>
      <div className="sf-auth__body">
        <aside className="sf-auth__story" aria-label="Your learning journey">
          <img src={`/images/${signup ? "skills" : "careers"}-cover.png`} alt="" width="1536" height="1024" />
          <div className="sf-auth__story-top"><span className="sf-auth__story-dot" /> A LITTLE PROGRESS, EVERY DAY</div>
          <div className="sf-auth__story-copy">
            <span className="sf-auth__story-icon" aria-hidden="true"><ArrowUpRight size={26} /></span>
            <h2>{signup ? "Big possibilities.\nSmall first steps." : "Your next chapter\nstarts with you."}</h2>
            <p>{signup ? "Discover your strengths. Build practical skills. Find a direction that feels like you." : "Pick up where you left off and keep moving toward the career you want."}</p>
            <div className="sf-auth__story-tags"><span>Learn with purpose</span><span>Grow at your pace</span></div>
          </div>
        </aside>
        <div className="sf-auth__form-column">
          <div className="sf-auth__panel"><main id="main-content" tabIndex="-1"><Outlet /></main></div>
          <p className="sf-auth__legal"><Link to="/privacy">Privacy</Link><span aria-hidden="true">·</span><Link to="/terms">Terms</Link><span aria-hidden="true">·</span><Link to="/">SkillForge AI</Link></p>
        </div>
      </div>
    </div>
  );
}
