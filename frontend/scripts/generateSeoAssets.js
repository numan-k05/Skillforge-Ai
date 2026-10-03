import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {PUBLIC_SEO_ROUTES} from '../src/utils/seoRoutes.js';

const output=path.resolve(process.argv[2]||'dist');
async function envValue(name){
  if(process.env[name])return process.env[name];
  for(const filename of ['.env.production','.env']){try{const text=await fs.readFile(filename,'utf8');const line=text.split(/\r?\n/).find(item=>item.trim().startsWith(`${name}=`));if(line)return line.slice(line.indexOf('=')+1).trim().replace(/^['"]|['"]$/g,'');}catch{/* optional environment file */}}
  return '';
}
const configured=(await envValue('VITE_PUBLIC_SITE_URL')).trim().replace(/\/$/,'');
if(process.env.VERCEL&& !configured)throw new Error('VITE_PUBLIC_SITE_URL is required for Vercel builds.');
if(configured){
  let publicUrl;
  try{publicUrl=new URL(configured);}catch{throw new Error('VITE_PUBLIC_SITE_URL must be a valid absolute URL.');}
  if(process.env.VERCEL_ENV==='production'&&publicUrl.protocol!=='https:')throw new Error('VITE_PUBLIC_SITE_URL must use HTTPS in production.');
}
const siteUrl=configured||'http://localhost:5173';
const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const index=await fs.readFile(path.join(output,'index.html'),'utf8');
const links=PUBLIC_SEO_ROUTES.filter(r=>!['/privacy','/terms','/refunds'].includes(r.path)).map(r=>`<a href="${r.path}">${escapeHtml(r.heading)}</a>`).join(' | ');
for(const route of PUBLIC_SEO_ROUTES){
  const canonical=`${siteUrl}${route.path==='/'?'':route.path}`;
  const schema={'@context':'https://schema.org','@graph':[
    {'@type':'Organization','@id':`${siteUrl}/#organization`,name:'SkillForge AI',url:siteUrl},
    {'@type':'WebSite','@id':`${siteUrl}/#website`,name:'SkillForge AI',url:siteUrl,publisher:{'@id':`${siteUrl}/#organization`},potentialAction:{'@type':'SearchAction',target:`${siteUrl}/skills?q={search_term_string}`,'query-input':'required name=search_term_string'}},
    {'@type':route.path==='/courses'?'CollectionPage':'WebPage',name:route.title,description:route.description,url:canonical,isPartOf:{'@id':`${siteUrl}/#website`}}
  ]};
  let html=index.replace(/<title>[\s\S]*?<\/title>/,`<title>${escapeHtml(route.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escapeHtml(route.description)}" />`)
    .replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${escapeHtml(route.title)}" />`)
    .replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${escapeHtml(route.description)}" />`)
    .replace('</head>',`<link rel="canonical" href="${canonical}" /><meta property="og:url" content="${canonical}" /><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script></head>`)
    .replace('<div id="root"></div>',`<div id="root"><main id="main-content"><h1>${escapeHtml(route.heading)}</h1><p>${escapeHtml(route.text)}</p><nav aria-label="Explore SkillForge">${links}</nav></main></div>`);
  const destination=route.path==='/'?path.join(output,'index.html'):path.join(output,route.path.slice(1),'index.html');
  await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,html);
}
const urls=PUBLIC_SEO_ROUTES.map(route=>`  <url><loc>${siteUrl}${route.path==='/'?'':route.path}</loc></url>`).join('\n');
await fs.writeFile(path.join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
await fs.writeFile(path.join(output,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /checkout\nDisallow: /purchase\nDisallow: /purchases\nDisallow: /receipts\nDisallow: /my-access\nDisallow: /settings\nSitemap: ${siteUrl}/sitemap.xml\n`);
console.log(`Generated ${PUBLIC_SEO_ROUTES.length} crawlable pages for ${siteUrl}`);

