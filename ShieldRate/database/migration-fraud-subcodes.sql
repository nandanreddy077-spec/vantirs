-- Store the Visa network-level reason code and derived fraud sub-code.
-- network_reason_code: raw value from Stripe (e.g. "10.4", "13.1")
-- fraud_sub_code: our derived classification for fraud disputes

ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS network_reason_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS fraud_sub_code VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_disputes_network_reason ON disputes(network_reason_code);
CREATE INDEX IF NOT EXISTS idx_disputes_fraud_sub ON disputes(fraud_sub_code);
