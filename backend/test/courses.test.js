import { after, before, test, mock } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import jwt from "jsonwebtoken";

process.env.DOTENV_CONFIG_PATH="test/does-not-exist.env"; process.env.NODE_ENV="test";
process.env.JWT_SECRET="test-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz"; process.env.JWT_EXPIRES_IN="1h";
process.env.DATABASE_URL="postgresql://unused:unused@127.0.0.1:1/unused"; process.env.CORS_ORIGIN="http://localhost:5173";
const {pool}=await import("../src/config/db.js"); const {default:app}=await import("../src/app.js");
let server,base; const learner=jwt.sign({sub:"1",email:"learner@example.test"},process.env.JWT_SECRET,{algorithm:"HS256",expiresIn:"1h"});
const admin=jwt.sign({sub:"2",email:"admin@example.test"},process.env.JWT_SECRET,{algorithm:"HS256",expiresIn:"1h"});
const course={id:"10",skill_id:"1",skill_name:"React",title:"React foundations",slug:"react-foundations",description:"Learn components and accessible interface foundations.",difficulty:"beginner",estimated_hours:8,status:"published",is_premium:false,module_count:1,lesson_count:1,total:1,enrolled:false};
let premium=false,accessAllowed=true;
async function query(sql,params=[]){const text=sql.replace(/\s+/g," ").trim();
  if(["BEGIN","COMMIT","ROLLBACK"].includes(text))return {rows:[]};
  if(text==="SELECT deleted_at FROM users WHERE id = $1")return {rows:[{deleted_at:null}]};
  if(text==="SELECT role FROM users WHERE id = $1")return {rows:[{role:String(params[0])==="2"?"content_admin":"learner"}]};
  if(text.startsWith("SELECT p.id,p.name,p.slug,pp.currency"))return {rows:[]};
  if(text.startsWith("SELECT entity.id"))return {rows:[{id:"10",is_premium:premium,has_access:!premium||accessAllowed,required_products:[]}]};
  if(text.includes("premium_content_rules"))return {rows:[{allowed:accessAllowed||(text.includes("u.role='admin'")&&String(params[0])==="2")}]};
  if(text.includes("COUNT(*) OVER()"))return {rows:[course]};
  if(text.startsWith("SELECT c.*, s.name AS skill_name"))return {rows:[{...course,is_premium:premium,enrolled:String(params[1]||"")==="1"}]};
  if(text.startsWith("SELECT cm.id"))return {rows:[{id:"20",title:"Start here",description:null,position:1,lessons:[{id:"30",title:"Components",position:1,isPreview:false,content:"Protected lesson",sourceUrl:"https://react.dev/learn",completed:false}]}]};
  if(text.startsWith("SELECT c.id, c.title, c.slug FROM course_prerequisites"))return {rows:[]};
  if(text.startsWith("SELECT c.id,c.title FROM course_prerequisites"))return {rows:[]};
  if(text.startsWith("INSERT INTO course_enrollments"))return {rows:[{course_id:"10",status:"in_progress",started_at:new Date().toISOString()}]};
  if(text.startsWith("UPDATE course_enrollments SET updated_at=now()")){assert.equal(String(params[1]),"10");return {rows:[{course_id:"10",status:"in_progress",updated_at:new Date().toISOString()}]};}
  if(text.startsWith("SELECT cl.id,cm.course_id"))return {rows:[{id:"30",course_id:"10"}]};
  if(text.startsWith("INSERT INTO lesson_progress"))return {rows:[]};
  if(text.startsWith("SELECT COUNT(cl.id)::int AS total"))return {rows:[{total:1,completed:1}]};
  if(text.startsWith("UPDATE course_enrollments SET status")){assert.match(text,/\$3::varchar/);return {rows:[]};}
  if(text.startsWith("INSERT INTO courses"))return {rows:[{...course,id:"11",status:params[6]}]};
  if(text.startsWith("INSERT INTO audit_logs"))return {rows:[]};
  throw new Error(`Unexpected course test SQL: ${text}`);
}
before(async()=>{mock.method(pool,"query",query);mock.method(pool,"connect",async()=>({query,release(){}}));server=app.listen(0,"127.0.0.1");await once(server,"listening");base=`http://127.0.0.1:${server.address().port}/api`;});
after(async()=>{await new Promise(r=>server.close(r));mock.restoreAll();await pool.end();});
async function request(path,{method="GET",body,token}={}){const response=await fetch(base+path,{method,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,body:await response.json()};}

test("published course catalog is public and locked lessons do not leak content",async()=>{
  const list=await request("/courses"); assert.equal(list.status,200); assert.equal(list.body.courses[0].title,"React foundations");
  const detail=await request("/courses/10"); assert.equal(detail.status,200); const lesson=detail.body.course.modules[0].lessons[0]; assert.equal(lesson.locked,true); assert.equal(lesson.content,null); assert.equal(lesson.sourceUrl,null);
});
test("an old enrollment cannot reveal premium lessons without an active access grant",async()=>{
  premium=true;accessAllowed=false;
  try{const detail=await request("/courses/10",{token:learner});assert.equal(detail.status,200);const lesson=detail.body.course.modules[0].lessons[0];assert.equal(lesson.locked,true);assert.equal(lesson.content,null);}
  finally{premium=false;accessAllowed=true;}
});
test("administrators can use premium courses and lessons without a purchase grant",async()=>{
  premium=true;accessAllowed=false;
  try{
    assert.equal((await request("/courses/10/start",{method:"POST",token:learner})).status,403);
    assert.equal((await request("/courses/10/start",{method:"POST",token:admin})).status,201);
    assert.equal((await request("/courses/10/focus",{method:"POST",token:learner})).status,403);
    assert.equal((await request("/courses/10/focus",{method:"POST",token:admin})).status,200);
    assert.equal((await request("/courses/lessons/30/complete",{method:"POST",token:admin})).status,200);
  }finally{premium=false;accessAllowed=true;}
});
test("authenticated learner can idempotently start a course",async()=>{const result=await request("/courses/10/start",{method:"POST",token:learner});assert.equal(result.status,201);assert.equal(result.body.enrollment.status,"in_progress");});
test("lesson completion is ownership-scoped and idempotently reports course completion",async()=>{for(let attempt=0;attempt<2;attempt++){const result=await request("/courses/lessons/30/complete",{method:"POST",token:learner});assert.equal(result.status,200);assert.deepEqual(result.body.progress,{courseId:"10",completedLessons:1,totalLessons:1,percentage:100,status:"completed"});}});
test("database roles protect course authoring and valid content admin input succeeds",async()=>{
  const payload={skillId:1,title:"Advanced React",slug:"advanced-react",description:"A complete advanced React course for working developers.",difficulty:"advanced",estimatedHours:12,status:"draft",isPremium:false};
  assert.equal((await request("/courses/admin",{method:"POST",body:payload,token:learner})).status,403);
  const invalid=await request("/courses/admin",{method:"POST",body:{},token:admin});assert.equal(invalid.status,400);assert.ok(invalid.body.error.details.length);
  assert.equal((await request("/courses/admin",{method:"POST",body:payload,token:admin})).status,201);
});
test("course progress and admin routes reject anonymous access before database work",async()=>{
  for(const [method,path] of [["GET","/courses/mine"],["POST","/courses/10/start"],["POST","/courses/10/focus"],["POST","/courses/lessons/30/complete"],["POST","/courses/admin"]])assert.equal((await request(path,{method})).status,401,path);
});
