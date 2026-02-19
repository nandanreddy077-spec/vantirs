-- Migration: Add Subscription/Plan Fields to Merchants Table
-- Enables tiered pricing: FREE, STARTER, PROFESSIONAL, ENTERPRISE

-- Add subscription/plan fields to merchants table
ALTER TABLE merchants 
    ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free', -- 'free', 'starter', 'professional', 'enterprise'
    ADD COLUMN IF NOT EXISTS disputes_used INTEGER DEFAULT 0, -- Lifetime disputes used (for free tier)
    ADD COLUMN IF NOT EXISTS disputes_limit INTEGER DEFAULT 2, -- Monthly or lifetime limit based on plan
    ADD COLUMN IF NOT EXISTS disputes_used_this_month INTEGER DEFAULT 0, -- Monthly counter
    ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing'
    ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255), -- Stripe customer ID for billing (legacy)
    ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255), -- Stripe subscription ID (legacy)
    ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(255), -- Razorpay customer ID for billing
    ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(255), -- Razorpay subscription ID
    ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE, -- When subscription started
    ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE, -- When subscription ends (for canceled)
    ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMP WITH TIME ZONE, -- For monthly reset
    ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb; -- Store plan features as JSON

-- Indexes for plan lookups and billing
CREATE INDEX IF NOT EXISTS idx_merchants_plan ON merchants(plan);
CREATE INDEX IF NOT EXISTS idx_merchants_subscription_status ON merchants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_merchants_stripe_customer_id ON merchants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_merchants_stripe_subscription_id ON merchants(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_merchants_razorpay_customer_id ON merchants(razorpay_customer_id);
CREATE INDEX IF NOT EXISTS idx_merchants_razorpay_subscription_id ON merchants(razorpay_subscription_id);

-- Add comments for documentation
COMMENT ON COLUMN merchants.plan IS 'Subscription plan: free (2 disputes lifetime), starter (25/month), professional (100/month), enterprise (unlimited)';
COMMENT ON COLUMN merchants.disputes_used IS 'Total disputes processed (lifetime for free tier)';
COMMENT ON COLUMN merchants.disputes_limit IS 'Dispute limit for current plan (2 for free, 25 for starter, 100 for professional, NULL for enterprise)';
COMMENT ON COLUMN merchants.disputes_used_this_month IS 'Disputes processed in current billing cycle (resets monthly for paid plans)';
COMMENT ON COLUMN merchants.subscription_status IS 'Subscription status: active, canceled, past_due, trialing';
COMMENT ON COLUMN merchants.razorpay_customer_id IS 'Razorpay customer ID for billing';
COMMENT ON COLUMN merchants.razorpay_subscription_id IS 'Razorpay subscription ID';
COMMENT ON COLUMN merchants.billing_cycle_start IS 'Start date of current billing cycle (used for monthly reset)';

-- Set default billing_cycle_start for existing merchants
UPDATE merchants 
SET billing_cycle_start = created_at 
WHERE billing_cycle_start IS NULL;

-- Function to reset monthly dispute counters (called by cron job)
CREATE OR REPLACE FUNCTION reset_monthly_dispute_counters()
RETURNS void AS $$
BEGIN
    UPDATE merchants
    SET 
        disputes_used_this_month = 0,
        billing_cycle_start = NOW()
    WHERE 
        plan IN ('starter', 'professional', 'enterprise')
        AND subscription_status = 'active'
        AND (
            billing_cycle_start IS NULL 
            OR EXTRACT(MONTH FROM billing_cycle_start) != EXTRACT(MONTH FROM NOW())
            OR EXTRACT(YEAR FROM billing_cycle_start) != EXTRACT(YEAR FROM NOW())
        );
END;
$$ LANGUAGE plpgsql;



