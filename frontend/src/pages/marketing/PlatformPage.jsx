import StatementHero from "../../components/marketing/StatementHero.jsx";
import { BrainCircuit, Map, Target, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import "./PlatformPage.css";

const STEPS = [
  {
    icon: Target,
    title: "Choose a direction",
    text: "Tell SkillForge about your target career and the direction you want to grow toward.",
  },
  {
    icon: BrainCircuit,
    title: "Map your current skills",
    text: "Record your current skill levels so your plan starts from what you already know.",
  },
  {
    icon: Map,
    title: "Follow a personalized roadmap",
    text: "Get structured phases, projects, challenges, and daily missions that connect together.",
  },
];

export default function PlatformPage() {
  return (
    <section className="platform-page">
      <div className="container">
        <StatementHero>Plan your career and build your skills in one place.</StatementHero>

        <div className="platform-steps">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="platform-step">
              <span className="platform-step__number">0{index + 1}</span>
              <span className="platform-step__icon"><Icon size={22} /></span>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div className="platform-map">
          <div>
            <span className="platform-eyebrow">Platform map</span>
            <h2>Every major part of your journey is connected.</h2>
            <p>Jump directly to any part of the platform to understand what it does.</p>
          </div>
          <div className="platform-map__links">
            <Link to="/skill-intelligence"><BrainCircuit size={18} /> Skill intelligence</Link>
            <Link to="/roadmaps"><Map size={18} /> Personalized roadmaps</Link>
            <Link to="/pricing"><CheckCircle2 size={18} /> Pricing</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
