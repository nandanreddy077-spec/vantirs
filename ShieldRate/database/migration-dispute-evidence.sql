-- Merchant-provided evidence for consumer/authorization/processing disputes.
-- Each row stores supplementary data that the evidence engines pull from.

CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Consumer / product evidence
  shipping_tracking_number TEXT,
  shipping_carrier TEXT,
  shipping_date TEXT,          -- ISO date string
  product_description TEXT,
  refund_policy TEXT,
  refund_policy_disclosure TEXT,
  service_documentation TEXT,

  -- Authorization evidence
  receipt TEXT,

  -- Processing / cancellation evidence
  duplicate_charge_explanation TEXT,
  duplicate_charge_id TEXT,
  cancellation_policy TEXT,
  cancellation_policy_disclosure TEXT,
  cancellation_rebuttal TEXT,

  -- Shared
  customer_communication TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT uq_dispute_evidence_dispute UNIQUE (dispute_id)
);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_merchant ON dispute_evidence(merchant_id);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute ON dispute_evidence(dispute_id);
