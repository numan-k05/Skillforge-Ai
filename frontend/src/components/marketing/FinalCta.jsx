import { ArrowRight } from "lucide-react";
import Button from "../ui/Button.jsx";
import "./FinalCta.css";

export default function FinalCta() {
  return (
    <section className="final-cta">
      <div className="container final-cta__card">
        <div>
          <h2>Your next skill is already decided by your last one.</h2>
          <p>Tell SkillForge what you know and where you're headed — the rest of the plan follows from that.</p>
        </div>
        <Button variant="primary" size="lg" to="/signup" icon={<ArrowRight size={18} />}>
          Build my roadmap
        </Button>
      </div>
    </section>
  );
}
