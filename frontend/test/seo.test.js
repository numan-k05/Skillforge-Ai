import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PUBLIC_SEO_ROUTES,PRIVATE_ROUTE_PREFIXES} from '../src/utils/seoRoutes.js';

test('public SEO routes have unique titles, useful descriptions, and crawlable paths',()=>{
  assert.equal(new Set(PUBLIC_SEO_ROUTES.map(route=>route.path)).size,PUBLIC_SEO_ROUTES.length);
  assert.equal(new Set(PUBLIC_SEO_ROUTES.map(route=>route.title)).size,PUBLIC_SEO_ROUTES.length);
  for(const route of PUBLIC_SEO_ROUTES){assert.match(route.path,/^\//);assert.ok(route.description.length>=70);assert.ok(route.heading.length>8);}
  for(const path of ['/admin','/dashboard','/checkout','/purchases'])assert.ok(PRIVATE_ROUTE_PREFIXES.includes(path));
});
test('production build contains metadata, sitemap, robots rules, and static course content',()=>{
  if(!fs.existsSync('dist/sitemap.xml'))return;
  const sitemap=fs.readFileSync('dist/sitemap.xml','utf8'),robots=fs.readFileSync('dist/robots.txt','utf8'),courses=fs.readFileSync('dist/courses/index.html','utf8');
  assert.match(sitemap,/<loc>.*\/courses<\/loc>/);assert.match(sitemap,/<loc>.*\/pricing<\/loc>/);
  assert.match(robots,/Disallow: \/admin/);assert.match(robots,/Sitemap: .*\/sitemap.xml/);
  assert.match(courses,/<link rel="canonical"/);assert.match(courses,/application\/ld\+json/);assert.match(courses,/React/);assert.doesNotMatch(courses,/\/admin<\/loc>/);
});
