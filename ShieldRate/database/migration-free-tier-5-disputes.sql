-- Migration: Early user free tier = 5 disputes (was 2)
-- Run after migration-add-subscription-plans.sql

-- Update existing free-plan merchants to 5 dispute limit
UPDATE merchants
SET disputes_limit = 5
WHERE plan = 'free' AND (disputes_limit IS NULL OR disputes_limit < 5);

-- Ensure default for new rows is 5 (if column default is still 2, alter it)
ALTER TABLE merchants
  ALTER COLUMN disputes_limit SET DEFAULT 5;

COMMENT ON COLUMN merchants.disputes_limit IS 'Dispute limit: 5 for free (early user), 25 starter, 100 professional, NULL enterprise';
