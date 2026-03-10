-- Migration: Full 10.4 Coverage + CE 3.0 Add-on
-- Adds support for handling ALL 10.4 disputes (not just CE 3.0 eligible)
-- and gates CE 3.0 automation behind a plan add-on.

-- 1. Add ce3_addon flag to merchants
ALTER TABLE merchants
    ADD COLUMN IF NOT EXISTS ce3_addon BOOLEAN DEFAULT FALSE;

-- 2. Add dispute classification and evidence tracking columns
ALTER TABLE disputes
    ADD COLUMN IF NOT EXISTS dispute_category VARCHAR(30) DEFAULT 'fraud_10_4',
    ADD COLUMN IF NOT EXISTS evidence_type VARCHAR(30) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS evidence_submitted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS evidence_submission_type VARCHAR(20);

-- dispute_category: 'fraud_10_4', 'fraud_other', 'authorization', 'processing_error', 'consumer'
-- evidence_type: 'pending', 'ce3_auto', 'regular_10_4', 'manual', 'skipped'
-- evidence_submission_type: 'ce3_auto', 'regular_auto', 'manual', null

-- 3. Index for fast dispute categorization queries
CREATE INDEX IF NOT EXISTS idx_disputes_category ON disputes(dispute_category);
CREATE INDEX IF NOT EXISTS idx_disputes_evidence_type ON disputes(evidence_type);
