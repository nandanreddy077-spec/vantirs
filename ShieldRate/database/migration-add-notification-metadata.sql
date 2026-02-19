-- Migration: Add notification_metadata column to disputes table
-- Required for Manual Override Circuit (validation failure notifications)

ALTER TABLE disputes 
  ADD COLUMN IF NOT EXISTS notification_metadata JSONB;

-- Document valid status values including 'needs_attention'
-- Status values: 
--   'open' - Dispute is open
--   'won' - Dispute was won
--   'lost' - Dispute was lost
--   'warning_needs_response' - Evidence submitted, awaiting response
--   'warning_closed' - Dispute closed
--   'warning_under_review' - Under review by bank
--   'needs_attention' - Validation failed, requires manual review

-- Add index for needs_attention disputes (for fast filtering)
CREATE INDEX IF NOT EXISTS idx_disputes_needs_attention ON disputes(status) 
  WHERE status = 'needs_attention';










