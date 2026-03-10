-- Migration: Add Binary Checklist Fields to Disputes Table
-- Run this after the initial schema to add new binary fields

-- Add new columns for binary checklist
ALTER TABLE disputes 
  ADD COLUMN IF NOT EXISTS liability_shift_eligible BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS historical_match_found BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS usage_audit_attached BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS card_network VARCHAR(20) DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS match_count INTEGER DEFAULT 0;

-- Migrate existing data: Set binary flags based on existing v_compliance_score
UPDATE disputes
SET 
  liability_shift_eligible = CASE WHEN v_compliance_score = 100 THEN TRUE ELSE FALSE END,
  historical_match_found = CASE WHEN v_compliance_score >= 50 THEN TRUE ELSE FALSE END,
  usage_audit_attached = CASE WHEN v_compliance_score > 0 THEN TRUE ELSE FALSE END
WHERE liability_shift_eligible IS NULL;

-- Create index for faster queries on liability shift eligible disputes
CREATE INDEX IF NOT EXISTS idx_disputes_liability_shift ON disputes(liability_shift_eligible) WHERE liability_shift_eligible = TRUE;
CREATE INDEX IF NOT EXISTS idx_disputes_card_network ON disputes(card_network);












