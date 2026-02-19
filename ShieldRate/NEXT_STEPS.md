# ✅ Next Steps - You're Almost There!

## What You've Completed ✅
- ✅ Code deployed to Vercel
- ✅ Domain configured (vantirs.com)
- ✅ Environment variables set
- ✅ SSL certificate active

## What's Next (15 minutes)

### Step 1: Fix Environment Variable Name (Optional but Recommended)

I noticed you have `NEXT_PUBLIC_SHIELDRATE_ENABLED` - let's update it:

1. **In Vercel Dashboard:**
   - Go to Settings → Environment Variables
   - Delete: `NEXT_PUBLIC_SHIELDRATE_ENABLED`
   - Add: `NEXT_PUBLIC_VANTIRS_ENABLED` = `true`
   - (The code supports both, but let's use the correct name)

### Step 2: Stripe Keys - OPTIONAL (Skip This!)

**⚠️ IMPORTANT: You DON'T need Stripe keys for production!**

Vantirs uses a **multi-tenant architecture** where **customers connect their own Stripe accounts** via the onboarding page.

**The Stripe keys in Vercel are OPTIONAL** and only used for:
- Health checks (`/api/health` endpoint)
- Testing/demo purposes
- Backward compatibility

**You can:**
- **Option A:** Remove Stripe keys from Vercel (recommended for production)
- **Option B:** Keep test keys for health checks (optional)

**For production:** Your customers will visit `/onboarding` and connect their own Stripe accounts!

**See `MULTI_TENANT_EXPLAINED.md` for full details.**

### Step 3: Verify Deployment Works

1. **Test Health Endpoint:**
   ```bash
   curl https://vantirs.com/api/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "checks": {
       "environment": true,
       "database": true,
       "stripe": true
     }
   }
   ```

2. **Visit Your Site:**
   - Go to: https://vantirs.com
   - Verify landing page loads
   - Check dashboard: https://vantirs.com/dashboard

### Step 4: Set Up Database (If Not Done)

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com
   - Select your project

2. **Run Schema:**
   - SQL Editor → New Query
   - Copy/paste contents of `database/schema.sql`
   - Click "Run"

3. **Run Migrations (in order):**
   - `database/migration-multi-tenant.sql`
   - `database/migration-add-auth-encryption.sql`
   - `database/migration-add-manual-review.sql`
   - `database/migration-add-notification-metadata.sql`
   - `database/migration-add-transaction-fields.sql`
   - `database/migration-binary-checklist.sql`
   - `database/migration-api-key-hashing.sql`

### Step 5: Run 12-Month Backfill (CRITICAL!)

**⚠️ DO THIS NOW - Without this, CE 3.0 matching won't work for 4 months!**

```bash
curl -X POST https://vantirs.com/api/onboarding/sync-transactions
```

**What this does:**
- Syncs all successful charges from last 12 months
- Extracts IP addresses, device fingerprints
- Enables CE 3.0 matching immediately

**Verify:**
- Go to Supabase → Table Editor → `transactions` table
- Should see many rows (hundreds/thousands)

### Step 6: Test Webhook

1. **In Stripe Dashboard (Live mode):**
   - Developers → Webhooks → Your production webhook
   - Click "Send test webhook"
   - Select: `charge.dispute.created`
   - Click "Send test webhook"

2. **Check Vercel Logs:**
   - Vercel Dashboard → Your Project → Logs
   - Look for `DISPUTE_RECEIVED` log entry

3. **Check Supabase:**
   - Table Editor → `disputes` table
   - Should see new test dispute

---

## Quick Checklist

- [ ] Update `NEXT_PUBLIC_VANTIRS_ENABLED` (optional - rename from SHIELDRATE)
- [ ] Remove Stripe keys from Vercel (optional - not needed for production)
- [ ] Test health endpoint
- [ ] Visit https://vantirs.com
- [ ] Test onboarding page: https://vantirs.com/onboarding
- [ ] Run database schema (if not done)
- [ ] Run all migrations
- [ ] Test onboarding flow (create test merchant)
- [ ] Verify merchant record in Supabase
- [ ] Ready for customers to onboard!

---

## You're Ready! 🎉

Once all steps are complete:
- ✅ Vantirs is live at https://vantirs.com
- ✅ Onboarding page ready for customers
- ✅ Multi-tenant architecture active
- ✅ Ready for customers to connect their Stripe accounts!

**Next Steps:**
1. Share onboarding link with first customer: `https://vantirs.com/onboarding`
2. Customer connects their Stripe account
3. Customer runs 12-month backfill
4. Customer configures webhook
5. Disputes process automatically!

**You don't need Stripe keys - your customers provide theirs!** 🚀

