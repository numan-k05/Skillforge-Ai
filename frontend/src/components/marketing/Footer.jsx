import { Link } from "react-router-dom";
import { GitBranch } from "lucide-react";
import "./Footer.css";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "How it works", to: "/how-it-works" },
      { label: "Skill intelligence", to: "/skill-intelligence" },
      { label: "Personalized roadmaps", to: "/roadmaps" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", to: "/login" },
      { label: "Create account", to: "/signup" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "FAQ", to: "/#faq" },
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
      { label: "Refunds", to: "/refunds" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="sf-footer">
      <div className="container sf-footer__inner">
        <div className="sf-footer__brand">
          <span className="sf-footer__mark" aria-hidden="true">
            <GitBranch size={16} strokeWidth={2.4} />
          </span>
          <div>
            <p className="sf-footer__name">SkillForge AI</p>
            <p className="sf-footer__tag">Turn your current skills into your future career.</p>
          </div>
        </div>

        <div className="sf-footer__columns">
          {COLUMNS.map((col) => (
            <div key={col.title} className="sf-footer__col">
              <p className="sf-footer__col-title">{col.title}</p>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="container sf-footer__bottom">
        <p>© {new Date().getFullYear()} SkillForge AI. Built as an independent learning platform, not a job guarantee.</p>
      </div>
    </footer>
  );
}
