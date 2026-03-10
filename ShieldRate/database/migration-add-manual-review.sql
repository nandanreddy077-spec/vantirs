-- Migration: Add Manual Review Toggle for High-Value Disputes
-- Elite Feature: Allows merchants to review disputes over $500 before auto-submission

-- Add requires_manual_review flag to disputes table
ALTER TABLE disputes 
    ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN DEFAULT FALSE;

-- Add index for fast lookups of disputes requiring manual review
CREATE INDEX IF NOT EXISTS idx_disputes_manual_review ON disputes(requires_manual_review) 
    WHERE requires_manual_review = TRUE;

-- Add comment explaining the feature
COMMENT ON COLUMN disputes.requires_manual_review IS 
    'If TRUE, dispute requires merchant manual review before auto-submission. Automatically set for disputes over $500.';










