BEGIN;
CREATE TABLE manual_payment_methods (
 id SERIAL PRIMARY KEY, name VARCHAR(80) NOT NULL, account_title VARCHAR(120) NOT NULL,
 account_number VARCHAR(80) NOT NULL, instructions VARCHAR(1000) NOT NULL DEFAULT '',
 enabled BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE manual_payment_submissions (
 id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id),
 method_id INTEGER NOT NULL REFERENCES manual_payment_methods(id),
 destination JSONB NOT NULL, reference VARCHAR(120) NOT NULL,
 amount_minor BIGINT NOT NULL CHECK(amount_minor>0), paid_date DATE NOT NULL,
 proof BYTEA NOT NULL CHECK(octet_length(proof) BETWEEN 8 AND 614400),
 proof_type VARCHAR(30) NOT NULL CHECK(proof_type IN ('image/png','image/jpeg')),
 proof_hash CHAR(64) NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','approved','rejected','needs_information')),
 review_note VARCHAR(1000) NOT NULL DEFAULT '', reviewed_by BIGINT REFERENCES users(id),
 reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(method_id,reference), UNIQUE(proof_hash)
);
CREATE UNIQUE INDEX manual_payment_one_pending ON manual_payment_submissions(order_id) WHERE status='pending';
CREATE INDEX manual_payment_order ON manual_payment_submissions(order_id,id DESC);
COMMIT;
