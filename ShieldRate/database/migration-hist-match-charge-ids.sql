-- Migration: Store CE 3.0 matched charge IDs on disputes
-- Ensures PDF evidence triad shows the exact two historical transactions that qualified for liability shift

ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS hist_match_charge_id_1 TEXT,
  ADD COLUMN IF NOT EXISTS hist_match_charge_id_2 TEXT;

COMMENT ON COLUMN disputes.hist_match_charge_id_1 IS 'Stripe charge ID of first historical match (120-365 days, IP/device match)';
COMMENT ON COLUMN disputes.hist_match_charge_id_2 IS 'Stripe charge ID of second historical match for CE 3.0 triad';

CREATE INDEX IF NOT EXISTS idx_disputes_hist_match_1 ON disputes(hist_match_charge_id_1) WHERE hist_match_charge_id_1 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_disputes_hist_match_2 ON disputes(hist_match_charge_id_2) WHERE hist_match_charge_id_2 IS NOT NULL;
