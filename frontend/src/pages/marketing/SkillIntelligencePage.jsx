import StatementHero from "../../components/marketing/StatementHero.jsx";
import { useEffect } from "react";
import { ScanSearch, Layers3, Gauge } from "lucide-react";
import { setPageMeta } from "../../utils/seo.js";
import "./PublicMarketingPage.css";
const items=[[ScanSearch,"Compare requirements","Organize the skills associated with a career direction and compare them with your current profile."],[Layers3,"Prioritize gaps","Focus attention on meaningful gaps instead of treating every missing skill as equally urgent."],[Gauge,"Track readiness","Use progress and completion signals to understand how your work is moving your plan forward."]];
export default function SkillIntelligencePage(){
 useEffect(()=>setPageMeta({title:"Skill intelligence",description:"Learn how SkillForge AI helps organize career requirements, identify skill gaps, and prioritize practical next steps."}),[]);
 return <section className="public-page"><div className="container"><StatementHero>Find the skills you need to improve for your chosen career.</StatementHero><div className="public-grid">{items.map(([Icon,title,text])=><article className="public-card" key={title}><span className="public-card__icon"><Icon size={23}/></span><h2>{title}</h2><p>{text}</p></article>)}</div><section className="public-section"><h2>What this helps you avoid</h2><p>Random course collecting, duplicate effort, and vague goals. Your analysis is intended to make the next step easier to explain and act on.</p><div className="public-links"><a href="/how-it-works">See the workflow</a><a href="/explore">Explore platform</a></div></section></div></section>;
}
