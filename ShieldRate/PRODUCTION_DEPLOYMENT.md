# 🚀 Vantirs Production Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Code Status
- [x] Webhook handler working (tested locally)
- [x] Database schema ready
- [x] All environment variables configured
- [x] Health check passing
- [x] Rebranding complete (Vantirs)

### 2. Domain Setup (vantirs.com)
- [ ] Domain purchased ✅ (already done)
- [ ] DNS configured (see Step 3 below)
- [ ] SSL certificate (auto via Vercel)

### 3. Stripe Production Setup
- [ ] Switch to **Live Mode** in Stripe
- [ ] Create **Production Restricted Key** (starts with `rk_live_`)
- [ ] Create **Production Webhook** endpoint
- [ ] Copy production webhook secret

### 4. Supabase Production
- [ ] Verify production database is ready
- [ ] Run all migrations
- [ ] Test database connection

---

## Step-by-Step Production Deployment

### Step 1: Prepare Production Environment Variables

Create a production `.env` file (or document for Vercel):

```bash
# ============================================
# STRIPE (PRODUCTION - LIVE MODE)
# ============================================
STRIPE_SECRET_KEY=rk_live_YOUR_PRODUCTION_RESTRICTED_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY

# ============================================
# SUPABASE (PRODUCTION)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://wsmthoimcnlxebvxhisp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# APP CONFIGURATION (PRODUCTION)
# ============================================
NEXT_PUBLIC_APP_URL=https://vantirs.com
NEXT_PUBLIC_SHIELDRATE_ENABLED=true

# ============================================
# RATE LIMITING (OPTIONAL but recommended)
# ============================================
# Create Upstash Redis database and add:
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# ============================================
# CRON SECURITY
# ============================================
CRON_SECRET=generate-random-secret-here

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
NODE_ENV=production
```

---

### Step 2: Set Up Stripe Production Keys

1. **Go to Stripe Dashboard (LIVE MODE):**
   - https://dashboard.stripe.com
   - Toggle to **"Live mode"** (top right)

2. **Create Production Restricted Key:**
   - Developers → API keys → Create restricted key
   - Name: `Vantirs Production`
   - Permissions: `charges:read`, `disputes:read`, `disputes:write`
   - Copy key (starts with `rk_live_`)

3. **Create Production Webhook:**
   - Developers → Webhooks → Add endpoint
   - URL: `https://vantirs.com/api/webhooks/stripe`
   - Events: `charge.dispute.created`
   - Copy webhook secret (starts with `whsec_`)

4. **Get Publishable Key:**
   - API keys → Publishable key (Live mode)
   - Copy (starts with `pk_live_`)

---

### Step 3: Configure Domain DNS (Namecheap)

1. **Go to Namecheap:**
   - https://www.namecheap.com/myaccount/login/
   - Domain List → Manage `vantirs.com`

2. **Option A: Use Vercel Nameservers (Recommended)**
   - After deploying to Vercel, get nameservers
   - In Namecheap: Domain List → Manage → Nameservers
   - Select "Custom DNS"
   - Enter Vercel's nameservers (e.g., `ns1.vercel-dns.com`)

3. **Option B: Use DNS Records**
   - Go to Advanced DNS tab
   - Add A record: `@` → Vercel IP (provided after deployment)
   - Add CNAME: `www` → `cname.vercel-dns.com`

---

### Step 4: Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Production ready - Vantirs"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to: https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Framework: Next.js (auto-detected)

3. **Add Environment Variables:**
   - In Vercel project settings → Environment Variables
   - Add ALL variables from Step 1
   - Make sure to select "Production" environment

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

5. **Add Custom Domain:**
   - Project Settings → Domains
   - Add: `vantirs.com` and `www.vantirs.com`
   - Follow Vercel's DNS instructions

---

### Step 5: Update Stripe Webhook URL

1. **Go to Stripe Dashboard:**
   - Developers → Webhooks
   - Click on your production webhook
   - Update endpoint URL: `https://vantirs.com/api/webhooks/stripe`
   - Verify webhook secret matches Vercel environment variable

2. **Test Webhook:**
   - In Stripe Dashboard, click "Send test webhook"
   - Select: `charge.dispute.created`
   - Check Vercel logs for successful processing

---

### Step 6: Run Production Database Migrations

1. **Go to Supabase:**
   - https://supabase.com/dashboard/project/wsmthoimcnlxebvxhisp/sql/new

2. **Run Migrations:**
   - Execute `database/schema.sql`
   - Execute `database/migration-add-transaction-fields.sql`
   - Execute `database/migration-add-notification-metadata.sql`
   - Execute `database/migration-binary-checklist.sql`

3. **Verify Tables:**
   - Table Editor → Check all tables exist

---

### Step 7: Run 12-Month Backfill (CRITICAL)

**This is critical for CE 3.0 matching to work immediately!**

```bash
# Via API (after deployment)
curl -X POST https://vantirs.com/api/onboarding/sync-transactions \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Or via script (if you have production keys locally):
```bash
npx tsx scripts/sync-transactions.ts --months 12
```

**What this does:**
- Syncs all successful charges from last 12 months
- Extracts IP addresses, device fingerprints
- Stores customer emails and billing descriptors
- Enables CE 3.0 matching immediately

---

### Step 8: Verify Production Setup

1. **Health Check:**
   ```bash
   curl https://vantirs.com/api/health
   ```
   Should return: `{"status":"ok",...}`

2. **Dashboard:**
   - Visit: https://vantirs.com
   - Should load without errors

3. **Test Webhook:**
   - Use Stripe Dashboard to send test event
   - Check Vercel logs for processing
   - Verify dispute appears in Supabase

4. **Database:**
   - Check Supabase → disputes table
   - Verify test dispute was created

---

## Production Environment Variables Checklist

### ✅ Required (Must Have):
- [ ] `STRIPE_SECRET_KEY` - Production restricted key (`rk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret (`whsec_...`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `NEXT_PUBLIC_APP_URL` - `https://vantirs.com`

### ⚪ Optional (Recommended):
- [ ] `UPSTASH_REDIS_REST_URL` - For rate limiting
- [ ] `UPSTASH_REDIS_REST_TOKEN` - For rate limiting
- [ ] `CRON_SECRET` - For cron endpoint security
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - For future features

---

## Post-Deployment Tasks

### 1. Monitor Health
- Set up monitoring for `/api/health` endpoint
- Alert if status != "ok"

### 2. Monitor Webhooks
- Check Vercel logs regularly
- Set up alerts for webhook failures

### 3. Monitor VAMP Ratio
- Check dashboard regularly
- Alert if ratio > 0.9%

### 4. Set Up Cron Job (Optional)
- Vercel Cron: Daily transaction sync
- Endpoint: `/api/cron/sync-transactions`
- Secret: Use `CRON_SECRET` for security

---

## Troubleshooting

### Domain Not Resolving
- Check DNS records in Namecheap
- Wait 24-48 hours for propagation
- Verify nameservers are correct

### SSL Not Working
- Wait for DNS propagation
- Check Vercel dashboard for SSL status
- Verify domain is added in Vercel

### Webhook Not Working
- Verify webhook URL in Stripe: `https://vantirs.com/api/webhooks/stripe`
- Check webhook secret matches Vercel
- Check Vercel logs for errors

### Database Connection Failed
- Verify Supabase keys in Vercel
- Check Supabase project is active
- Verify tables exist

---

## Security Checklist

- [ ] Using Stripe Restricted Keys (not full access)
- [ ] Webhook secret is secure (not in code)
- [ ] Supabase service role key is secure
- [ ] Environment variables in Vercel (not in code)
- [ ] Domain has SSL (automatic via Vercel)
- [ ] Rate limiting enabled (if using Upstash)

---

## Success Criteria

You're production-ready when:
- [ ] Health check returns `{"status":"ok"}`
- [ ] Dashboard loads at https://vantirs.com
- [ ] Production webhook receives events
- [ ] Disputes are created in database
- [ ] 12-month backfill completed
- [ ] SSL certificate active
- [ ] All environment variables set

---

**Once all steps are complete, Vantirs will be live and processing real disputes! 🚀**

