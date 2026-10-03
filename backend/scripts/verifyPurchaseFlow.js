import "dotenv/config";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";

// Run only against a local development database. All fixtures are rolled back.
const databaseHost=new URL(process.env.DATABASE_URL).hostname;
if(!["localhost","127.0.0.1","[::1]"].includes(databaseHost))throw new Error("This verification requires a local database.");
process.env.NODE_ENV="test";
process.env.SANDBOX_PAYMENT_WEBHOOK_SECRET="isolated-purchase-verification-secret";
process.env.AI_ENABLED="false";
process.env.AI_ASSESSMENTS_ENABLED="false";
const {pool}=await import("../src/config/db.js");
const {signAccessToken}=await import("../src/utils/jwt.js");
const {default:app}=await import("../src/app.js");
const {getLearningFocus}=await import("../src/models/dashboardModel.js");
const client=await pool.connect();
const queryDirect=client.query.bind(client);let queue=Promise.resolve();
client.query=(...args)=>{const result=queue.then(()=>queryDirect(...args));queue=result.catch(()=>{});return result;};
const originalQuery=pool.query.bind(pool),originalConnect=pool.connect.bind(pool);
let server;let checks=0;
try{
  await client.query("BEGIN");
  pool.query=(...args)=>client.query(...args);
  let savepoint=0;
  pool.connect=async()=>{const name=`flow_${++savepoint}`;return {release(){},query(sql,params){
    if(sql==="BEGIN")return client.query(`SAVEPOINT ${name}`);
    if(sql==="COMMIT")return client.query(`RELEASE SAVEPOINT ${name}`);
    if(sql==="ROLLBACK")return client.query(`ROLLBACK TO SAVEPOINT ${name}`);
    return client.query(sql,params);
  }};};
  const created=await client.query("INSERT INTO users(name,email,password_hash) VALUES('Purchase verification',$1,'not-a-login-password') RETURNING id,email",[`flow-${randomUUID()}@example.test`]);
  const user=created.rows[0];const token=signAccessToken(user);
  server=app.listen(0,"127.0.0.1");await once(server,"listening");
  const base=`http://127.0.0.1:${server.address().port}/api`;
  async function request(path,{method="GET",body,auth=true,status=200,bearer=token}={}){
    const response=await fetch(base+path,{method,headers:{"Content-Type":"application/json",...(auth?{Authorization:`Bearer ${bearer}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const data=await response.json();assert.equal(response.status,status,`${method} ${path}: ${JSON.stringify(data)}`);checks++;return data;
  }
  const products=await request("/commerce/products?currency=USD");
  assert.equal(products.filter(p=>p.kind==="skill_pass").length,8);
  assert.equal(products.filter(p=>p.kind==="career_bundle").length,5);
  assert.ok(products.every(p=>!p.hasAccess));
  const react=products.find(p=>p.slug==="react-skill-pass");
  const python=products.find(p=>p.slug==="python-skill-pass");
  const frontend=products.find(p=>p.slug==="frontend-developer-career-bundle");
  const course=react.includes.courses[0],other=python.includes.courses[0];
  const quiz=react.includes.assessments[0],project=react.includes.projects[0],certificate=react.includes.certificates[0];
  const certificates=await request("/certificates/catalog");assert.equal(certificates.find(c=>String(c.id)===String(certificate.id)).hasAccess,false);
  const freeCourses=await request("/courses");assert.ok(freeCourses.courses.every(c=>!c.isPremium||!c.hasAccess));
  const quizzes=await request("/assessments");assert.equal(quizzes.quizzes.find(q=>String(q.id)===String(quiz.id)).hasAccess,false);
  const projects=await request("/projects");assert.equal(projects.projects.find(p=>String(p.projectId)===String(project.id)).hasAccess,false);
  await request(`/courses/${course.id}/start`,{method:"POST",status:403});
  await request(`/assessments/${quiz.id}/attempts`,{method:"POST",status:403});
  await request(`/projects/${project.id}/start`,{method:"POST",status:403});
  await request(`/certificates/${certificate.id}/issue`,{method:"POST",status:403});
  await request("/commerce/orders",{method:"POST",body:{productIds:[react.id],currency:"USD"},auth:false,status:401});
  async function order(product){return (await request("/commerce/orders",{method:"POST",body:{productIds:[product.id],currency:"USD",totalMinor:1},status:201})).order;}
  async function pay(o,type){await request(`/payments/orders/${o.id}/checkout`,{method:"POST",status:201});return request(`/payments/orders/${o.id}/simulate`,{method:"POST",body:{type}});}
  const failed=await order(react);assert.equal(failed.totalMinor,1899);await pay(failed,"payment.failed");
  await request(`/courses/${course.id}/start`,{method:"POST",status:403});
  const pending=await order(react);
  await request(`/courses/${course.id}/start`,{method:"POST",status:403});
  await pay(pending,"payment.paid");
  const paid=await request("/commerce/products");assert.equal(paid.find(p=>p.id===react.id).hasAccess,true);assert.equal(paid.find(p=>p.id===python.id).hasAccess,false);
  await request(`/courses/${course.id}/start`,{method:"POST",status:201});
  await request(`/courses/${other.id}/start`,{method:"POST",status:403});
  const detail=(await request(`/courses/${course.id}`)).course;assert.ok(detail.modules.flatMap(m=>m.lessons).every(l=>!l.locked));
  const focus=await getLearningFocus(user.id);assert.equal(String(focus.course_id),String(course.id));assert.equal(focus.projects.length,react.includes.projects.length);
  const attempt=await request(`/assessments/${quiz.id}/attempts`,{method:"POST",status:201});
  await request(`/projects/${project.id}/start`,{method:"POST",status:201});
  await request(`/certificates/${certificate.id}/issue`,{method:"POST",status:409});
  const otherUser=(await client.query("INSERT INTO users(name,email,password_hash) VALUES('Other verification learner',$1,'not-a-login-password') RETURNING id,email",[`other-${randomUUID()}@example.test`])).rows[0];
  const otherToken=signAccessToken(otherUser);
  await request(`/payments/orders/${pending.id}/receipt`,{bearer:otherToken,status:404});
  await request(`/payments/orders/${pending.id}/checkout`,{method:"POST",bearer:otherToken,status:404});
  await request(`/payments/orders/${pending.id}/simulate`,{method:"POST",body:{type:"payment.paid"},bearer:otherToken,status:404});
  const receipt=await request(`/payments/orders/${pending.id}/receipt`);assert.equal(receipt.status,"paid");
  await request(`/payments/orders/${pending.id}/receipt`,{auth:false,status:401});
  await request(`/payments/orders/99999999/receipt`,{status:404});
  await request(`/payments/orders/${pending.id}/simulate`,{method:"POST",body:{type:"payment.refunded"}});
  await request(`/courses/${course.id}/start`,{method:"POST",status:403});
  await request(`/assessments/attempts/${attempt.attempt.id}`,{status:403});
  const locked=(await request(`/courses/${course.id}`)).course;assert.ok(locked.modules.flatMap(m=>m.lessons).filter(l=>!l.isPreview).every(l=>l.locked&&!l.content&&!l.sourceUrl));
  const repurchase=await order(react);await pay(repurchase,"payment.paid");await request(`/courses/${course.id}/start`,{method:"POST",status:201});
  const bundle=await order(frontend);assert.equal(bundle.totalMinor,4999);await pay(bundle,"payment.paid");
  for(const included of frontend.includes.courses)await request(`/courses/${included.id}/start`,{method:"POST",status:201});
  await request(`/courses/${other.id}/start`,{method:"POST",status:403});
  console.log(`Purchase flow verified: ${checks} API checks; free locks, exact prices, failure/pending denial, scoped Skill Pass and bundle access, refund, repurchase, and certificate requirements.`);
}finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  pool.query=originalQuery;pool.connect=originalConnect;
  await client.query("ROLLBACK");client.release();await pool.end();
}
