import { pool } from "../config/db.js";

export async function withContentAccess(items,userId,type,idKey="id") {
  if (!items.length) return items;
  const result=await pool.query(`SELECT entity.id,
    EXISTS(SELECT 1 FROM premium_content_rules r WHERE r.entity_type=$2 AND r.entity_id=entity.id) AS is_premium,
    (EXISTS(SELECT 1 FROM users u WHERE u.id=$1 AND u.role='admin' AND u.deleted_at IS NULL)
      OR NOT EXISTS(SELECT 1 FROM premium_content_rules r WHERE r.entity_type=$2 AND r.entity_id=entity.id)
      OR EXISTS(SELECT 1 FROM premium_content_rules r JOIN access_grants g ON g.product_id=r.product_id
        AND g.user_id=$1 AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>now()) WHERE r.entity_type=$2 AND r.entity_id=entity.id)) AS has_access,
    COALESCE((SELECT json_agg(json_build_object('id',p.id,'name',p.name) ORDER BY pp.amount_minor,p.name)
      FROM premium_content_rules r JOIN products p ON p.id=r.product_id AND p.status='active'
      JOIN product_prices pp ON pp.product_id=p.id AND pp.currency='USD' AND pp.is_active=TRUE
      WHERE r.entity_type=$2 AND r.entity_id=entity.id),'[]') AS required_products
    FROM unnest($3::bigint[]) AS entity(id)`,[userId,type,items.map(item=>item[idKey])]);
  const byId=new Map(result.rows.map(row=>[String(row.id),row]));
  return items.map(item=>{const access=byId.get(String(item[idKey]));return {...item,
    isPremium:Boolean(item.isPremium||access?.is_premium),hasAccess:access?.has_access===true,
    requiredProducts:access?.required_products||[]};});
}
