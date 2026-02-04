-- ShieldRate Database Schema (Migration-Safe Version)
-- This version can be run multiple times without errors
-- Use this if you get "already exists" errors

-- Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_dispute_id VARCHAR(255) UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    reason_code VARCHAR(50),
    evidence_due_by TIMESTAMP WITH TIME ZONE,
    customer_id VARCHAR(255) NOT NULL,
    charge_id VARCHAR(255) NOT NULL,
    ip_address INET,
    device_fingerprint VARCHAR(255),
    v_compliance_score INTEGER DEFAULT 0,
    auto_win_eligible BOOLEAN DEFAULT FALSE,
    liability_shift_eligible BOOLEAN DEFAULT FALSE,
    historical_match_found BOOLEAN DEFAULT FALSE,
    usage_audit_attached BOOLEAN DEFAULT FALSE,
    card_network VARCHAR(20) DEFAULT 'UNKNOWN',
    match_count INTEGER DEFAULT 0,
    notification_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_charge_id VARCHAR(255) UNIQUE NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    disputed BOOLEAN DEFAULT FALSE,
    ip_address INET,
    device_fingerprint VARCHAR(255),
    payment_method_fingerprint VARCHAR(255),
    customer_email VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activity Logs Table
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT,
    ip_address INET,
    device_fingerprint VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action Taxonomy Table
CREATE TABLE IF NOT EXISTS action_taxonomy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_key VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- Identity, Value, Consent, Continuity
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_disputes_customer ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_stripe_id ON disputes(stripe_dispute_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_created ON transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_payment_created ON transactions(customer_id, payment_method_fingerprint, created_at DESC) WHERE status = 'succeeded' AND disputed = false;
CREATE INDEX IF NOT EXISTS idx_activity_logs_customer ON user_activity_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_customer_timestamp ON user_activity_logs(customer_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON user_activity_logs(timestamp DESC);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    -- Add columns to disputes table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'notification_metadata') THEN
        ALTER TABLE disputes ADD COLUMN notification_metadata JSONB;
    END IF;
    
    -- Add columns to transactions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'customer_email') THEN
        ALTER TABLE transactions ADD COLUMN customer_email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'description') THEN
        ALTER TABLE transactions ADD COLUMN description TEXT;
    END IF;
END $$;

-- Insert default action taxonomy (if not exists)
INSERT INTO action_taxonomy (action_key, category, description) VALUES
    ('login', 'Identity', 'User login event'),
    ('logout', 'Identity', 'User logout event'),
    ('export_data', 'Value', 'User exported data'),
    ('api_call', 'Value', 'API call made'),
    ('seat_added', 'Value', 'User seat added'),
    ('tos_acceptance', 'Consent', 'Terms of service accepted'),
    ('subscription_created', 'Continuity', 'Subscription created'),
    ('payment_succeeded', 'Continuity', 'Payment succeeded')
ON CONFLICT (action_key) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at (drop if exists, then create)
DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes;
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


