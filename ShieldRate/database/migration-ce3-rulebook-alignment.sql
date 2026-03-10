-- Migration: CE 3.0 Rulebook Alignment
-- Adds columns to track per-dispute CE 3.0 eligibility details so we can see
-- exactly WHY a dispute was or was not eligible for liability shift.

-- New boolean columns for the three sub-checks that compose liability_shift_eligible
ALTER TABLE disputes
    ADD COLUMN IF NOT EXISTS reason_code_eligible BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS billing_descriptor_match BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS identifier_consistent BOOLEAN DEFAULT TRUE;

-- JSONB array storing human-readable reasons when a dispute fails CE 3.0 checks
-- e.g. ['reason_code_not_10.4', 'billing_descriptor_mismatch']
ALTER TABLE disputes
    ADD COLUMN IF NOT EXISTS ineligibility_reasons JSONB DEFAULT '[]'::jsonb;

-- Backfill: existing disputes that were already marked ineligible but lack the new columns
-- will keep the defaults (true / empty array). Only new disputes going forward get the
-- detailed breakdown. This is intentional -- we don't want to retroactively change history.
