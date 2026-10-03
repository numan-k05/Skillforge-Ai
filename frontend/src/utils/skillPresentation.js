export const CATEGORY_STYLES = {
  development: { label: "Development", icon: "Code2", color: "#C4B5FD" },
  data: { label: "AI & data", icon: "BrainCircuit", color: "#67E8F9" },
  design: { label: "Design", icon: "PenTool", color: "#F0ABFC" },
  marketing: { label: "Marketing", icon: "Megaphone", color: "#FDBA74" },
  business: { label: "Business", icon: "BriefcaseBusiness", color: "#FCD34D" },
  security: { label: "Cybersecurity", icon: "ShieldCheck", color: "#6EE7B7" },
  mobile: { label: "Mobile development", icon: "Smartphone", color: "#93C5FD" },
};
export function skillGroup(skill = {}) {
  const category = typeof skill === "string" ? skill : `${skill.category || ""} ${skill.name || ""} ${skill.skillName || ""}`;
  if (/mobile|flutter|android|ios|react native/i.test(category)) return "mobile";
  if (/secur|penetration|networking/i.test(category)) return "security";
  if (/marketing|seo|advertis|social media|copywriting/i.test(category)) return "marketing";
  if (/business|finance|account|entrepreneur|management|sales|communication/i.test(category)) return "business";
  if (/design|figma|ux|wirefram|prototyp|adobe/i.test(category) && !/system design|api design/i.test(category)) return "design";
  if (/data|machine learning|artificial|statistics|pandas|tensorflow|pytorch|\bai\b|\bml\b|\bsql\b/i.test(category)) return "data";
  return "development";
}
export function skillPresentation(skill) { return CATEGORY_STYLES[skillGroup(skill)]; }
const SEARCH_ALIASES={
  'website making':'web development html css javascript react frontend',
  'web development':'html css javascript react node frontend backend',
  'frontend developer':'html css javascript react web development',
  'backend developer':'node python sql api database server',
  'data analyst':'python sql statistics data analysis',
  'coding':'programming javascript python algorithms',
  'programming':'coding javascript python node algorithms',
  'database':'sql data backend',
  'version control':'git github collaboration',
  'ui ux':'design figma wireframe prototype',
};
export function filterSkills(skills, search = "", group = "all") {
  const query = search.trim().toLowerCase();
  const expanded=`${query} ${Object.entries(SEARCH_ALIASES).filter(([alias])=>alias.includes(query)||query.includes(alias)).map(([,terms])=>terms).join(' ')}`.trim().split(/\s+/).filter(term=>term.length>1);
  return skills.filter((skill) => {
    if(group!=="all"&&skillGroup(skill)!==group)return false;
    if(!query)return true;
    const text=`${skill.name} ${skill.category||""} ${skill.description||""}`.toLowerCase();
    return text.includes(query)||expanded.some(term=>text.includes(term));
  });
}
