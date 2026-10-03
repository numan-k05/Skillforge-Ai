BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(30);
ALTER TABLE products ADD COLUMN IF NOT EXISTS access_duration_days SMALLINT;
UPDATE products SET product_type=CASE
  WHEN slug LIKE '%-career-bundle' THEN 'career_bundle'
  ELSE 'skill_pass'
END WHERE product_type IS NULL;
ALTER TABLE products ALTER COLUMN product_type SET NOT NULL;
ALTER TABLE products ALTER COLUMN product_type SET DEFAULT 'skill_pass';
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE products ADD CONSTRAINT products_product_type_check
  CHECK(product_type IN('skill_pass','career_bundle','subscription'));
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_access_duration_check;
ALTER TABLE products ADD CONSTRAINT products_access_duration_check CHECK(
  (product_type='subscription' AND access_duration_days BETWEEN 1 AND 366)
  OR (product_type<>'subscription' AND access_duration_days IS NULL)
);

ALTER TABLE access_grants ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_access_grants_user_expiry
  ON access_grants(user_id,product_id,expires_at) WHERE revoked_at IS NULL;

INSERT INTO products(name,slug,description,status,product_type,access_duration_days)
VALUES('SkillForge Pro Monthly','skillforge-pro-monthly',
  'Thirty days of access to every currently published Skill Pass and Career Bundle. Renew manually to extend access; there is no automatic charge.',
  'active','subscription',30)
ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,
  status='active',product_type='subscription',access_duration_days=30;

INSERT INTO product_prices(product_id,currency,amount_minor,is_active)
SELECT id,'PKR',64900,TRUE FROM products WHERE slug='skillforge-pro-monthly'
ON CONFLICT(product_id,currency) DO UPDATE SET amount_minor=64900,is_active=TRUE;
-- Retain the existing displayed USD reference price for internal compatibility;
-- customer checkout and marketing use the authoritative PKR manual price.
INSERT INTO product_prices(product_id,currency,amount_minor,is_active)
SELECT id,'USD',799,TRUE FROM products WHERE slug='skillforge-pro-monthly'
ON CONFLICT(product_id,currency) DO UPDATE SET is_active=TRUE;

INSERT INTO product_skills(product_id,skill_id)
SELECT monthly.id,ps.skill_id FROM products monthly
JOIN products component ON component.product_type='skill_pass' AND component.status='active'
JOIN product_skills ps ON ps.product_id=component.id
WHERE monthly.slug='skillforge-pro-monthly'
ON CONFLICT DO NOTHING;

INSERT INTO premium_content_rules(entity_type,entity_id,product_id)
SELECT DISTINCT r.entity_type,r.entity_id,monthly.id
FROM premium_content_rules r
JOIN products source ON source.id=r.product_id AND source.status='active'
CROSS JOIN products monthly
WHERE monthly.slug='skillforge-pro-monthly' AND source.id<>monthly.id
ON CONFLICT(entity_type,entity_id,product_id) DO NOTHING;

COMMIT;
