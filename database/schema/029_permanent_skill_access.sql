BEGIN;

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT, status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK(status IN('draft','active','archived')),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS product_skills (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  PRIMARY KEY(product_id,skill_id)
);
CREATE TABLE IF NOT EXISTS product_prices (
  id BIGSERIAL PRIMARY KEY, product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  currency CHAR(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'), amount_minor BIGINT NOT NULL CHECK(amount_minor BETWEEN 0 AND 1000000000),
  is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id,currency)
);
CREATE TABLE IF NOT EXISTS discounts (
  id BIGSERIAL PRIMARY KEY, code VARCHAR(40) NOT NULL UNIQUE CHECK(code ~ '^[A-Z0-9_-]{3,40}$'),
  percent_off SMALLINT CHECK(percent_off BETWEEN 1 AND 100), amount_off_minor BIGINT CHECK(amount_off_minor BETWEEN 1 AND 1000000000),
  currency CHAR(3) CHECK(currency IS NULL OR currency ~ '^[A-Z]{3}$'), is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, max_redemptions INTEGER CHECK(max_redemptions IS NULL OR max_redemptions > 0),
  redemption_count INTEGER NOT NULL DEFAULT 0 CHECK(redemption_count >= 0),
  CHECK((percent_off IS NOT NULL)::int + (amount_off_minor IS NOT NULL)::int = 1),
  CHECK(amount_off_minor IS NULL OR currency IS NOT NULL), CHECK(ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN('pending','paid','cancelled','refunded','disputed')),
  currency CHAR(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'), subtotal_minor BIGINT NOT NULL CHECK(subtotal_minor >= 0),
  discount_minor BIGINT NOT NULL DEFAULT 0 CHECK(discount_minor >= 0), total_minor BIGINT NOT NULL CHECK(total_minor >= 0),
  discount_id BIGINT REFERENCES discounts(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(total_minor = subtotal_minor - discount_minor AND discount_minor <= subtotal_minor)
);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT, product_name_snapshot VARCHAR(200) NOT NULL,
  unit_amount_minor BIGINT NOT NULL CHECK(unit_amount_minor >= 0), currency CHAR(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
  UNIQUE(order_id,product_id)
);
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider VARCHAR(40) NOT NULL DEFAULT 'unconfigured', status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN('pending','paid','failed','refunded','disputed')),
  provider_reference VARCHAR(200), amount_minor BIGINT NOT NULL, currency CHAR(3) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS access_grants (
  id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT, source VARCHAR(30) NOT NULL CHECK(source IN('purchase','legacy','administrative')),
  source_order_id BIGINT REFERENCES orders(id) ON DELETE RESTRICT, granted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(), revoked_at TIMESTAMPTZ, revocation_reason TEXT,
  UNIQUE(user_id,product_id), CHECK(source <> 'purchase' OR source_order_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_access_grants_user_active ON access_grants(user_id,product_id) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS premium_content_rules (
  id BIGSERIAL PRIMARY KEY, entity_type VARCHAR(24) NOT NULL CHECK(entity_type IN('course','quiz','project','certificate')),
  entity_id BIGINT NOT NULL, product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(entity_type,entity_id,product_id)
);

CREATE OR REPLACE FUNCTION protect_order_amounts() RETURNS trigger AS $$ BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.currency IS DISTINCT FROM OLD.currency OR NEW.subtotal_minor IS DISTINCT FROM OLD.subtotal_minor
    OR NEW.discount_minor IS DISTINCT FROM OLD.discount_minor OR NEW.total_minor IS DISTINCT FROM OLD.total_minor OR NEW.discount_id IS DISTINCT FROM OLD.discount_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Order financial snapshots are immutable'; END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION prevent_order_item_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'Order items are immutable'; END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_order_amounts_immutable ON orders; CREATE TRIGGER trg_order_amounts_immutable BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION protect_order_amounts();
DROP TRIGGER IF EXISTS trg_order_items_immutable ON order_items; CREATE TRIGGER trg_order_items_immutable BEFORE UPDATE OR DELETE ON order_items FOR EACH ROW EXECUTE FUNCTION prevent_order_item_mutation();

-- Preserve access for users already enrolled in premium courses. One inactive
-- skill product is created per affected skill; administrators set prices and activate it later.
INSERT INTO products(name,slug,description,status)
SELECT s.name||' permanent access','legacy-skill-'||s.id,'Permanent access to premium SkillForge content for this skill.','draft'
FROM skills s WHERE EXISTS(SELECT 1 FROM courses c WHERE c.skill_id=s.id AND c.is_premium=TRUE)
ON CONFLICT(slug) DO NOTHING;
INSERT INTO product_skills(product_id,skill_id)
SELECT p.id,s.id FROM skills s JOIN products p ON p.slug='legacy-skill-'||s.id
ON CONFLICT DO NOTHING;
INSERT INTO premium_content_rules(entity_type,entity_id,product_id)
SELECT 'course',c.id,p.id FROM courses c JOIN products p ON p.slug='legacy-skill-'||c.skill_id WHERE c.is_premium=TRUE
ON CONFLICT DO NOTHING;
INSERT INTO access_grants(user_id,product_id,source)
SELECT DISTINCT ce.user_id,p.id,'legacy' FROM course_enrollments ce JOIN courses c ON c.id=ce.course_id JOIN products p ON p.slug='legacy-skill-'||c.skill_id WHERE c.is_premium=TRUE
ON CONFLICT(user_id,product_id) DO NOTHING;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products; CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders; CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments; CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
