# ⚡ Quick Production Verification

## Run Automated Verification

```bash
npx tsx scripts/verify-production.ts
```

This will check:
- ✅ Environment variables
- ✅ Database tables
- ✅ Critical columns
- ✅ Mastercard FPT support

## Manual SQL Checks

If you prefer SQL, run these in Supabase SQL Editor:

```sql
-- Quick check: All tables exist?
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('merchants', 'disputes', 'transactions', 'user_activity_logs', 'action_taxonomy');

-- Quick check: merchant_id columns exist?
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'merchant_id' 
  AND table_name IN ('disputes', 'transactions', 'user_activity_logs');

-- Quick check: Mastercard FPT columns exist?
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'disputes' 
  AND column_name IN ('card_network', 'device_fingerprint', 'ip_address');
```

## Critical Environment Variables

**Must Have:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Should Have:**
- `ENCRYPTION_KEY` (security)
- `RAZORPAY_KEY_ID` (if using Razorpay billing)
- `RAZORPAY_KEY_SECRET` (if using Razorpay billing)

## If Verification Fails

1. **Missing merchants table** → Run `database/migration-multi-tenant.sql`
2. **Missing merchant_id columns** → Run `database/migration-multi-tenant.sql`
3. **Missing subscription columns** → Run `database/migration-add-subscription-plans.sql`
4. **Missing environment variables** → Add to Vercel/hosting platform

## Full Documentation

See `PRODUCTION_VERIFICATION.md` for complete details.
