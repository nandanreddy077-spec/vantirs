-- Audit Results Table for Free CE 3.0 Audit Feature
-- Secure storage with encryption and expiration

CREATE TABLE IF NOT EXISTS audit_results (
    id VARCHAR(255) PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL, -- Secure token for accessing results
    email_encrypted TEXT, -- Encrypted email address
    email VARCHAR(255), -- Fallback unencrypted (for migration)
    result JSONB NOT NULL, -- Audit results data
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 24 hour expiration
    ip_address INET, -- IP address for security tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_audit_results_token ON audit_results(token);
CREATE INDEX IF NOT EXISTS idx_audit_results_expires_at ON audit_results(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_results_created_at ON audit_results(created_at);

-- Function to automatically delete expired audit results
CREATE OR REPLACE FUNCTION cleanup_expired_audit_results()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM audit_results
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Enable Row Level Security
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;

-- RLS Policy: service role only (matches all other tables)
DROP POLICY IF EXISTS "Service role full access" ON audit_results;
CREATE POLICY "Service role full access" ON audit_results
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE audit_results IS 'Stores free audit results with secure token-based access and automatic expiration';
COMMENT ON COLUMN audit_results.token IS 'Secure random token for accessing results (not in URL)';
COMMENT ON COLUMN audit_results.email_encrypted IS 'AES-256-GCM encrypted email address';
COMMENT ON COLUMN audit_results.expires_at IS 'Results expire after 24 hours for security';
COMMENT ON FUNCTION cleanup_expired_audit_results() IS 'Deletes expired audit results. Security: search_path set to prevent injection.';



