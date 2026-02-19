# 🧪 Testing Solution - Onboarding Endpoint

## Problem
- Manual onboarding endpoint returns 405 (not working)
- OAuth requires Stripe Connect setup (you don't have this)
- Can't test onboarding flow

## Solutions

### Option 1: Create Free Stripe Test Account (5 minutes) ⭐ RECOMMENDED

1. **Go to:** https://dashboard.stripe.com/register
2. **Sign up** (free, no credit card needed)
3. **Get test keys:**
   - Go to Developers → API Keys
   - Copy "Publishable key" (pk_test_...)
   - Create restricted key:
     - Click "Create restricted key"
     - Name: "Vantirs Test"
     - Permissions: `charges:read`, `disputes:read`, `disputes:write`, `files:write`
     - Copy key (rk_test_...)
4. **Create webhook:**
   - Go to Developers → Webhooks
   - Add endpoint: `https://www.vantirs.com/api/webhooks/stripe/[MERCHANT_ID]`
   - Event: `charge.dispute.created`
   - Copy webhook secret (whsec_...)

**Then test with validation script using your test keys!**

### Option 2: Test Locally (If Manual Endpoint Works Locally)

```bash
# Start local server
npm run dev

# In another terminal, test locally:
curl -X POST http://localhost:3000/api/onboarding/connect-stripe \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Merchant",
    "email": "test@example.com",
    "stripe_secret_key": "rk_test_YOUR_KEY",
    "stripe_webhook_secret": "whsec_YOUR_SECRET"
  }'
```

If it works locally but not in production, it's a deployment issue.

### Option 3: Fix the 405 Error

The route file is correct, but Vercel isn't recognizing it. Try:

1. **Rename the route:**
   ```bash
   # Move from:
   app/api/onboarding/connect-stripe/route.ts
   # To:
   app/api/onboarding/connect/route.ts
   ```

2. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Functions
   - Look for errors related to this route

3. **Verify route is in build:**
   - Check Vercel build logs
   - Look for "app/api/onboarding/connect-stripe" in output

### Option 4: Use Alternative Endpoint Structure

Create a new route at a different path to test:

```typescript
// app/api/merchant/connect/route.ts
// Same code, different path
```

## Quick Test: Create Stripe Test Account

**This is the fastest way to test:**

1. Sign up: https://dashboard.stripe.com/register (2 min)
2. Get test keys (2 min)
3. Run validation script (1 min)

**Total: 5 minutes**

## Why This Matters

You need to test:
- ✅ Onboarding creates merchant
- ✅ API key generated
- ✅ Webhook processing
- ✅ Transaction sync
- ✅ Dispute processing

**Without a working onboarding endpoint, you can't test the full flow.**

---

**Recommendation:** Create a free Stripe test account - it's the fastest solution!


