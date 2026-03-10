-- Migration: Add API Key and Support Encrypted Stripe Keys
-- This migration adds authentication and prepares for encryption

-- Add API key column to merchants table
ALTER TABLE merchants 
    ADD COLUMN IF NOT EXISTS api_key VARCHAR(255) UNIQUE;

-- Create index on api_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_merchants_api_key ON merchants(api_key);

-- Note: stripe_secret_key and stripe_webhook_secret columns already exist
-- They will store encrypted values (base64 strings) after encryption is enabled
-- The application will handle encryption/decryption transparently

-- Generate API keys for existing merchants (if any)
-- This is a one-time operation - new merchants will get keys on creation
DO $$
DECLARE
    merchant_record RECORD;
    new_api_key TEXT;
BEGIN
    FOR merchant_record IN SELECT id FROM merchants WHERE api_key IS NULL
    LOOP
        -- Generate API key: vant_<32 hex chars>
        new_api_key := 'vant_' || encode(gen_random_bytes(16), 'hex');
        
        UPDATE merchants 
        SET api_key = new_api_key 
        WHERE id = merchant_record.id;
    END LOOP;
END $$;











