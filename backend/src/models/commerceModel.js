import { pool } from "../config/db.js";
export async function catalog(currency,userId=null){const r=await pool.query(`SELECT p.id,p.name,p.slug,p.description,p.product_type,p.access_duration_days,pp.currency,pp.amount_minor,
  (SELECT amount_minor FROM product_prices WHERE product_id=p.id AND currency='PKR' AND is_active=TRUE) manual_amount_minor,
  EXISTS(SELECT 1 FROM manual_payment_methods WHERE enabled=TRUE) manual_enabled,
  COALESCE((SELECT SUM(component.amount_minor) FROM (
    SELECT bundle_skill.skill_id,MIN(component_price.amount_minor) AS amount_minor
    FROM product_skills bundle_skill
    JOIN product_skills component_skill ON component_skill.skill_id=bundle_skill.skill_id
    JOIN products component_product ON component_product.id=component_skill.product_id
      AND component_product.slug LIKE '%-skill-pass'
    JOIN product_prices component_price ON component_price.product_id=component_product.id
      AND component_price.currency=pp.currency AND component_price.is_active=TRUE
    WHERE bundle_skill.product_id=p.id
      AND (SELECT COUNT(*) FROM product_skills one_skill WHERE one_skill.product_id=component_product.id)=1
    GROUP BY bundle_skill.skill_id
  ) component),pp.amount_minor) AS individual_value_minor,
  COALESCE(json_agg(json_build_object('id',s.id,'name',s.name) ORDER BY s.name) FILTER(WHERE s.id IS NOT NULL),'[]') AS skills,
  CASE WHEN $2::bigint IS NULL THEN FALSE ELSE
    EXISTS(SELECT 1 FROM users u WHERE u.id=$2 AND u.role='admin' AND u.deleted_at IS NULL)
    OR EXISTS(SELECT 1 FROM access_grants g WHERE g.user_id=$2 AND g.product_id=p.id AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>now()))
  END AS has_access,
  COALESCE((SELECT json_agg(json_build_object('id',c.id,'title',c.title,'skillId',c.skill_id) ORDER BY c.title)
    FROM premium_content_rules r JOIN courses c ON c.id=r.entity_id WHERE r.product_id=p.id AND r.entity_type='course'),'[]') AS courses,
  COALESCE((SELECT json_agg(json_build_object('id',q.id,'title',q.title) ORDER BY q.title)
    FROM premium_content_rules r JOIN quizzes q ON q.id=r.entity_id WHERE r.product_id=p.id AND r.entity_type='quiz'),'[]') AS assessments,
  COALESCE((SELECT json_agg(json_build_object('id',pr.id,'title',pr.title) ORDER BY pr.title)
    FROM premium_content_rules r JOIN projects pr ON pr.id=r.entity_id WHERE r.product_id=p.id AND r.entity_type='project'),'[]') AS projects,
  COALESCE((SELECT json_agg(json_build_object('id',d.id,'title',d.title) ORDER BY d.title)
    FROM premium_content_rules r JOIN certificate_definitions d ON d.id=r.entity_id WHERE r.product_id=p.id AND r.entity_type='certificate'),'[]') AS certificates
  FROM products p JOIN product_prices pp ON pp.product_id=p.id AND pp.is_active=TRUE
  LEFT JOIN product_skills ps ON ps.product_id=p.id LEFT JOIN skills s ON s.id=ps.skill_id
  WHERE p.status='active' AND pp.currency=$1 GROUP BY p.id,pp.currency,pp.amount_minor ORDER BY p.name`,[currency,userId]);return r.rows;}
export async function accessProducts(type,id,currency='USD'){const r=await pool.query(`SELECT p.id,p.name,p.slug,p.product_type,pp.currency,pp.amount_minor
  FROM premium_content_rules rules JOIN products p ON p.id=rules.product_id AND p.status='active'
  JOIN product_prices pp ON pp.product_id=p.id AND pp.currency=$3 AND pp.is_active=TRUE
  WHERE rules.entity_type=$1 AND rules.entity_id=$2 ORDER BY
    CASE WHEN p.slug LIKE '%-skill-pass' THEN 0 ELSE 1 END,pp.amount_minor,p.name`,[type,id,currency]);return r.rows;}
export async function discount(code,currency){if(!code)return null;const r=await pool.query(`SELECT * FROM discounts WHERE code=$1 AND is_active=TRUE AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>now()) AND (max_redemptions IS NULL OR redemption_count<max_redemptions) AND (currency IS NULL OR currency=$2)`,[code,currency]);return r.rows[0]||null;}
export async function productsForOrder(ids,currency,client=pool){const r=await client.query(`SELECT p.id,p.name,pp.amount_minor,pp.currency FROM products p JOIN product_prices pp ON pp.product_id=p.id AND pp.is_active=TRUE WHERE p.status='active' AND p.id=ANY($1::bigint[]) AND pp.currency=$2 ORDER BY p.id FOR SHARE OF p,pp`,[ids,currency]);return r.rows;}
export async function createOrder(userId,ids,currency,code){const client=await pool.connect();try{await client.query("BEGIN");const products=await productsForOrder(ids,currency,client);if(products.length!==ids.length){await client.query("ROLLBACK");return{unavailable:true};}let discountRow=null;if(code){const r=await client.query(`SELECT * FROM discounts WHERE code=$1 AND is_active=TRUE AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>now()) AND (max_redemptions IS NULL OR redemption_count<max_redemptions) AND (currency IS NULL OR currency=$2) FOR UPDATE`,[code,currency]);discountRow=r.rows[0];if(!discountRow){await client.query("ROLLBACK");return{invalidDiscount:true};}}const subtotal=products.reduce((sum,p)=>sum+Number(p.amount_minor),0);const off=discountRow?Math.min(subtotal,discountRow.percent_off?Math.floor(subtotal*discountRow.percent_off/100):Number(discountRow.amount_off_minor)):0;const order=await client.query(`INSERT INTO orders(user_id,currency,subtotal_minor,discount_minor,total_minor,discount_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[userId,currency,subtotal,off,subtotal-off,discountRow?.id||null]);for(const product of products)await client.query(`INSERT INTO order_items(order_id,product_id,product_name_snapshot,unit_amount_minor,currency) VALUES($1,$2,$3,$4,$5)`,[order.rows[0].id,product.id,product.name,product.amount_minor,currency]);if(discountRow)await client.query(`UPDATE discounts SET redemption_count=redemption_count+1 WHERE id=$1`,[discountRow.id]);await client.query("COMMIT");return{order:order.rows[0],items:products};}catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}}
export async function history(userId){const r=await pool.query(`SELECT o.*,COALESCE(json_agg(json_build_object('productId',i.product_id,'name',i.product_name_snapshot,'amountMinor',i.unit_amount_minor) ORDER BY i.id),'[]') AS items FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.created_at DESC`,[userId]);return r.rows;}
export async function grants(userId){const r=await pool.query(`SELECT grant_row.id,p.id AS product_id,
  CASE WHEN u.role='admin' THEN 'owner_admin' ELSE grant_row.source END AS source,
  CASE WHEN u.role='admin' THEN u.created_at ELSE grant_row.granted_at END AS granted_at,
  CASE WHEN u.role='admin' THEN NULL ELSE grant_row.expires_at END AS expires_at,
  p.name,p.slug,p.product_type
  FROM users u CROSS JOIN products p
  LEFT JOIN LATERAL (
    SELECT g.id,g.source,g.granted_at,g.expires_at FROM access_grants g
    WHERE g.user_id=u.id AND g.product_id=p.id AND g.revoked_at IS NULL
      AND (g.expires_at IS NULL OR g.expires_at>now())
    ORDER BY g.granted_at DESC LIMIT 1
  ) grant_row ON TRUE
  WHERE u.id=$1 AND u.deleted_at IS NULL AND p.status='active'
    AND (u.role='admin' OR grant_row.id IS NOT NULL)
  ORDER BY CASE WHEN u.role='admin' THEN p.name END,grant_row.granted_at DESC`,[userId]);return r.rows;}
export async function hasEntityAccess(userId,type,id){const r=await pool.query(`SELECT
  EXISTS(SELECT 1 FROM users u WHERE u.id=$1 AND u.role='admin' AND u.deleted_at IS NULL)
  OR NOT EXISTS(SELECT 1 FROM premium_content_rules r WHERE r.entity_type=$2 AND r.entity_id=$3)
  OR EXISTS(SELECT 1 FROM premium_content_rules r JOIN access_grants g ON g.product_id=r.product_id AND g.user_id=$1 AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>now()) WHERE r.entity_type=$2 AND r.entity_id=$3)
  AS allowed`,[userId,type,id]);return r.rows[0]?.allowed===true;}
export async function hasLessonAccess(userId,lessonId){const r=await pool.query(`SELECT
  EXISTS(SELECT 1 FROM users u WHERE u.id=$1 AND u.role='admin' AND u.deleted_at IS NULL)
  OR NOT EXISTS(SELECT 1 FROM course_lessons l JOIN course_modules m ON m.id=l.module_id JOIN premium_content_rules r ON r.entity_type='course' AND r.entity_id=m.course_id WHERE l.id=$2)
  OR EXISTS(SELECT 1 FROM course_lessons l JOIN course_modules m ON m.id=l.module_id JOIN premium_content_rules r ON r.entity_type='course' AND r.entity_id=m.course_id JOIN access_grants g ON g.product_id=r.product_id AND g.user_id=$1 AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>now()) WHERE l.id=$2)
  AS allowed`,[userId,lessonId]);return r.rows[0]?.allowed===true;}
export async function adminProducts(){const r=await pool.query(`SELECT p.*,COALESCE((SELECT json_agg(json_build_object('currency',currency,'amountMinor',amount_minor,'isActive',is_active) ORDER BY currency) FROM product_prices WHERE product_id=p.id),'[]') prices,COALESCE((SELECT json_agg(skill_id ORDER BY skill_id) FROM product_skills WHERE product_id=p.id),'[]') skill_ids FROM products p ORDER BY p.updated_at DESC`);return r.rows;}
export async function createProduct(actor,data){const client=await pool.connect();try{await client.query("BEGIN");const r=await client.query(`INSERT INTO products(name,slug,description,status,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *`,[data.name,data.slug,data.description??null,data.status,actor]);for(const id of data.skillIds)await client.query(`INSERT INTO product_skills(product_id,skill_id) VALUES($1,$2)`,[r.rows[0].id,id]);for(const price of data.prices)await client.query(`INSERT INTO product_prices(product_id,currency,amount_minor) VALUES($1,$2,$3)`,[r.rows[0].id,price.currency,price.amountMinor]);for(const rule of data.contentRules)await client.query(`INSERT INTO premium_content_rules(entity_type,entity_id,product_id) VALUES($1,$2,$3)`,[rule.entityType,rule.entityId,r.rows[0].id]);await client.query(`INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata) VALUES($1,'product.created','product',$2,$3::jsonb)`,[actor,r.rows[0].id,JSON.stringify({slug:data.slug})]);await client.query("COMMIT");return r.rows[0];}catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}}
export async function updateProduct(actor,id,data){const client=await pool.connect();try{await client.query("BEGIN");const r=await client.query(`UPDATE products SET name=$2,slug=$3,description=$4,status=$5 WHERE id=$1 RETURNING *`,[id,data.name,data.slug,data.description??null,data.status]);if(!r.rows[0]){await client.query("ROLLBACK");return null;}await client.query(`DELETE FROM product_skills WHERE product_id=$1`,[id]);await client.query(`DELETE FROM product_prices WHERE product_id=$1`,[id]);await client.query(`DELETE FROM premium_content_rules WHERE product_id=$1`,[id]);for(const skillId of data.skillIds)await client.query(`INSERT INTO product_skills(product_id,skill_id) VALUES($1,$2)`,[id,skillId]);for(const price of data.prices)await client.query(`INSERT INTO product_prices(product_id,currency,amount_minor) VALUES($1,$2,$3)`,[id,price.currency,price.amountMinor]);for(const rule of data.contentRules)await client.query(`INSERT INTO premium_content_rules(entity_type,entity_id,product_id) VALUES($1,$2,$3)`,[rule.entityType,rule.entityId,id]);await client.query(`INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata) VALUES($1,'product.updated','product',$2,$3::jsonb)`,[actor,id,JSON.stringify({slug:data.slug})]);await client.query("COMMIT");return r.rows[0];}catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}}
export default{catalog,accessProducts,discount,productsForOrder,createOrder,history,grants,hasEntityAccess,hasLessonAccess,adminProducts,createProduct,updateProduct};
