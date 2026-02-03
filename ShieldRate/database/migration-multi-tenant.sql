-- Multi-Tenant Migration: Add merchants table and merchant_id to existing tables
-- This enables customers to connect their own Stripe accounts

-- Merchants Table: Stores Stripe credentials for each customer
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- Company/merchant name
    email VARCHAR(255) NOT NULL, -- Contact email
    stripe_secret_key VARCHAR(255) NOT NULL, -- Encrypted Stripe restricted key (rk_live_... or rk_test_...)
    stripe_webhook_secret VARCHAR(255) NOT NULL, -- Webhook signing secret (whsec_...)
    stripe_publishable_key VARCHAR(255), -- Publishable key (pk_live_... or pk_test_...)
    webhook_url VARCHAR(500), -- Full webhook URL for this merchant
    is_active BOOLEAN DEFAULT TRUE, -- Whether merchant account is active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stripe_secret_key) -- Ensure no duplicate Stripe accounts
);

-- Add merchant_id to disputes table
ALTER TABLE disputes 
    ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;

-- Add merchant_id to transactions table
ALTER TABLE transactions 
    ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;

-- Add merchant_id to user_activity_logs table
ALTER TABLE user_activity_logs 
    ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;

-- Indexes for merchant_id
CREATE INDEX IF NOT EXISTS idx_disputes_merchant_id ON disputes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_merchant_id ON user_activity_logs(merchant_id);

-- Composite indexes with merchant_id
CREATE INDEX IF NOT EXISTS idx_disputes_merchant_status ON disputes(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_customer ON transactions(merchant_id, customer_id);

-- Trigger for merchants updated_at
DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

