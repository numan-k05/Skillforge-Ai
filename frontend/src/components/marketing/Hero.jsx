import { ArrowRight, Compass, Sparkles } from "lucide-react";
import Button from "../ui/Button.jsx";
import SkillGraph from "./SkillGraph.jsx";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <p className="hero__eyebrow"><Sparkles size={15} aria-hidden="true" /> A CLEARER PATH FORWARD</p>
          <h1 className="hero__headline">
            Build skills.
            <br />
            Shape your future.
          </h1>
          <p className="hero__sub">
            Stop following generic roadmaps. SkillForge analyzes your current abilities, career goal,
            and available time to build a path toward your target career — one that actually
            starts from where you are.
          </p>
          <div className="hero__actions">
            <Button variant="primary" size="lg" to="/signup" icon={<ArrowRight size={18} />}>
              Build my roadmap
            </Button>
            <Button variant="secondary" size="lg" to="/skills" icon={<Compass size={18} />} iconPosition="left">
              Explore skills
            </Button>
          </div>
          <div className="hero__meta">
            <div>
              <p className="hero__meta-value">6</p>
              <p className="hero__meta-label">roadmap phases per goal</p>
            </div>
            <div>
              <p className="hero__meta-value">18+</p>
              <p className="hero__meta-label">tracked skill areas</p>
            </div>
            <div>
              <p className="hero__meta-value">Daily</p>
              <p className="hero__meta-label">personalized missions</p>
            </div>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__visual-card">
            <div className="hero__visual-header">
              <span className="mono">Example: skill relationships</span>
            </div>
            <SkillGraph />
          </div>
        </div>
      </div>
    </section>
  );
}
