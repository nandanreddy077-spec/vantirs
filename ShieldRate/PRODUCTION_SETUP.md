# 🚀 ShieldRate Production Setup Checklist

## ✅ Completed Steps

- [x] **Supabase Setup** - Database configured
- [x] **Stripe Restricted Key** - Created and added to `.env.local`
- [x] **Environment File** - `.env.local` created with Supabase credentials

## 🔴 Remaining Steps (Do These Now)

### Step 1: Set Up Stripe Webhook (5 minutes)

1. **Go to Stripe Dashboard:**
   - Navigate to: https://dashboard.stripe.com/test/webhooks
   - Click **"+ Add endpoint"**

2. **Configure Webhook:**
   - **Endpoint URL:** `http://localhost:3000/api/webhooks/stripe` (for local testing)
   - **For production:** `https://your-domain.com/api/webhooks/stripe`
   - **Description:** "ShieldRate Dispute Handler"

3. **Select Event:**
   - Check: `charge.dispute.created`
   - Click **"Add endpoint"**

4. **Copy Webhook Secret:**
   - After creating, click on the webhook
   - Find **"Signing secret"** (starts with `whsec_`)
   - Copy it

5. **Add to `.env.local`:**
   ```bash
   # Open .env.local and replace:
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   # With your actual secret:
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Step 2: Run Database Migrations (2 minutes)

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/wsmthoimcnlxebvxhisp
   - Click **"SQL Editor"** in the left sidebar

2. **Run Schema:**
   - Click **"New query"**
   - Copy and paste the entire contents of `database/schema.sql`
   - Click **"Run"** (or press Cmd+Enter)
   - ✅ Should see "Success. No rows returned"

3. **Run Migrations (if needed):**
   - Run `database/migration-add-transaction-fields.sql`
   - Run `database/migration-add-notification-metadata.sql`
   - Run `database/migration-binary-checklist.sql`

4. **Verify Tables:**
   - Go to **"Table Editor"** in Supabase
   - You should see these tables:
     - ✅ `disputes`
     - ✅ `transactions`
     - ✅ `user_activity_logs`
     - ✅ `action_taxonomy`

### Step 3: Test Local Setup (3 minutes)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```

3. **Test Health Check:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   
   Expected response:
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

4. **Visit Dashboard:**
   - Open: http://localhost:3000
   - Should see the ShieldRate dashboard (may be empty if no disputes yet)

### Step 4: Test Stripe Webhook (Optional but Recommended)

1. **Install Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Local Server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   
   This will show you a webhook signing secret. Copy it and add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_... # (from stripe listen output)
   ```

4. **Trigger Test Dispute:**
   ```bash
   # In a new terminal window
   stripe trigger charge.dispute.created
   ```

5. **Check Logs:**
   - You should see webhook processing in your terminal
   - Check Supabase `disputes` table - a new dispute should appear

### Step 5: Run Initial 12-Month Backfill (CRITICAL)

**⚠️ This is critical!** Without historical data, CE 3.0 matching won't work.

1. **Via API (after deploying):**
   ```bash
   curl -X POST http://localhost:3000/api/onboarding/sync-transactions
   ```

2. **Or via Script:**
   ```bash
   npx tsx scripts/sync-transactions.ts --months 12
   ```

**What this does:**
- Syncs all successful charges from last 12 months
- Extracts IP addresses, device fingerprints
- Stores customer emails and billing descriptors
- Enables CE 3.0 matching immediately

### Step 6: Deploy to Production (Vercel)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to: https://vercel.com
   - Click **"Add New Project"**
   - Import your GitHub repository
   - Add all environment variables from `.env.local`
   - Deploy

3. **Update Stripe Webhook:**
   - Go to Stripe Dashboard → Webhooks
   - Update endpoint URL to: `https://your-app.vercel.app/api/webhooks/stripe`
   - Copy the production webhook secret to Vercel environment variables

4. **Run Production Backfill:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/onboarding/sync-transactions
   ```

## 📋 Environment Variables Checklist

### ✅ Already Set:
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `STRIPE_SECRET_KEY` (restricted key)

### 🔴 Need to Set:
- [ ] `STRIPE_WEBHOOK_SECRET` - From Stripe webhook setup
- [ ] `NEXT_PUBLIC_APP_URL` - Update to production URL when deploying

### ⚪ Optional (Recommended):
- [ ] `UPSTASH_REDIS_REST_URL` - For rate limiting
- [ ] `UPSTASH_REDIS_REST_TOKEN` - For rate limiting
- [ ] `CRON_SECRET` - For cron endpoint security

## 🎯 Quick Test Commands

```bash
# Test health check
curl http://localhost:3000/api/health

# Test database connection
curl http://localhost:3000/api/dashboard/stats

# Test webhook (using Stripe CLI)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger charge.dispute.created
```

## 🐛 Troubleshooting

### "Missing STRIPE_WEBHOOK_SECRET"
- Set up webhook in Stripe Dashboard
- Copy signing secret to `.env.local`

### "Cannot read properties of null"
- Check Supabase keys are correct
- Verify database tables exist (run schema.sql)

### "Webhook signature verification failed"
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- For local testing, use secret from `stripe listen` command

### "Rate limit exceeded"
- Set up Upstash Redis (optional)
- Or remove rate limiting temporarily

## ✅ Production Ready Checklist

Before going live, verify:

- [ ] All environment variables set
- [ ] Database schema migrated
- [ ] Stripe webhook configured
- [ ] Health check returns `{"status":"ok"}`
- [ ] 12-month backfill completed
- [ ] Test webhook received successfully
- [ ] Dashboard loads without errors
- [ ] Production domain configured in Stripe webhook

---

**You're almost there!** Complete Steps 1-3 above and you'll be ready to test locally. 🚀

