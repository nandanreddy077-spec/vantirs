-- Vantirs Database Schema for Supabase/PostgreSQL
-- Optimized for Visa CE 3.0 Compliance Evidence Generation

-- Disputes Table: Tracks all chargeback disputes
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_dispute_id VARCHAR(255) UNIQUE NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, won, lost, warning_needs_response, warning_closed, warning_under_review
    reason_code VARCHAR(50), -- e.g., 'fraudulent', 'general', 'duplicate'
    evidence_due_by TIMESTAMP WITH TIME ZONE,
    customer_id VARCHAR(255) NOT NULL, -- Stripe customer ID
    charge_id VARCHAR(255) NOT NULL, -- Stripe charge ID
    ip_address INET, -- IP from disputed charge
    device_fingerprint VARCHAR(255), -- Device fingerprint from disputed charge
    v_compliance_score INTEGER DEFAULT 0, -- 0-100, kept for backward compatibility (0 = NO, 100 = YES)
    auto_win_eligible BOOLEAN DEFAULT FALSE, -- Binary: LIABILITY_SHIFT_ELIGIBLE
    liability_shift_eligible BOOLEAN DEFAULT FALSE, -- Explicit binary flag
    historical_match_found BOOLEAN DEFAULT FALSE, -- Binary: HISTORICAL_MATCH_FOUND
    usage_audit_attached BOOLEAN DEFAULT FALSE, -- Binary: USAGE_AUDIT_ATTACHED
    card_network VARCHAR(20) DEFAULT 'UNKNOWN', -- VISA, MASTERCARD, UNKNOWN
    match_count INTEGER DEFAULT 0, -- Number of historical matches found
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table: Historical successful charges for CE 3.0 matching
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_charge_id VARCHAR(255) UNIQUE NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    status VARCHAR(50) NOT NULL, -- succeeded, failed, pending, refunded
    ip_address INET,
    device_fingerprint VARCHAR(255),
    payment_method_fingerprint VARCHAR(255), -- For matching across charges
    disputed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activity Logs: Evidence of product usage
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- Maps to action_taxonomy
    action_description TEXT,
    ip_address INET,
    device_fingerprint VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB, -- Flexible storage for additional context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action Taxonomy: Maps app events to evidence categories
CREATE TABLE IF NOT EXISTS action_taxonomy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_key VARCHAR(255) UNIQUE NOT NULL, -- e.g., 'export_csv', 'api_call', 'login'
    evidence_category VARCHAR(50) NOT NULL, -- Identity, Value, Consent, Continuity
    evidence_description TEXT NOT NULL, -- Human-readable description for banks
    weight INTEGER DEFAULT 1, -- Importance weight (1-10)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_disputes_customer_id ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_stripe_id ON disputes(stripe_dispute_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_compliance_score ON disputes(v_compliance_score);

-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_fingerprint ON transactions(payment_method_fingerprint);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Composite indexes for CE 3.0 matching performance (critical for 1M+ rows)
CREATE INDEX IF NOT EXISTS idx_transactions_customer_created ON transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_payment_created ON transactions(customer_id, payment_method_fingerprint, created_at DESC) WHERE status = 'succeeded' AND disputed = false;

CREATE INDEX IF NOT EXISTS idx_activity_logs_customer_id ON user_activity_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON user_activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON user_activity_logs(action_type);

-- Composite index for activity log queries (customer + timestamp for 48-hour lookups)
CREATE INDEX IF NOT EXISTS idx_activity_logs_customer_timestamp ON user_activity_logs(customer_id, timestamp DESC);

-- Seed Action Taxonomy with common SaaS actions
INSERT INTO action_taxonomy (action_key, evidence_category, evidence_description, weight) VALUES
    ('login', 'Identity', 'User authentication event proving identity continuity', 8),
    ('export_data', 'Value', 'High-value action: User exported data from platform', 10),
    ('api_call', 'Value', 'User consumed service via API integration', 9),
    ('seat_added', 'Value', 'User added team member, indicating active usage', 9),
    ('subscription_upgrade', 'Value', 'User upgraded subscription tier', 10),
    ('feature_usage', 'Value', 'User accessed premium feature', 7),
    ('tos_acceptance', 'Consent', 'User accepted Terms of Service', 10),
    ('payment_method_added', 'Consent', 'User added payment method', 9),
    ('profile_update', 'Identity', 'User updated profile information', 5),
    ('password_reset', 'Identity', 'User reset password, proving account ownership', 7)
ON CONFLICT (action_key) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes;
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

