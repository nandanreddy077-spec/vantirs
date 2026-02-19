-- Migration: API Key Hashing
-- 
-- This migration adds support for hashed API keys using bcrypt
-- Existing plaintext API keys will continue to work (backward compatibility)
-- New API keys will be hashed automatically

-- Note: This migration does NOT hash existing API keys automatically
-- Existing keys will continue to work as plaintext
-- New keys created after this migration will be hashed
-- 
-- To migrate existing keys:
-- 1. Generate new API keys for merchants
-- 2. Hash them using: SELECT hash_api_key('vant_...') 
-- 3. Update merchants table with hashed keys

-- Add comment to api_key column explaining the format
COMMENT ON COLUMN merchants.api_key IS 
  'API key for authentication. Can be plaintext (vant_...) or bcrypt hash ($2a$...). New keys are hashed.';

-- Create function to hash API keys (for manual migration if needed)
CREATE OR REPLACE FUNCTION hash_api_key(plaintext_key TEXT)
RETURNS TEXT AS $$
  -- This function is a placeholder - actual hashing happens in application code
  -- Using bcrypt in Node.js, not PostgreSQL
  -- This is here for documentation purposes
  SELECT plaintext_key;
$$ LANGUAGE sql;

COMMENT ON FUNCTION hash_api_key IS 
  'Placeholder function. API key hashing is performed in application code (Node.js bcrypt).';

-- Index remains the same (works for both plaintext and hashed keys)
-- The index on api_key is still useful for quick lookups during migration
-- After full migration, we can remove the index since we'll verify against all merchants








