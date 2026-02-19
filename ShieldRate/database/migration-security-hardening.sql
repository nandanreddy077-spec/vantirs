-- Security Hardening Migration
-- Fixes Security Advisor warnings: RLS disabled and function search_path issues
-- 
-- This migration:
-- 1. Fixes function search_path security warnings
-- 2. Enables RLS on all tables (defense in depth)
-- 3. Creates policies that allow service role access (service role bypasses RLS anyway)

-- ============================================
-- PART 1: Fix Function Search Path Warnings
-- ============================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix reset_monthly_dispute_counters function
CREATE OR REPLACE FUNCTION reset_monthly_dispute_counters()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ============================================
-- PART 2: Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: Create RLS Policies
-- ============================================

-- Note: Service role bypasses RLS, so these policies are for defense in depth
-- They ensure that if anon key is ever exposed, access is still restricted

-- Disputes table policies
DROP POLICY IF EXISTS "Service role full access" ON disputes;
CREATE POLICY "Service role full access" ON disputes
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Transactions table policies
DROP POLICY IF EXISTS "Service role full access" ON transactions;
CREATE POLICY "Service role full access" ON transactions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- User activity logs table policies
DROP POLICY IF EXISTS "Service role full access" ON user_activity_logs;
CREATE POLICY "Service role full access" ON user_activity_logs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Action taxonomy table policies (read-only for anon, full for service)
DROP POLICY IF EXISTS "Service role full access" ON action_taxonomy;
CREATE POLICY "Service role full access" ON action_taxonomy
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Merchants table policies (most sensitive - service role only)
DROP POLICY IF EXISTS "Service role full access" ON merchants;
CREATE POLICY "Service role full access" ON merchants
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- PART 4: Add Comments for Documentation
-- ============================================

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp. Security: search_path set to prevent injection.';
COMMENT ON FUNCTION reset_monthly_dispute_counters() IS 'Resets monthly dispute counters for active subscriptions. Security: search_path set to prevent injection.';

-- ============================================
-- Verification Queries (run these to verify)
-- ============================================

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('disputes', 'transactions', 'user_activity_logs', 'action_taxonomy', 'merchants');

-- Verify functions have search_path set:
-- SELECT proname, prosecdef, proconfig FROM pg_proc WHERE proname IN ('update_updated_at_column', 'reset_monthly_dispute_counters');

-- Verify policies exist:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';


