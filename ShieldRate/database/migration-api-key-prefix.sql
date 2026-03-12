-- Add key_prefix column for fast API key lookups
-- Stores first 8 chars of plaintext key alongside bcrypt hash
-- Eliminates full-table bcrypt scan on every auth request

ALTER TABLE merchants
    ADD COLUMN IF NOT EXISTS api_key_prefix VARCHAR(12);

-- Index for fast prefix lookups
CREATE INDEX IF NOT EXISTS idx_merchants_api_key_prefix ON merchants(api_key_prefix) WHERE api_key_prefix IS NOT NULL;

-- Backfill: for plaintext vant_ keys, extract prefix from api_key
UPDATE merchants
SET api_key_prefix = LEFT(api_key, 8)
WHERE api_key LIKE 'vant_%' AND api_key_prefix IS NULL;
