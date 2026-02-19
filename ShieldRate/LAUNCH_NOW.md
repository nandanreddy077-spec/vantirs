# 🚀 Launch Vantirs - Complete Step-by-Step Guide

## Overview
This guide will take you from code to production in ~30 minutes.

**What you need:**
- ✅ Domain purchased (you have this!)
- ✅ Supabase account
- ✅ Stripe account (Live mode)
- ✅ GitHub account (free)
- ✅ Vercel account (free)

---

## Step 1: Prepare Your Code (5 minutes)

### 1.1 Check Git Status
```bash
cd /Users/nandanreddyavanaganti/ShieldRate
git status
```

### 1.2 Stage All Files
```bash
git add .
```

### 1.3 Create Initial Commit
```bash
git commit -m "Production ready - Vantirs CE 3.0 Compliance Engine

- Complete UI/UX redesign
- Security & scalability enhancements
- API key hashing
- Redis caching
- Background job queue
- Enhanced monitoring
- 100% production ready"
```

---

## Step 2: Push to GitHub (5 minutes)

### 2.1 Create GitHub Repository
1. Go to: https://github.com/new
2. Repository name: `vantirs` (or your preferred name)
3. Description: "CE 3.0 Compliance Engine for Chargeback Defense"
4. Visibility: **Private** (recommended) or Public
5. **DO NOT** check "Initialize with README"
6. Click "Create repository"

### 2.2 Connect and Push
```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/vantirs.git

# Verify
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

**If authentication fails:**
- Use GitHub Personal Access Token (Settings → Developer settings → Personal access tokens)
- Or use SSH: `git remote add origin git@github.com:YOUR_USERNAME/vantirs.git`

---

## Step 3: Deploy to Vercel (10 minutes)

### 3.1 Create Vercel Account
1. Go to: https://vercel.com
2. Sign up/Login with GitHub (recommended - one-click import)

### 3.2 Import Repository
1. Click **"Add New Project"**
2. Select your GitHub account
3. Find and select `vantirs` repository
4. Click **"Import"**

### 3.3 Configure Project
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `.` (leave as default)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)

### 3.4 Add Environment Variables (CRITICAL!)

**Before clicking Deploy, add these variables:**

Click **"Environment Variables"** and add each one:

```bash
# REQUIRED: Supabase (Your database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# REQUIRED: App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_VANTIRS_ENABLED=true
NODE_ENV=production

# OPTIONAL: Stripe Keys (Only for health checks/testing)
# ⚠️ IMPORTANT: You DON'T need these for production!
# Your customers will connect their own Stripe accounts via /onboarding
# These are only needed if you want to test health checks
STRIPE_SECRET_KEY=rk_test_...  # Optional - only for health checks
STRIPE_WEBHOOK_SECRET=whsec_...  # Optional - only for backward compatibility
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Optional - only if needed for UI

# OPTIONAL: Enhanced Features
ENCRYPTION_KEY=your-base64-encryption-key  # Recommended for production
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io  # For caching
UPSTASH_REDIS_REST_TOKEN=your-redis-token  # For caching
ALLOWED_ORIGINS=https://yourdomain.com  # For CORS
```

**⚠️ IMPORTANT: Multi-Tenant Architecture**

Vantirs uses a **multi-tenant architecture**:
- **You (Vantirs)**: Provide the platform - NO Stripe account needed!
- **Your Customers**: Connect their own Stripe accounts via `/onboarding`
- **Data Isolation**: Each customer's data is completely separate
- **Scalability**: Unlimited customers, each with their own Stripe account

**Stripe keys in Vercel are OPTIONAL** - they're only used for:
1. Health checks (`/api/health` endpoint)
2. Backward compatibility (old webhook route)
3. Testing/demo purposes

**For production**: Customers visit `/onboarding` and connect their own Stripe accounts!

**For each variable:**
- Enter name
- Enter value
- Select environments: ✅ Production, ✅ Preview, ✅ Development
- Click "Add"

### 3.5 Deploy
1. Click **"Deploy"**
2. Wait 2-5 minutes for build
3. You'll get a URL: `https://vantirs-xxxxx.vercel.app`

---

## Step 4: Configure Your Domain (10 minutes)

### 4.1 Add Domain in Vercel
1. Go to your project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `yourdomain.com`
4. Click **"Add"**
5. Enter: `www.yourdomain.com`
6. Click **"Add"**

### 4.2 Get DNS Records from Vercel
Vercel will show you DNS configuration. You'll see either:
- **Nameservers** (recommended)
- **A/CNAME records**

### 4.3 Configure DNS in Your Domain Provider

**If using Nameservers (Recommended):**
1. Go to your domain provider (Namecheap, GoDaddy, etc.)
2. Find DNS/Nameserver settings
3. Change to "Custom Nameservers"
4. Enter Vercel's nameservers (from Vercel dashboard)
5. Save

**If using DNS Records:**
1. Go to your domain provider's DNS settings
2. Add A record: `@` → Vercel IP (from Vercel)
3. Add CNAME: `www` → `cname.vercel-dns.com`
4. Save

### 4.4 Wait for DNS Propagation
- **Time:** 5 minutes to 48 hours (usually 1-2 hours)
- **Check:** Vercel dashboard will show "Valid Configuration" when ready
- **SSL:** Vercel automatically provisions SSL certificate

---

## Step 5: Stripe Keys - OPTIONAL (Skip if Multi-Tenant)

**⚠️ IMPORTANT: You DON'T need Stripe keys for production!**

Vantirs uses a **multi-tenant architecture** where **customers connect their own Stripe accounts** via the onboarding page.

**Stripe keys in Vercel are OPTIONAL** and only used for:
- Health checks (`/api/health` endpoint)
- Testing/demo purposes
- Backward compatibility

**Skip this step if you're using multi-tenant mode (recommended).**

### If You Want to Test Health Checks (Optional):

### 5.1 Get Test Stripe Keys (For Testing Only)
1. Go to: https://dashboard.stripe.com
2. Stay in **"Test mode"** (top right)

### 5.2 Create Test Restricted Key
1. **Developers** → **API keys** → **"Create restricted key"**
2. **Name:** `Vantirs Test`
3. **Permissions:**
   - ✅ `charges:read`
   - ✅ `disputes:read`
   - ✅ `disputes:write`
4. Click **"Create key"**
5. **Copy the key** (starts with `rk_test_...`)

### 5.3 Create Test Webhook (Optional)
1. **Developers** → **Webhooks** → **"Add endpoint"**
2. **Endpoint URL:** `https://yourdomain.com/api/webhooks/stripe`
3. **Description:** `Vantirs Test Webhook`
4. **Events:** Select `charge.dispute.created`
5. Click **"Add endpoint"**
6. **Copy webhook secret** (starts with `whsec_...`)

### 5.4 Update Vercel Environment Variables (Optional)
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add (optional):
   - `STRIPE_SECRET_KEY` = Your `rk_test_...` key (for health checks)
   - `STRIPE_WEBHOOK_SECRET` = Your `whsec_...` secret (optional)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Your `pk_test_...` key (optional)

**Note:** These are NOT required. Your customers will connect their own Stripe accounts!

---

## Step 6: Set Up Database (5 minutes)

### 6.1 Run Database Schema
1. Go to Supabase Dashboard
2. **SQL Editor** → **New Query**
3. Copy and paste contents of `database/schema.sql`
4. Click **"Run"**
5. Verify tables created: `disputes`, `transactions`, `user_activity_logs`, `action_taxonomy`

### 6.2 Run Migrations
Run these in order:
1. `database/migration-multi-tenant.sql`
2. `database/migration-add-auth-encryption.sql`
3. `database/migration-add-manual-review.sql`
4. `database/migration-add-notification-metadata.sql`
5. `database/migration-add-transaction-fields.sql`
6. `database/migration-binary-checklist.sql`
7. `database/migration-api-key-hashing.sql`

---

## Step 7: Verify Deployment (5 minutes)

### 7.1 Health Check
```bash
curl https://yourdomain.com/api/health
```

**Expected response:**
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

### 7.2 Test Dashboard
1. Visit: https://yourdomain.com
2. Verify:
   - Landing page loads
   - No console errors
   - Dashboard accessible

### 7.3 Test Onboarding Flow (Multi-Tenant)
**This is how your customers will connect:**

1. **Visit:** https://yourdomain.com/onboarding
2. **Test with a Stripe test account:**
   - Enter company name and email
   - Enter a test restricted key (`rk_test_...`)
   - Enter a test webhook secret (`whsec_...`)
   - Click "Connect Stripe"
3. **Verify:**
   - Merchant record created in Supabase `merchants` table
   - API key generated (`vant_...`)
   - Webhook URL provided: `https://yourdomain.com/api/webhooks/stripe/[merchantId]`

**Note:** For production, customers will:
1. Visit `/onboarding`
2. Connect their own Stripe accounts
3. Configure webhook in their Stripe dashboard
4. Run 12-month backfill
5. Start processing disputes automatically

---

## Step 8: Customer Onboarding & Backfill

**⚠️ IMPORTANT: This is done by YOUR CUSTOMERS, not you!**

### 8.1 Customer Onboarding Flow

**Your customers will:**
1. Visit: `https://yourdomain.com/onboarding`
2. Enter their company info and Stripe restricted key
3. System creates merchant record
4. Customer gets API key and webhook URL
5. Customer configures webhook in their Stripe dashboard

### 8.2 Customer Runs 12-Month Backfill

**Each customer must run this after onboarding:**

```bash
# Customer runs this with their merchant_id
curl -X POST "https://yourdomain.com/api/onboarding/sync-transactions?merchant_id=[merchantId]"
```

**What this does:**
- ✅ Syncs all successful charges from last 12 months
- ✅ Extracts IP addresses, device fingerprints
- ✅ Stores customer emails and billing descriptors
- ✅ Enables CE 3.0 matching immediately

**Without this, CE 3.0 matching won't work for 4 months!**

### 8.3 Verify Customer Setup

**After customer onboards:**
1. **Check Supabase:**
   - `merchants` table → Should see customer's merchant record
   - `transactions` table → Should see their synced transactions
2. **Test webhook:**
   - Customer sends test webhook from their Stripe dashboard
   - Check Vercel logs for `DISPUTE_RECEIVED`
   - Check `disputes` table for new dispute

---

## Step 9: Final Checklist

### Pre-Launch
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Required environment variables added (Supabase + App config)
- [ ] Domain configured and working
- [ ] SSL certificate active (HTTPS)
- [ ] Health check passes
- [ ] Dashboard loads
- [ ] Onboarding page works (`/onboarding`)
- [ ] Database schema and migrations run
- [ ] Test onboarding flow (create test merchant)
- [ ] Verify merchant record created in Supabase

### Launch Day
- [ ] Onboard first customer via `/onboarding`
- [ ] Customer connects their Stripe account
- [ ] Customer runs 12-month backfill
- [ ] Customer configures webhook in their Stripe dashboard
- [ ] Test webhook from customer's Stripe account
- [ ] Monitor webhook logs in Vercel
- [ ] Verify disputes appear in dashboard
- [ ] Check VAMP monitor displays correctly

---

## Troubleshooting

### GitHub Push Fails
```bash
# Use Personal Access Token:
# GitHub → Settings → Developer settings → Personal access tokens
# Generate token with "repo" scope
# Use token as password when pushing
```

### Vercel Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Check that `package.json` has correct scripts

### Domain Not Working
- Wait 24-48 hours for DNS propagation
- Verify DNS records in your domain provider
- Check Vercel domain status

### Webhook Not Working
- **For customers:** Verify webhook URL: `https://yourdomain.com/api/webhooks/stripe/[merchantId]`
- **For customers:** Check webhook secret matches what they entered in onboarding
- Check Vercel logs for errors
- Verify merchant record exists in Supabase

### Backfill Returns 0 Transactions
- This is normal if customer doesn't have charges yet
- It will sync transactions as they come in
- Customer can run backfill again later to sync new transactions

---

## Success! 🎉

Once all steps are complete:
- ✅ Vantirs is live at https://yourdomain.com
- ✅ Onboarding page ready for customers
- ✅ Multi-tenant architecture active
- ✅ Ready for customers to connect their Stripe accounts

**Next Steps:**
- Share onboarding link with first customer: `https://yourdomain.com/onboarding`
- Customer connects their Stripe account
- Customer runs 12-month backfill
- Customer configures webhook
- Disputes process automatically!
- Monitor dashboard regularly
- Set up alerts for webhook failures
- Track VAMP ratios per customer

---

## Quick Reference

**Your URLs:**
- Production: https://yourdomain.com
- Dashboard: https://yourdomain.com/dashboard
- Onboarding: https://yourdomain.com/onboarding
- Health Check: https://yourdomain.com/api/health

**Important Links:**
- Vercel Dashboard: https://vercel.com/dashboard
- Stripe Dashboard: https://dashboard.stripe.com
- Supabase Dashboard: https://app.supabase.com
- GitHub Repository: https://github.com/YOUR_USERNAME/vantirs

---

**You're ready to launch! 🚀**

