import StatementHero from "../../components/marketing/StatementHero.jsx";
import { useEffect } from "react";
import { Compass, BrainCircuit, Map, Rocket } from "lucide-react";
import { setPageMeta } from "../../utils/seo.js";
import "./PublicMarketingPage.css";
import "./HowItWorksPage.css";
const covers = [
  ["choose-direction", "A learner discussing career possibilities with a mentor"],
  ["analyze-skills", "A learner reviewing skill charts on a laptop beside a notebook"],
  ["build-roadmap", "Planning cards arranged into a step-by-step learning path"],
  ["learn-adapt", "A focused learner working on a practical laptop project"],
];
const steps=[[Compass,"Choose a career direction","Select a direction and give the platform context about where you want to grow."],[BrainCircuit,"Analyze your skills","Compare your current skills with the requirements that matter for your target path."],[Map,"Build your roadmap","Turn priorities into structured phases, projects, challenges, and daily work."],[Rocket,"Learn and adapt","Complete focused work, track progress, and refine your plan as you grow."]];
export default function HowItWorksPage(){
 useEffect(()=>setPageMeta({title:"How it works",description:"See how SkillForge AI turns a career direction and skill analysis into a practical, connected learning journey."}),[]);
 return (
  <section className="public-page"><div className="container">
   <StatementHero>Choose a career, check your skills, and follow a learning plan.</StatementHero>
   <div className="public-grid workflow-grid">
    {steps.map(([Icon, title, text], index) => (
     <article className="public-card workflow-card" key={title}>
      <div className="workflow-card__cover">
       <img src={`/images/workflow/${covers[index][0]}.png`} alt={covers[index][1]} width="1536" height="1024" loading={index < 2 ? "eager" : "lazy"} decoding="async" />
      </div>
      <div className="workflow-card__body">
       <div className="workflow-card__meta"><span className="public-card__icon"><Icon size={18} aria-hidden="true" /></span><span>STEP 0{index + 1}</span></div>
       <h2>{title}</h2><p>{text}</p>
      </div>
     </article>
    ))}
   </div>
   <section className="public-section"><h2>The plan is practical, not just descriptive.</h2><p>Analysis becomes a roadmap. A roadmap becomes projects, challenges, and daily missions. Completed work becomes progress you can review.</p></section>
  </div></section>
 );
}
