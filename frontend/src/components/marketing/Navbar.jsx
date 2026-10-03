import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, GitBranch } from "lucide-react";
import Button from "../ui/Button.jsx";
import ThemeToggle from "../ui/ThemeToggle.jsx";
import { useAuth } from "../../context/auth.js";
import "./Navbar.css";

const LINKS = [
  { to: "/skills", label: "Explore skills" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/skill-intelligence", label: "Skill intelligence" },
  { to: "/roadmaps", label: "Roadmaps" },
  { to: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/", { replace: true });
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  return (
    <header className={`sf-nav ${scrolled ? "sf-nav--scrolled" : ""}`}>
      <div className="sf-nav__inner container">
        <Link to="/" className="sf-nav__brand" onClick={() => setOpen(false)}>
          <span className="sf-nav__mark" aria-hidden="true">
            <GitBranch size={16} strokeWidth={2.4} />
          </span>
          SkillForge <span className="sf-nav__brand-accent">AI</span>
        </Link>

        <nav className="sf-nav__links" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink key={link.label} to={link.to} className="sf-nav__link">
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sf-nav__actions">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="md" to="/dashboard">
                Dashboard
              </Button>
              <Button variant="secondary" size="md" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="md" to="/login">
                Log in
              </Button>
              <Button variant="primary" size="md" to="/signup">
                Build my roadmap
              </Button>
            </>
          )}
        </div>

        <ThemeToggle />

        <button
          className="sf-nav__toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="marketing-mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div id="marketing-mobile-nav" className="sf-nav__mobile" onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); document.querySelector(".sf-nav__toggle")?.focus(); } }}>
          {LINKS.map((link) => (
            <NavLink key={link.label} to={link.to} className="sf-nav__mobile-link" onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          <div className="sf-nav__mobile-actions">
            {isAuthenticated ? (
              <>
                <Button variant="secondary" size="md" to="/dashboard" className="sf-nav__mobile-btn">
                  Dashboard
                </Button>
                <Button variant="primary" size="md" onClick={handleLogout} className="sf-nav__mobile-btn">
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="md" to="/login" className="sf-nav__mobile-btn">
                  Log in
                </Button>
                <Button variant="primary" size="md" to="/signup" className="sf-nav__mobile-btn">
                  Build my roadmap
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
