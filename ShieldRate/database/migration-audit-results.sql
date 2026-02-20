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
RETURNS void AS $$
BEGIN
    DELETE FROM audit_results
    WHERE expires_at < NOW() - INTERVAL '1 hour'; -- Delete expired + 1 hour grace period
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-audit-results', '0 * * * *', 'SELECT cleanup_expired_audit_results()');

-- Add comment for documentation
COMMENT ON TABLE audit_results IS 'Stores free audit results with secure token-based access and automatic expiration';
COMMENT ON COLUMN audit_results.token IS 'Secure random token for accessing results (not in URL)';
COMMENT ON COLUMN audit_results.email_encrypted IS 'AES-256-GCM encrypted email address';
COMMENT ON COLUMN audit_results.expires_at IS 'Results expire after 24 hours for security';

