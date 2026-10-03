import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireOwnerAdmin } from '../middleware/ownerAdmin.js';
import { ApiError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { applyEntitlementEffects } from '../models/paymentModel.js';

const r = Router();
const id = z.coerce.number().int().positive();
const parse = (schema, value) => { const result = schema.safeParse(value); if (!result.success) throw new ApiError(400, 'Please check the payment details and try again.'); return result.data; };
const proofSchema = z.object({ methodId: id, reference: z.string().trim().min(4).max(120).regex(/^[a-zA-Z0-9 -]+$/), amountMinor: z.number().int().positive(), paidDate: z.iso.date(), image: z.string().max(819200), mime: z.enum(['image/png','image/jpeg']) });
export function decodeProof(image, mime) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(image)) throw new ApiError(400, 'Invalid screenshot.');
  const bytes = Buffer.from(image, 'base64');
  const valid = mime === 'image/png' ? bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')) : bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
  if (!valid || bytes.length > 614400 || bytes.length < 8) throw new ApiError(400, 'Upload a PNG or JPEG screenshot up to 600 KB.');
  return bytes;
}
async function transaction(fn) {
  const c = await pool.connect();
  try { await c.query('BEGIN'); const value = await fn(c); await c.query('COMMIT'); return value; }
  catch (e) { await c.query('ROLLBACK'); if (e.code==='23505') throw new ApiError(409,'This transaction reference or screenshot has already been submitted. Check your existing order.'); throw e; }
  finally { c.release(); }
}
async function audit(c, actor, action, entityId, metadata={}) {
  await c.query("INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'manual_payment',$3,$4::jsonb)",[actor,action,entityId,JSON.stringify(metadata)]);
}
r.use(requireAuth);
r.get('/orders/:id', asyncHandler(async (req,res) => {
  const orderId=parse(id,req.params.id);
  const order=(await pool.query('SELECT id,status,currency,total_minor FROM orders WHERE id=$1 AND user_id=$2',[orderId,req.user.id])).rows[0];
  if (!order) throw new ApiError(404,'Order not found.');
  const methods=(await pool.query('SELECT * FROM manual_payment_methods WHERE enabled=TRUE ORDER BY id')).rows;
  const submissions=(await pool.query('SELECT id,status,reference,amount_minor,paid_date,review_note,created_at,destination FROM manual_payment_submissions WHERE order_id=$1 ORDER BY id DESC',[orderId])).rows;
  res.json({order,methods,submissions});
}));
r.post('/orders/:id/proof', rateLimit({windowMs:3600000,max:12,standardHeaders:true,legacyHeaders:false,message:{error:{message:'Too many proof submissions. Please try again later.'}}}), asyncHandler(async(req,res)=>{
  const orderId=parse(id,req.params.id), data=parse(proofSchema,req.body), bytes=decodeProof(data.image,data.mime);
  if (data.paidDate > new Date().toISOString().slice(0,10)) throw new ApiError(400,'Payment date cannot be in the future.');
  const result=await transaction(async c=>{
    const order=(await c.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE',[orderId,req.user.id])).rows[0];
    if (!order) throw new ApiError(404,'Order not found.');
    if(order.status!=='pending' || order.currency!=='PKR') throw new ApiError(409,'Only pending PKR orders accept manual payment.');
    if(Number(order.total_minor)!==data.amountMinor) throw new ApiError(400,'The transferred amount must match the order total.');
    const method=(await c.query('SELECT * FROM manual_payment_methods WHERE id=$1 AND enabled=TRUE FOR SHARE',[data.methodId])).rows[0];
    if(!method) throw new ApiError(409,'This payment method is unavailable.');
    if((await c.query("SELECT id FROM manual_payment_submissions WHERE order_id=$1 AND status='pending'",[orderId])).rows.length) throw new ApiError(409,'Your payment is already awaiting review.');
    const reference=data.reference.replace(/[ -]/g,'').toUpperCase();
    if(reference.length<4) throw new ApiError(400,'Enter a valid transaction reference.');
    const hash=createHash('sha256').update(bytes).digest('hex');
    const reused=(await c.query('SELECT r.id FROM manual_payment_revisions r JOIN manual_payment_submissions s ON s.id=r.submission_id WHERE (r.proof_hash=$1 OR (r.reference=$3 AND s.method_id=$4)) AND s.order_id<>$2 LIMIT 1',[hash,orderId,reference,data.methodId])).rows[0];
    if(reused) throw new ApiError(409,'This screenshot has already been submitted for another order.');
    // A rejected submission can be corrected on the same order without losing its audit history.
    const prior=(await c.query("SELECT id,order_id,status FROM manual_payment_submissions WHERE method_id=$1 AND (reference=$2 OR (order_id=$3 AND status IN ('rejected','needs_information'))) ORDER BY (reference=$2) DESC,id DESC LIMIT 1",[data.methodId,reference,orderId])).rows[0];
    if(prior){
      if(String(prior.order_id)!==String(orderId)||!['rejected','needs_information'].includes(prior.status)) throw new ApiError(409,'This reference was already submitted. Check the existing order.');
      await c.query('INSERT INTO manual_payment_revisions(submission_id,reference,proof,proof_type,proof_hash,review_note,status) SELECT id,reference,proof,proof_type,proof_hash,review_note,status FROM manual_payment_submissions WHERE id=$1',[prior.id]);
      await c.query("UPDATE manual_payment_submissions SET proof=$2,proof_type=$3,proof_hash=$4,paid_date=$5,reference=$6,status='pending',review_note='',reviewed_by=NULL,reviewed_at=NULL WHERE id=$1",[prior.id,bytes,data.mime,hash,data.paidDate,reference]);
      await audit(c,req.user.id,'payment.proof.corrected',prior.id,{orderId});
      return {id:prior.id,status:'pending'};
    }
    const row=(await c.query(`INSERT INTO manual_payment_submissions(order_id,method_id,destination,reference,amount_minor,paid_date,proof,proof_type,proof_hash) VALUES($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9) RETURNING id,status`,[orderId,method.id,JSON.stringify(method),reference,data.amountMinor,data.paidDate,bytes,data.mime,createHash('sha256').update(bytes).digest('hex')])).rows[0];
    await audit(c,req.user.id,'payment.proof.submitted',row.id,{orderId}); return row;
  }); res.status(201).json(result);
}));
r.get('/admin/settings',requireOwnerAdmin,asyncHandler(async(req,res)=>{
  const methods=(await pool.query('SELECT * FROM manual_payment_methods ORDER BY id')).rows;
  const products=(await pool.query("SELECT p.id,p.name,pp.amount_minor FROM products p LEFT JOIN product_prices pp ON pp.product_id=p.id AND pp.currency='PKR' AND pp.is_active=TRUE WHERE p.status='active' ORDER BY p.id")).rows;
  res.json({methods,products});
}));
r.put('/admin/settings',requireOwnerAdmin,asyncHandler(async(req,res)=>{
  const schema=z.object({methods:z.array(z.object({id:id.optional(),name:z.string().trim().min(2).max(80),account_title:z.string().trim().min(2).max(120),account_number:z.string().trim().min(5).max(80),instructions:z.string().max(1000),enabled:z.boolean()})).max(5),prices:z.array(z.object({productId:id,amountMinor:z.number().int().min(1).max(1000000000)})).max(100)});
  const data=parse(schema,req.body);
  await transaction(async c=>{
    for(const m of data.methods){ if(m.id) await c.query('UPDATE manual_payment_methods SET name=$2,account_title=$3,account_number=$4,instructions=$5,enabled=$6 WHERE id=$1',[m.id,m.name,m.account_title,m.account_number,m.instructions,m.enabled]); else await c.query('INSERT INTO manual_payment_methods(name,account_title,account_number,instructions,enabled) VALUES($1,$2,$3,$4,$5)',[m.name,m.account_title,m.account_number,m.instructions,m.enabled]); }
    for(const p of data.prices) await c.query("INSERT INTO product_prices(product_id,currency,amount_minor,is_active) VALUES($1,'PKR',$2,TRUE) ON CONFLICT(product_id,currency) DO UPDATE SET amount_minor=EXCLUDED.amount_minor,is_active=TRUE",[p.productId,p.amountMinor]);
    await audit(c,req.user.id,'payment.settings.updated',null,{productIds:data.prices.map(p=>p.productId)});
  }); res.json({saved:true});
}));
r.get('/admin/submissions',requireOwnerAdmin,asyncHandler(async(req,res)=>{
  const rows=(await pool.query(`SELECT s.id,s.order_id,s.reference,s.amount_minor,s.paid_date,s.status,s.review_note,s.destination,s.created_at,u.email,u.name,o.currency,o.status order_status,(SELECT string_agg(product_name_snapshot,', ') FROM order_items WHERE order_id=o.id) products FROM manual_payment_submissions s JOIN orders o ON o.id=s.order_id JOIN users u ON u.id=o.user_id ORDER BY s.id DESC LIMIT 200`)).rows;
  res.json(rows);
}));
r.get('/admin/submissions/:id/proof',requireOwnerAdmin,asyncHandler(async(req,res)=>{
  const row=(await pool.query('SELECT proof,proof_type FROM manual_payment_submissions WHERE id=$1',[parse(id,req.params.id)])).rows[0];
  if(!row) throw new ApiError(404,'Screenshot not found.');
  res.set('Content-Type',row.proof_type).set('Content-Disposition','inline').set('X-Content-Type-Options','nosniff').send(row.proof);
}));
r.post('/admin/submissions/:id/review',requireOwnerAdmin,asyncHandler(async(req,res)=>{
  const submissionId=parse(id,req.params.id), data=parse(z.object({decision:z.enum(['approved','rejected','needs_information']),note:z.string().trim().max(1000),verified:z.boolean().optional()}),req.body);
  if(data.decision==='approved'&&!data.verified) throw new ApiError(400,'Confirm that you verified the credit in your bank or Easypaisa account.');
  if(data.decision!=='approved'&&!data.note) throw new ApiError(400,'Explain what needs to be corrected.');
  const result=await transaction(async c=>{
    const row=(await c.query('SELECT s.*,o.user_id,o.status order_status,o.total_minor,o.currency FROM manual_payment_submissions s JOIN orders o ON o.id=s.order_id WHERE s.id=$1 FOR UPDATE OF o,s',[submissionId])).rows[0];
    if(!row) throw new ApiError(404,'Submission not found.');
    if(row.status==='approved'&&row.order_status==='paid'&&data.decision==='approved') return {status:'approved'};
    if(row.order_status!=='pending') throw new ApiError(409,'This order is no longer awaiting payment.');
    if(data.decision==='approved'){
      if(Number(row.amount_minor)!==Number(row.total_minor)||row.currency!=='PKR') throw new ApiError(409,'Payment does not match the order.');
      const payment=(await c.query("INSERT INTO payments(order_id,provider,status,provider_reference,amount_minor,currency,paid_at) VALUES($1,'manual','paid',$2,$3,$4,now()) RETURNING id",[row.order_id,`manual_${row.id}`,row.amount_minor,row.currency])).rows[0];
      await c.query("UPDATE orders SET status='paid' WHERE id=$1",[row.order_id]);
      await c.query("UPDATE manual_payment_submissions SET status='rejected',review_note='This order was settled using another submission.',reviewed_by=$3,reviewed_at=now() WHERE order_id=$1 AND id<>$2 AND status='pending'",[row.order_id,row.id,req.user.id]);
      await applyEntitlementEffects(c,{id:payment.id,order_id:row.order_id,user_id:row.user_id},'paid');
      await c.query("INSERT INTO payment_status_history(payment_id,from_status,to_status) VALUES($1,'pending','paid')",[payment.id]);
    }
    await c.query('UPDATE manual_payment_submissions SET status=$2,review_note=$3,reviewed_by=$4,reviewed_at=now() WHERE id=$1',[row.id,data.decision,data.note,req.user.id]);
    await audit(c,req.user.id,`payment.${data.decision}`,row.id,{orderId:row.order_id,note:data.note});
    return {status:data.decision};
  });res.json(result);
}));
export default r;
