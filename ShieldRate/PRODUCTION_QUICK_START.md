# 🚀 Vantirs Production Quick Start

## ⚡ 5-Minute Production Setup

### 1. Stripe Production Keys (2 minutes)

**Switch to Live Mode:**
1. Go to: https://dashboard.stripe.com
2. Toggle to **"Live mode"** (top right)

**Create Restricted Key:**
1. Developers → API keys → Create restricted key
2. Name: `Vantirs Production`
3. Permissions: `charges:read`, `disputes:read`, `disputes:write`
4. Copy: `rk_live_...` → Add to Vercel as `STRIPE_SECRET_KEY`

**Create Webhook:**
1. Developers → Webhooks → Add endpoint
2. URL: `https://vantirs.com/api/webhooks/stripe`
3. Event: `charge.dispute.created`
4. Copy: `whsec_...` → Add to Vercel as `STRIPE_WEBHOOK_SECRET`

---

### 2. Deploy to Vercel (2 minutes)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Deploy:**
   - Go to: https://vercel.com
   - Import repository
   - Add environment variables (see below)
   - Deploy

3. **Add Domain:**
   - Settings → Domains
   - Add: `vantirs.com` and `www.vantirs.com`

---

### 3. Configure DNS (1 minute)

**In Namecheap:**
1. Domain List → Manage `vantirs.com`
2. Nameservers → Custom DNS
3. Enter Vercel nameservers (from Vercel dashboard)

**OR use DNS records:**
- A record: `@` → Vercel IP
- CNAME: `www` → `cname.vercel-dns.com`

---

## 📋 Environment Variables for Vercel

Copy these to Vercel → Settings → Environment Variables:

```bash
# Stripe (Production - Live Mode)
STRIPE_SECRET_KEY=rk_live_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wsmthoimcnlxebvxhisp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
NEXT_PUBLIC_APP_URL=https://vantirs.com
NEXT_PUBLIC_SHIELDRATE_ENABLED=true

# Optional
CRON_SECRET=generate-random-secret
LOG_LEVEL=info
NODE_ENV=production
```

---

## ✅ Post-Deployment Checklist

- [ ] Health check: `curl https://vantirs.com/api/health`
- [ ] Dashboard loads: https://vantirs.com
- [ ] Test webhook in Stripe Dashboard
- [ ] Run 12-month backfill: `curl -X POST https://vantirs.com/api/onboarding/sync-transactions`
- [ ] Verify dispute in Supabase

---

## 🎯 Critical: 12-Month Backfill

**Run immediately after deployment:**

```bash
curl -X POST https://vantirs.com/api/onboarding/sync-transactions
```

**Why:** CE 3.0 matching requires 120-365 days of history. Without this, matching won't work for 4 months.

---

**Full details in: `PRODUCTION_DEPLOYMENT.md`**

