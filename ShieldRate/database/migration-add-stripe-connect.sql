-- Stripe Connect OAuth Migration
-- Adds support for OAuth-based Stripe Connect integration (one-click setup)

-- Add OAuth fields to merchants table
ALTER TABLE merchants 
    ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255), -- Connected account ID from Stripe OAuth
    ADD COLUMN IF NOT EXISTS stripe_access_token TEXT, -- Encrypted OAuth access token
    ADD COLUMN IF NOT EXISTS stripe_refresh_token TEXT, -- Encrypted OAuth refresh token
    ADD COLUMN IF NOT EXISTS oauth_connected_at TIMESTAMP WITH TIME ZONE, -- When OAuth connection was established
    ADD COLUMN IF NOT EXISTS connection_method VARCHAR(50) DEFAULT 'manual'; -- 'oauth' or 'manual'

-- Index for OAuth account lookup
CREATE INDEX IF NOT EXISTS idx_merchants_stripe_account_id ON merchants(stripe_account_id);

-- Add comment for documentation
COMMENT ON COLUMN merchants.stripe_account_id IS 'Stripe Connect account ID (from OAuth)';
COMMENT ON COLUMN merchants.stripe_access_token IS 'Encrypted OAuth access token (for Stripe Connect)';
COMMENT ON COLUMN merchants.stripe_refresh_token IS 'Encrypted OAuth refresh token (for token refresh)';
COMMENT ON COLUMN merchants.connection_method IS 'How merchant connected: oauth (one-click) or manual (API keys)';








