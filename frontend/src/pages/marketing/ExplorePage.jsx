import { useEffect } from "react";
import { BrainCircuit, Map, Target, Trophy, ArrowRight, Sparkles } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import { setPageMeta } from "../../utils/seo.js";
import "./PublicMarketingPage.css";

const features = [
  [BrainCircuit, "Understand your skills", "See what you know, where the gaps are, and which skills deserve attention first."],
  [Map, "Follow a connected plan", "Move from career requirements into roadmap phases, projects, and practical milestones."],
  [Target, "Practice with purpose", "Use daily missions and focused work instead of collecting unrelated learning tasks."],
  [Trophy, "See your progress", "Track completed work and build evidence of growth as your career readiness develops."],
];
export default function ExplorePage() {
  useEffect(() => setPageMeta({title:"Explore the platform",description:"Explore the connected SkillForge AI workflow for skills, roadmaps, projects, missions, and progress."}), []);
  return <section className="public-page"><div className="container">
    <header className="public-page__hero"><span className="public-page__eyebrow"><Sparkles size={16}/> Explore SkillForge</span><h1>Explore one connected career-building workspace.</h1><p>SkillForge brings the major parts of career growth together so each next step is connected to your current skills and long-term direction.</p><div className="public-page__actions"><Button variant="primary" size="lg" to="/signup">Build my roadmap <ArrowRight size={18}/></Button><Button variant="secondary" size="lg" to="/how-it-works">How it works</Button></div></header>
    <div className="public-grid">{features.map(([Icon,title,text])=><article className="public-card" key={title}><span className="public-card__icon"><Icon size={23}/></span><h2>{title}</h2><p>{text}</p></article>)}</div>
    <section className="public-section"><h2>Explore the journey in your own order.</h2><p>Start with the part you are curious about. When you are ready, create an account to connect the full workflow to your own goals.</p><div className="public-links"><a href="/skill-intelligence">Skill intelligence</a><a href="/roadmaps">Roadmaps</a><a href="/pricing">Pricing</a></div></section>
  </div></section>;
}