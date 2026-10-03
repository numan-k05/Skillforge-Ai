import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {DEFAULT_SEO,PRIVATE_ROUTE_PREFIXES,PUBLIC_SEO_ROUTES} from '../utils/seoRoutes.js';
import {setPageMeta} from '../utils/seo.js';

export default function SeoManager(){
  const {pathname}=useLocation();
  useEffect(()=>{
    const route=PUBLIC_SEO_ROUTES.find(item=>item.path===pathname);
    const privatePage=PRIVATE_ROUTE_PREFIXES.some(prefix=>pathname===prefix||pathname.startsWith(`${prefix}/`));
    if(route)setPageMeta({...route,structuredData:true});
    else if(pathname.startsWith('/skills/'))setPageMeta({title:'Skill Learning Resources',description:'Explore a practical skill, related learning resources, and connected career paths on SkillForge AI.',type:'article'});
    else if(pathname.startsWith('/courses/'))setPageMeta({title:'Course Preview and Curriculum',description:'Review course outcomes, modules, lessons, prerequisites, estimated time, and access options on SkillForge AI.',type:'article'});
    else setPageMeta({...DEFAULT_SEO,robots:privatePage?'noindex,nofollow':'index,follow'});
  },[pathname]);
  return null;
}
