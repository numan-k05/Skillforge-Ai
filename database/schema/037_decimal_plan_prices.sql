BEGIN;

-- Use the approved .99 display price for newly created React Skill Pass orders.
-- Existing order snapshots remain unchanged.
UPDATE product_prices pp
SET amount_minor = 1899,
    is_active = TRUE
FROM products p
WHERE pp.product_id = p.id
  AND p.slug = 'react-skill-pass'
  AND pp.currency = 'USD';

COMMIT;
