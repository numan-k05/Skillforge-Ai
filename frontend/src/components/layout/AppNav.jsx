import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Compass, Target, Map, Layers3, LogOut, Sparkles, Code2, TrendingUp, BriefcaseBusiness, BookOpen, GraduationCap, ClipboardCheck, FileCheck2, Settings, Menu, ArrowUpRight, Gauge, Award, ShoppingBag, WalletCards, ShieldCheck, BadgeDollarSign } from "lucide-react";
import { useAuth } from "../../context/auth.js";
import Modal from "../ui/Modal.jsx";
import ThemeToggle from "../ui/ThemeToggle.jsx";
import "./AppNav.css";
const LINKS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/skills", label: "Explore skills", icon: BookOpen },
  { to: "/courses", label: "Courses", icon: GraduationCap },
  { to: "/learning", label: "My learning", icon: BookOpen },
  { to: "/assessments", label: "Assessments", icon: ClipboardCheck },
  { to: "/careers", label: "Career paths", icon: Compass },
  { to: "/career-match", label: "Career match", icon: Target },
  { to: "/skill-analysis", label: "Skill analysis", icon: Target },
  { to: "/roadmap", label: "My roadmap", icon: Map },
  { to: "/projects", label: "Projects", icon: Layers3 },
  { to: "/submissions", label: "Evidence", icon: FileCheck2 },
  { to: "/missions", label: "Daily missions", icon: Sparkles },
  { to: "/challenges", label: "Practice lab", icon: Code2 },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/readiness", label: "Readiness", icon: Gauge },
  { to: "/portfolio", label: "My portfolio", icon: BriefcaseBusiness },
  { to: "/certificates", label: "Certificates", icon: Award },
  { to: "/pricing", label: "Pricing", icon: BadgeDollarSign },
  { to: "/purchases", label: "My access & orders", icon: ShoppingBag },
  { to: "/wallet", label: "Referrals & wallet", icon: WalletCards },
  { to: "/admin", label: "Administration", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
];
export default function AppNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const current = LINKS.find((link) => pathname === link.to || pathname.startsWith(link.to + "/"));
  async function handleLogout() { setOpen(false); await logout(); navigate("/", { replace: true }); }
  const links = <>{LINKS.filter(link => link.to !== "/admin" || user?.isOwnerAdmin).map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => "sf-appnav__link" + (isActive ? " sf-appnav__link--active" : "")}><Icon size={18} aria-hidden="true" /><span>{label}</span></NavLink>)}</>;
  return <>
    <aside className="sf-appnav" aria-label="Workspace sidebar">
      <Link to="/dashboard" className="sf-appnav__brand"><span><Layers3 size={22} aria-hidden="true" /></span>SkillForge <small>AI</small></Link>
      <p className="sf-appnav__section-label">YOUR WORKSPACE</p>
      <nav aria-label="Main navigation" className="sf-appnav__links">{links}</nav>
      <div className="sf-appnav__bottom"><p>A little progress,<br /><strong>every single day.</strong></p><Link to="/skills">Find your next skill <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <button type="button" className="sf-appnav__logout" onClick={handleLogout}><LogOut size={17} aria-hidden="true" /> Log out</button>
    </aside>
    <header className="sf-workspace-header"><div className="sf-workspace-header__title"><button className="sf-icon-button sf-workspace-header__menu" type="button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={20} /></button><span>Workspace <span aria-hidden="true">/</span> <strong>{current?.label || "SkillForge"}</strong></span></div><div className="sf-workspace-header__actions"><ThemeToggle/><Link to={user?.isOwnerAdmin?"/admin":"/settings"} className="sf-workspace-user" aria-label={user?.isOwnerAdmin?"Open private owner administration":"Open your account settings"}><span className="sf-workspace-user__avatar" aria-hidden="true">{user?.name?.slice(0, 1).toUpperCase() || "S"}</span><span>{user?.name || "Your account"}<small>{user?.isOwnerAdmin?"Private owner administrator":"Personal workspace"}</small></span></Link></div></header>
    <Modal open={open} title="Your workspace" onClose={() => setOpen(false)} className="sf-mobile-nav"><nav aria-label="Mobile navigation" className="sf-appnav__links">{links}<button type="button" className="sf-appnav__logout" onClick={handleLogout}><LogOut size={17} aria-hidden="true" /> Log out</button></nav></Modal>
  </>;
}
