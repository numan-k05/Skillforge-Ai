const APP_NAME = "SkillForge AI";
const DEFAULT_DESCRIPTION = "SkillForge helps students analyze skills, explore careers, and build personalized learning roadmaps.";

function upsert(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function upsertLink(selector, attributes) {
  let element=document.head.querySelector(selector);
  if(!element){element=document.createElement('link');document.head.appendChild(element);}
  Object.entries(attributes).forEach(([key,value])=>element.setAttribute(key,value));
}

const siteOrigin=()=>String(import.meta.env?.VITE_PUBLIC_SITE_URL||window.location.origin).replace(/\/$/,'');

export function setPageMeta({ title, description = DEFAULT_DESCRIPTION, type = "website", robots="index,follow", structuredData=false } = {}) {
  document.title = title ? (title.includes(APP_NAME)?title:`${title} | ${APP_NAME}`) : APP_NAME;
  const canonical=`${siteOrigin()}${window.location.pathname==='/'?'':window.location.pathname}`;
  upsert('meta[name="description"]', { name: "description", content: description });
  upsert('meta[name="robots"]',{name:'robots',content:robots});
  upsert('meta[property="og:title"]', { property: "og:title", content: document.title });
  upsert('meta[property="og:description"]', { property: "og:description", content: description });
  upsert('meta[property="og:type"]', { property: "og:type", content: type });
  upsert('meta[property="og:url"]',{property:'og:url',content:canonical});
  upsert('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertLink('link[rel="canonical"]',{rel:'canonical',href:canonical});
  const old=document.head.querySelector('script[data-skillforge-schema]');
  if(old)old.remove();
  if(structuredData){const script=document.createElement('script');script.type='application/ld+json';script.dataset.skillforgeSchema='true';script.textContent=JSON.stringify({'@context':'https://schema.org','@type':type==='article'?'Article':'WebPage',name:document.title,description,url:canonical,isPartOf:{'@type':'WebSite',name:APP_NAME,url:siteOrigin()}});document.head.appendChild(script);}
}

export function restoreDefaultMeta() {
  setPageMeta({ title: "Turn your current skills into your future career", description: DEFAULT_DESCRIPTION });
}
