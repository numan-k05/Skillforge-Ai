BEGIN;
-- Publish the eight completed products for selection and sandbox checkout.
-- Production payments remain disabled by the payment service.
UPDATE products SET status='active' WHERE slug IN (
  'javascript-skill-pass','python-skill-pass','sql-skill-pass','react-skill-pass',
  'nodejs-skill-pass','git-skill-pass','data-structures-algorithms-skill-pass','html-css-skill-pass'
);
COMMIT;
