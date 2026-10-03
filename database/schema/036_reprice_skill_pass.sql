BEGIN;

-- Approved launch-price reduction. Existing order snapshots remain immutable;
-- this affects only orders created after the new catalog price is active.
UPDATE product_prices pp
SET amount_minor=1800, is_active=TRUE
FROM products p
WHERE pp.product_id=p.id AND p.slug='react-skill-pass' AND pp.currency='USD';

COMMIT;
