BEGIN;
CREATE TABLE manual_payment_revisions (
 id BIGSERIAL PRIMARY KEY, submission_id BIGINT NOT NULL REFERENCES manual_payment_submissions(id),
 reference VARCHAR(120) NOT NULL, proof BYTEA NOT NULL, proof_type VARCHAR(30) NOT NULL,
 proof_hash CHAR(64) NOT NULL, review_note VARCHAR(1000) NOT NULL, status VARCHAR(30) NOT NULL,
 archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;
