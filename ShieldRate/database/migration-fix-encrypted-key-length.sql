-- Fix: Increase column size for encrypted Stripe keys
-- Encrypted values (base64 encoded) can exceed 255 characters
-- This migration changes VARCHAR(255) to TEXT for encrypted fields

-- Drop the UNIQUE constraint on stripe_secret_key first (if it exists)
-- We'll recreate it after changing the column type
ALTER TABLE merchants 
    DROP CONSTRAINT IF EXISTS merchants_stripe_secret_key_key;

-- Change column types from VARCHAR(255) to TEXT
ALTER TABLE merchants 
    ALTER COLUMN stripe_secret_key TYPE TEXT,
    ALTER COLUMN stripe_webhook_secret TYPE TEXT,
    ALTER COLUMN stripe_publishable_key TYPE TEXT;

-- Recreate UNIQUE constraint on stripe_secret_key (now TEXT)
-- Note: This ensures no duplicate Stripe accounts
ALTER TABLE merchants 
    ADD CONSTRAINT merchants_stripe_secret_key_key UNIQUE(stripe_secret_key);

-- Note: stripe_access_token and stripe_refresh_token are already TEXT
-- (from migration-add-stripe-connect.sql)

