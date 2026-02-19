# 🚀 Production Verification Checklist

This document verifies that all environment variables and database columns are correctly configured for production deployment.

## ✅ Environment Variables

### Required (Will Break If Missing)

```bash
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Stripe (for webhook processing)
STRIPE_SECRET_KEY=rk_test_... or rk_live_...  # MUST be restricted key
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Optional but Recommended

```bash
# Encryption (for storing merchant Stripe keys securely)
ENCRYPTION_KEY=your-32-char-encryption-key

# Stripe Connect OAuth (for one-click onboarding)
STRIPE_CONNECT_CLIENT_ID=ca_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...

# Razorpay (for billing in India)
RAZORPAY_KEY_ID=rzp_test_... or rzp_live_...
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_PLAN_STARTER=plan_... (optional, has defaults)
RAZORPAY_PLAN_PROFESSIONAL=plan_... (optional, has defaults)
```

## ✅ Database Schema Verification

### Base Tables (from `database/schema.sql`)

Run this SQL to verify:

```sql
-- 1. Verify base tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('disputes', 'transactions', 'user_activity_logs', 'action_taxonomy', 'merchants')
ORDER BY table_name;
```

**Expected Result:** 5 tables should be returned

### Merchants Table Columns

```sql
-- 2. Verify merchants table has all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'merchants'
ORDER BY ordinal_position;
```

**Expected Columns:**
- `id` (UUID, PRIMARY KEY)
- `name` (VARCHAR)
- `email` (VARCHAR)
- `stripe_secret_key` (VARCHAR) - Encrypted
- `stripe_webhook_secret` (VARCHAR)
- `stripe_publishable_key` (VARCHAR, nullable)
- `webhook_url` (VARCHAR, nullable)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `plan` (VARCHAR) - from subscription migration
- `disputes_used` (INTEGER) - from subscription migration
- `disputes_limit` (INTEGER) - from subscription migration
- `disputes_used_this_month` (INTEGER) - from subscription migration
- `subscription_status` (VARCHAR) - from subscription migration
- `razorpay_customer_id` (VARCHAR, nullable) - from subscription migration
- `razorpay_subscription_id` (VARCHAR, nullable) - from subscription migration
- `billing_cycle_start` (TIMESTAMP, nullable) - from subscription migration
- `features` (JSONB) - from subscription migration

### Multi-Tenant Columns

```sql
-- 3. Verify merchant_id exists in disputes table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'disputes' 
  AND column_name = 'merchant_id';

-- 4. Verify merchant_id exists in transactions table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transactions' 
  AND column_name = 'merchant_id';

-- 5. Verify merchant_id exists in user_activity_logs table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_activity_logs' 
  AND column_name = 'merchant_id';
```

**Expected Result:** Each query should return 1 row with `merchant_id` (UUID)

### Mastercard FPT Columns

```sql
-- 6. Verify card_network column exists (for Mastercard FPT)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'disputes' 
  AND column_name = 'card_network';
```

**Expected Result:** 1 row with `card_network` (VARCHAR(20))

### Critical Indexes

```sql
-- 7. Verify critical indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname IN (
    'idx_disputes_merchant_id',
    'idx_transactions_merchant_id',
    'idx_activity_logs_merchant_id',
    'idx_disputes_stripe_id',
    'idx_transactions_customer_payment_created'
  );
```

**Expected Result:** 5 indexes should be returned

### Action Taxonomy Seeding

```sql
-- 8. Verify action_taxonomy is seeded
SELECT COUNT(*) as action_count FROM action_taxonomy;
```

**Expected Result:** Should return at least 10 rows

## 🚨 Critical Items That Will Break Flow

1. **Missing `merchants` table** → Multi-tenant onboarding fails
2. **Missing `merchant_id` columns** → Data isolation breaks, queries fail
3. **Missing `SUPABASE_SERVICE_ROLE_KEY`** → Database operations fail
4. **Missing `STRIPE_WEBHOOK_SECRET`** → Webhook verification fails
5. **Missing `card_network` column** → Mastercard FPT detection fails
6. **Missing `ENCRYPTION_KEY`** → Merchant Stripe keys stored in plaintext (security risk)
7. **Missing `device_fingerprint` or `ip_address`** → CE 3.0 matching fails
8. **Missing `payment_method_fingerprint`** → Historical transaction matching fails

## 🔧 Automated Verification

Run the verification script:

```bash
npx tsx scripts/verify-production.ts
```

This script will:
- ✅ Check all required environment variables
- ✅ Verify database tables exist
- ✅ Verify critical columns exist
- ✅ Verify indexes are created
- ✅ Provide clear error messages if anything is missing

## 📋 Migration Order

If setting up from scratch, run migrations in this order:

1. **Base Schema**: `database/schema.sql`
   - Creates: disputes, transactions, user_activity_logs, action_taxonomy
   - Seeds: action_taxonomy with default actions

2. **Multi-Tenant**: `database/migration-multi-tenant.sql`
   - Creates: merchants table
   - Adds: merchant_id to disputes, transactions, user_activity_logs

3. **Subscription Plans**: `database/migration-add-subscription-plans.sql`
   - Adds: plan, billing, subscription columns to merchants table
   - Creates: reset_monthly_dispute_counters() function

## ✅ Post-Verification Checklist

After running verification:

- [ ] All environment variables set in Vercel/hosting platform
- [ ] All database migrations run successfully
- [ ] Verification script passes all checks
- [ ] Stripe webhook configured and tested
- [ ] Test merchant can onboard successfully
- [ ] Test dispute can be processed
- [ ] Mastercard FPT logic works (test with Mastercard dispute)
- [ ] PDF generation works for both Visa and Mastercard

## 🎯 Production Readiness Score

- **100%**: All checks pass, system is production-ready
- **< 100%**: Fix missing items before launching

---

**Last Updated:** After Mastercard FPT implementation
**Status:** ✅ Ready for production verification


