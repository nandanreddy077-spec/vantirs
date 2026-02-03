# 🚀 Production Deployment - Step-by-Step Guide

## Overview
This guide will walk you through:
1. ✅ Pushing code to GitHub
2. ✅ Deploying to Vercel
3. ✅ Running production backfill

---

## Step 1: Prepare Git Repository

### 1.1 Check Current Status
```bash
# Make sure you're in the ShieldRate directory
cd /Users/nandanreddyavanaganti/ShieldRate

# Check git status
git status
```

### 1.2 Stage All Files
```bash
# Add all project files (excluding .env.local which is in .gitignore)
git add .

# Verify what will be committed
git status
```

### 1.3 Create Initial Commit
```bash
# Create your first commit
git commit -m "Production ready - Vantirs CE 3.0 Compliance Engine

- PDF validation fixed and working
- Webhook processing tested
- Database schema ready
- All features production-ready"
```

---

## Step 2: Set Up GitHub Repository

### 2.1 Create GitHub Repository
1. **Go to GitHub:**
   - Visit: https://github.com/new
   - Or: https://github.com → Click "+" → "New repository"

2. **Repository Settings:**
   - **Name:** `vantirs` (or `shieldrate` or your preferred name)
   - **Description:** "CE 3.0 Compliance Engine for Chargeback Defense"
   - **Visibility:** Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

3. **Copy the repository URL:**
   - You'll see: `https://github.com/YOUR_USERNAME/vantirs.git`
   - Copy this URL

### 2.2 Connect Local Repository to GitHub
```bash
# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/vantirs.git

# Verify remote is added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

**If you get authentication error:**
- Use GitHub Personal Access Token instead of password
- Or use SSH: `git remote add origin git@github.com:YOUR_USERNAME/vantirs.git`

---

## Step 3: Get Production Stripe Keys

### 3.1 Switch to Live Mode
1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com
   - Toggle to **"Live mode"** (top right, switch from "Test mode")

### 3.2 Create Production Restricted Key
1. **Navigate:**
   - Developers → API keys → "Create restricted key"

2. **Settings:**
   - **Name:** `Vantirs Production`
   - **Permissions:** 
     - ✅ `charges:read`
     - ✅ `disputes:read`
     - ✅ `disputes:write`
   - Click "Create key"

3. **Copy the key:**
   - It will start with `rk_live_...`
   - **SAVE THIS SECURELY** - you won't see it again!

### 3.3 Create Production Webhook
1. **Navigate:**
   - Developers → Webhooks → "Add endpoint"

2. **Settings:**
   - **Endpoint URL:** `https://vantirs.com/api/webhooks/stripe`
   - **Description:** `Vantirs Production Webhook`
   - **Events to send:** Select `charge.dispute.created`
   - Click "Add endpoint"

3. **Copy the webhook secret:**
   - Click "Reveal" next to "Signing secret"
   - It will start with `whsec_...`
   - **SAVE THIS SECURELY**

### 3.4 Get Publishable Key
1. **Navigate:**
   - Developers → API keys
   - Copy the "Publishable key" (Live mode)
   - It will start with `pk_live_...`

---

## Step 4: Deploy to Vercel

### 4.1 Create Vercel Account (if needed)
1. **Go to Vercel:**
   - https://vercel.com
   - Sign up/Login with GitHub (recommended)

### 4.2 Import Repository
1. **Click "Add New Project"**
2. **Import Git Repository:**
   - Select your GitHub account
   - Find and select `vantirs` repository
   - Click "Import"

### 4.3 Configure Project
1. **Framework Preset:**
   - Should auto-detect "Next.js"
   - If not, select "Next.js"

2. **Root Directory:**
   - Leave as `.` (root)

3. **Build Settings:**
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

### 4.4 Add Environment Variables
**CRITICAL:** Add these BEFORE deploying!

1. **Click "Environment Variables"** (or "Add Environment Variables")

2. **Add each variable one by one:**

   ```bash
   # Stripe (PRODUCTION - Live Mode)
   STRIPE_SECRET_KEY=rk_live_YOUR_PRODUCTION_KEY_HERE
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET_HERE
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
   
   # Supabase (from your .env.local)
   NEXT_PUBLIC_SUPABASE_URL=https://wsmthoimcnlxebvxhisp.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your actual key)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your actual key)
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=https://vantirs.com
   NEXT_PUBLIC_SHIELDRATE_ENABLED=true
   NODE_ENV=production
   LOG_LEVEL=info
   ```

3. **For each variable:**
   - Enter the variable name
   - Enter the value
   - Select environment: ✅ Production, ✅ Preview, ✅ Development
   - Click "Add"

4. **Verify all variables are added:**
   - Check the list to ensure nothing is missing

### 4.5 Deploy
1. **Click "Deploy"**
2. **Wait for build to complete** (2-5 minutes)
3. **You'll get a URL:** `https://vantirs-xxxxx.vercel.app`

### 4.6 Add Custom Domain
1. **Go to Project Settings:**
   - Click on your project → Settings → Domains

2. **Add Domain:**
   - Enter: `vantirs.com`
   - Click "Add"
   - Enter: `www.vantirs.com`
   - Click "Add"

3. **Configure DNS:**
   - Vercel will show you DNS records to add
   - Follow the instructions (see Step 5)

---

## Step 5: Configure Domain DNS (Namecheap)

### 5.1 Get DNS Records from Vercel
1. **In Vercel:**
   - Settings → Domains → `vantirs.com`
   - You'll see DNS configuration instructions

2. **You'll need:**
   - Either nameservers (recommended)
   - Or A/CNAME records

### 5.2 Update DNS in Namecheap

**Option A: Use Vercel Nameservers (Recommended)**
1. **Go to Namecheap:**
   - https://www.namecheap.com/myaccount/login/
   - Domain List → Manage `vantirs.com`

2. **Update Nameservers:**
   - Click "Nameservers" tab
   - Select "Custom DNS"
   - Enter Vercel's nameservers (from Vercel dashboard)
   - Click "Save"

**Option B: Use DNS Records**
1. **Go to Namecheap:**
   - Domain List → Manage `vantirs.com` → Advanced DNS

2. **Add Records:**
   - Add A record: `@` → Vercel IP (from Vercel)
   - Add CNAME: `www` → `cname.vercel-dns.com`
   - Save changes

### 5.3 Wait for DNS Propagation
- **Time:** 5 minutes to 48 hours (usually 1-2 hours)
- **Check status:** Vercel dashboard will show "Valid Configuration" when ready
- **SSL:** Vercel automatically provisions SSL certificate

---

## Step 6: Verify Deployment

### 6.1 Health Check
```bash
# Test health endpoint
curl https://vantirs.com/api/health

# Should return:
# {"status":"ok","timestamp":"...","checks":{"environment":true,"database":true,"stripe":true}}
```

### 6.2 Dashboard Check
1. **Visit:** https://vantirs.com
2. **Verify:**
   - Dashboard loads without errors
   - No console errors
   - Disputes table is visible

### 6.3 Test Webhook
1. **In Stripe Dashboard:**
   - Developers → Webhooks
   - Click on your production webhook
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

## Step 7: Run Production Backfill (CRITICAL!)

**⚠️ DO THIS IMMEDIATELY AFTER DEPLOYMENT**

This syncs 12 months of historical transactions so CE 3.0 matching works from day 1.

### 7.1 Via API (Recommended)
```bash
# Run the backfill
curl -X POST https://vantirs.com/api/onboarding/sync-transactions

# Expected response:
# {
#   "success": true,
#   "message": "Synced X transactions from last 12 months...",
#   "result": {
#     "total": 150,
#     "synced": 120,
#     "skipped": 30,
#     "errors": 0
#   }
# }
```

### 7.2 Verify in Supabase
1. **Go to Supabase:**
   - Table Editor → `transactions` table
   - You should see many rows (hundreds/thousands depending on your Stripe account)

### 7.3 What This Does
- ✅ Syncs all successful charges from last 12 months
- ✅ Extracts IP addresses, device fingerprints
- ✅ Stores customer emails and billing descriptors
- ✅ Enables CE 3.0 matching immediately
- ✅ Without this, matching won't work for 4 months!

---

## Step 8: Final Verification

### 8.1 Complete Checklist
- [ ] Code pushed to GitHub
- [ ] Repository is private/secure
- [ ] Vercel deployment successful
- [ ] All environment variables added
- [ ] Domain configured (vantirs.com)
- [ ] SSL certificate active
- [ ] Health check passes
- [ ] Dashboard loads
- [ ] Production webhook configured in Stripe
- [ ] Test webhook processed successfully
- [ ] 12-month backfill completed
- [ ] Transactions table has data

### 8.2 Test Real Dispute (Optional)
1. **Create a test charge in Stripe (Live mode)**
2. **Create a test dispute:**
   - Payments → Select charge → "Create dispute"
3. **Verify:**
   - Webhook is received
   - Dispute appears in Supabase
   - PDF can be generated
   - Dashboard shows the dispute

---

## Troubleshooting

### GitHub Push Fails
```bash
# If authentication fails, use Personal Access Token:
# 1. GitHub → Settings → Developer settings → Personal access tokens
# 2. Generate token with "repo" scope
# 3. Use token as password when pushing
```

### Vercel Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Check that `package.json` has correct scripts

### Domain Not Working
- Wait 24-48 hours for DNS propagation
- Verify DNS records in Namecheap
- Check Vercel domain status

### Webhook Not Working
- Verify webhook URL in Stripe: `https://vantirs.com/api/webhooks/stripe`
- Check webhook secret matches Vercel environment variable
- Check Vercel logs for errors

### Backfill Returns 0 Transactions
- This is normal if you don't have production charges yet
- It will sync transactions as they come in
- For testing, you can create test charges in Live mode

---

## Success! 🎉

Once all steps are complete:
- ✅ Vantirs is live at https://vantirs.com
- ✅ Processing real disputes automatically
- ✅ CE 3.0 matching enabled
- ✅ Ready for production use

**Next Steps:**
- Monitor dashboard regularly
- Set up alerts for webhook failures
- Track VAMP ratio
- Onboard your first customer!

