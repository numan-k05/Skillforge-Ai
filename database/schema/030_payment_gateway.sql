BEGIN;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider_event_id VARCHAR(200),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_reference ON payments(provider,provider_reference) WHERE provider_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_order ON payments(order_id);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(40) NOT NULL,
  provider_event_id VARCHAR(200) NOT NULL,
  event_type VARCHAR(40) NOT NULL,
  payload_sha256 CHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  processing_status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK(processing_status IN('received','processed','rejected')),
  error_code VARCHAR(80),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE(provider,provider_event_id)
);
CREATE TABLE IF NOT EXISTS payment_status_history (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  from_status VARCHAR(20), to_status VARCHAR(20) NOT NULL CHECK(to_status IN('pending','paid','failed','refunded','disputed')),
  webhook_event_id BIGINT REFERENCES payment_webhook_events(id) ON DELETE RESTRICT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS receipts (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  payment_id BIGINT NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_events_received ON payment_webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment ON payment_status_history(payment_id,occurred_at,id);

COMMIT;
