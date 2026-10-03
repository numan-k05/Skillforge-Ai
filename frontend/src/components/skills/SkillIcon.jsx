import { Code2, BrainCircuit, PenTool, Megaphone, BriefcaseBusiness, ShieldCheck, Smartphone } from "lucide-react";
import { skillPresentation } from "../../utils/skillPresentation.js";
const ICONS = { Code2, BrainCircuit, PenTool, Megaphone, BriefcaseBusiness, ShieldCheck, Smartphone };
export default function SkillIcon({ skill, size = 22, className = "" }) {
  const { icon, color } = skillPresentation(skill);
  const Icon = ICONS[icon];
  return <span className={`sf-skill-icon ${className}`} style={{ "--category-color": color }} aria-hidden="true"><Icon size={size} /></span>;
}
