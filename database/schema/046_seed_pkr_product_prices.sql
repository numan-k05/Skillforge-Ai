BEGIN;

-- Manual checkout uses these authoritative PKR prices. Keep the historical
-- USD rows for compatibility with earlier quotes and receipts.
INSERT INTO product_prices(product_id, currency, amount_minor, is_active)
SELECT id, 'PKR', 99900, TRUE
FROM products
WHERE product_type = 'skill_pass' AND status = 'active'
ON CONFLICT(product_id, currency)
DO UPDATE SET amount_minor = EXCLUDED.amount_minor, is_active = TRUE;

INSERT INTO product_prices(product_id, currency, amount_minor, is_active)
SELECT id, 'PKR', 199900, TRUE
FROM products
WHERE product_type = 'career_bundle' AND status = 'active'
ON CONFLICT(product_id, currency)
DO UPDATE SET amount_minor = EXCLUDED.amount_minor, is_active = TRUE;

COMMIT;
