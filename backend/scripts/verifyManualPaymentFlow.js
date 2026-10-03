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

  const {env}=await import('../src/config/env.js');
  env.nodeEnv='manual-verification';
  const ownerEmail='manual-owner-'+randomUUID()+'@example.test';env.ownerAdminEmail=ownerEmail;
  const owner=(await client.query("INSERT INTO users(name,email,password_hash,role) VALUES('Owner',$1,'not-a-login-password','admin') RETURNING id,email",[ownerEmail])).rows[0];
  const adminToken=signAccessToken(owner);
  const otherAdmin=(await client.query("INSERT INTO users(name,email,password_hash,role) VALUES('Other admin',$1,'not-a-login-password','admin') RETURNING id,email",['other-admin-'+randomUUID()+'@example.test'])).rows[0];
  const outsider=signAccessToken(otherAdmin);
  assert.equal((await request('/auth/me')).user.isOwnerAdmin,false);
  assert.equal((await request('/auth/me',{bearer:adminToken})).user.isOwnerAdmin,true);
  const spoofed=signAccessToken({id:otherAdmin.id,email:ownerEmail});
  await request('/manual-payments/admin/settings',{bearer:spoofed,status:403});
  await request('/manual-payments/admin/settings',{auth:false,status:401});
  await request('/manual-payments/admin/settings',{status:403});
  await request('/manual-payments/admin/settings',{bearer:outsider,status:403});
  await request('/admin/overview',{status:403});
  await request('/admin/overview',{bearer:outsider,status:403});
  await request('/admin/overview',{bearer:adminToken});
  const settings=await request('/manual-payments/admin/settings',{bearer:adminToken});
  const products=await request('/commerce/products');
  const react=products.find(p=>p.slug==='react-skill-pass'),python=products.find(p=>p.slug==='python-skill-pass'),bundle=products.find(p=>p.kind==='career_bundle'),monthly=products.find(p=>p.kind==='subscription');
  assert.equal(monthly.accessDurationDays,30);assert.equal(monthly.manualPrice.amountMinor,64900);
  const methods=settings.methods.length?settings.methods:[{name:'Test bank',account_title:'Test owner',account_number:'123456789',instructions:'Test only',enabled:true}];
  methods[0].enabled=true;
  await request('/manual-payments/admin/settings',{bearer:adminToken,method:'PUT',body:{methods,prices:[{productId:react.id,amountMinor:99900},{productId:bundle.id,amountMinor:199900},{productId:monthly.id,amountMinor:64900}]}});
  const methodId=(await request('/manual-payments/admin/settings',{bearer:adminToken})).methods[0].id;
  async function order(product=react){return(await request('/commerce/orders',{method:'POST',body:{productIds:[product.id],currency:'PKR',totalMinor:1},status:201})).order;}
  const pending=await order();assert.equal(pending.totalMinor,99900);
  await request('/payments/orders/'+pending.id+'/checkout',{method:'POST',status:404});
  await request('/payments/orders/'+pending.id+'/simulate',{method:'POST',body:{type:'payment.paid'},status:404});
  await request('/manual-payments/orders/'+pending.id,{bearer:outsider,status:404});
  await request('/courses/'+react.includes.courses[0].id+'/start',{method:'POST',status:403});
  const image=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.from(randomUUID())]).toString('base64');
  const proof={methodId,reference:'TX-'+randomUUID(),amountMinor:99900,paidDate:new Date().toISOString().slice(0,10),image,mime:'image/png'};
  const submitPath='/manual-payments/orders/'+pending.id+'/proof';
  await request(submitPath,{method:'POST',body:proof,auth:false,status:401});
  await request(submitPath,{method:'POST',body:proof,bearer:outsider,status:404});
  await request(submitPath,{method:'POST',body:{...proof,amountMinor:1},status:400});
  await request(submitPath,{method:'POST',body:{...proof,image:Buffer.from('not an image').toString('base64')},status:400});
  await request(submitPath,{method:'POST',body:{...proof,paidDate:'2099-01-01'},status:400});
  const submitted=await request(submitPath,{method:'POST',body:proof,status:201});
  await request(submitPath,{method:'POST',body:proof,status:409});
  await request('/courses/'+react.includes.courses[0].id+'/start',{method:'POST',status:403});
  await request('/manual-payments/admin/submissions/'+submitted.id+'/proof',{status:403});
  const response=await fetch(base+'/manual-payments/admin/submissions/'+submitted.id+'/proof',{headers:{Authorization:'Bearer '+adminToken}});assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');assert.equal(response.headers.get('cache-control'),'no-store');checks++;
  const reviewPath='/manual-payments/admin/submissions/'+submitted.id+'/review';
  await request(reviewPath,{method:'POST',body:{decision:'approved',note:'',verified:true},status:403});
  await request(reviewPath,{method:'POST',body:{decision:'approved',note:'',verified:true},bearer:outsider,status:403});
  await request(reviewPath,{method:'POST',body:{decision:'approved',note:''},bearer:adminToken,status:400});
  await request(reviewPath,{method:'POST',body:{decision:'needs_information',note:'Please upload a clearer screenshot.'},bearer:adminToken});
  await request(submitPath,{method:'POST',body:{...proof,reference:proof.reference+'CORRECTED'},status:201});
  assert.equal((await client.query('SELECT count(*)::int n FROM manual_payment_revisions WHERE submission_id=$1',[submitted.id])).rows[0].n,1);
  await request(reviewPath,{method:'POST',body:{decision:'rejected',note:'Reference requires verification.'},bearer:adminToken});
  await request('/courses/'+react.includes.courses[0].id+'/start',{method:'POST',status:403});
  await request(reviewPath,{method:'POST',body:{decision:'approved',note:'Verified in bank statement.',verified:true},bearer:adminToken});
  await request(reviewPath,{method:'POST',body:{decision:'approved',note:'Retry',verified:true},bearer:adminToken});
  const receipt=await request('/payments/orders/'+pending.id+'/receipt');assert.equal(receipt.status,'paid');assert.ok(receipt.receiptNumber);
  assert.equal((await client.query('SELECT count(*)::int n FROM payments WHERE order_id=$1',[pending.id])).rows[0].n,1);
  await request('/courses/'+react.includes.courses[0].id+'/start',{method:'POST',status:201});
  await request('/courses/'+python.includes.courses[0].id+'/start',{method:'POST',status:403});
  const duplicate=await order();
  await request('/manual-payments/orders/'+duplicate.id+'/proof',{method:'POST',body:proof,status:409});
  await request('/manual-payments/orders/'+duplicate.id+'/proof',{method:'POST',body:{...proof,reference:'different-reference'},status:409});
  const bundleOrder=await order(bundle);assert.equal(bundleOrder.totalMinor,199900);
  const secondImage=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.from(randomUUID())]).toString('base64');
  const bundleSubmission=await request('/manual-payments/orders/'+bundleOrder.id+'/proof',{method:'POST',body:{...proof,reference:'BUNDLE-'+randomUUID(),image:secondImage,amountMinor:199900},status:201});
  await request('/manual-payments/admin/submissions/'+bundleSubmission.id+'/review',{method:'POST',body:{decision:'approved',verified:true,note:'Verified'},bearer:adminToken});
  for(const course of bundle.includes.courses)await request('/courses/'+course.id+'/start',{method:'POST',status:201});
  const ownedCourseIds=new Set([react,...[bundle]].flatMap(p=>p.includes.courses.map(c=>String(c.id))));
  const monthlyOnlyCourse=monthly.includes.courses.find(c=>!ownedCourseIds.has(String(c.id)));assert.ok(monthlyOnlyCourse);
  async function approveMonthly(reference){const monthlyOrder=await order(monthly);assert.equal(monthlyOrder.totalMinor,64900);const shot=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.from(randomUUID())]).toString('base64');const submission=await request('/manual-payments/orders/'+monthlyOrder.id+'/proof',{method:'POST',body:{...proof,reference,image:shot,amountMinor:64900},status:201});await request('/manual-payments/admin/submissions/'+submission.id+'/review',{method:'POST',body:{decision:'approved',verified:true,note:'Verified monthly payment'},bearer:adminToken});return monthlyOrder;}
  await approveMonthly('MONTHLY-'+randomUUID());
  const firstExpiry=(await client.query('SELECT expires_at FROM access_grants WHERE user_id=$1 AND product_id=$2',[user.id,monthly.id])).rows[0].expires_at;assert.ok(firstExpiry>Date.now());
  await request('/courses/'+monthlyOnlyCourse.id+'/start',{method:'POST',status:201});
  await approveMonthly('RENEW-'+randomUUID());
  const renewedExpiry=(await client.query('SELECT expires_at FROM access_grants WHERE user_id=$1 AND product_id=$2',[user.id,monthly.id])).rows[0].expires_at;assert.ok(renewedExpiry-firstExpiry>29*86400000);
  await client.query("UPDATE access_grants SET expires_at=now()-interval '1 minute' WHERE user_id=$1 AND product_id=$2",[user.id,monthly.id]);
  await request('/courses/'+monthlyOnlyCourse.id+'/start',{method:'POST',status:403});
  const account=await request('/commerce/account');assert.ok(!account.access.some(a=>String(a.productId)===String(monthly.id)));
  console.log('Manual payment and subscription flow verified: '+checks+' API checks; owner-only review, private proof, exact PKR prices, scoped permanent grants, 30-day all-access renewal, and expiry enforcement. All fixtures rolled back.');
}finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  pool.query=originalQuery;pool.connect=originalConnect;
  await client.query('ROLLBACK');client.release();await pool.end();
}
