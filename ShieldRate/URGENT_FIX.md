# 🚨 URGENT: Onboarding Endpoint 405 Error Fix

## Problem
The `/api/onboarding/connect-stripe` endpoint returns **405 Method Not Allowed** even after redeploy.

## Root Cause
The route file exists but may not be properly recognized by Next.js App Router in production.

## Solution Applied
✅ Added OPTIONS handler to the route (for CORS preflight)

## Next Steps (DO THIS NOW)

### Option 1: Commit and Push (Recommended)
```bash
git add app/api/onboarding/connect-stripe/route.ts
git commit -m "fix: add OPTIONS handler to onboarding route"
git push
```

This will trigger automatic redeploy on Vercel.

### Option 2: Manual Redeploy
1. Go to Vercel Dashboard
2. Click "Redeploy" on latest deployment
3. Wait 2-3 minutes

### Option 3: Test Locally First
```bash
npm run dev
# In another terminal:
curl -X POST http://localhost:3000/api/onboarding/connect-stripe \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","stripe_secret_key":"rk_test_test","stripe_webhook_secret":"whsec_test"}'
```

If it works locally but not in production, it's a deployment issue.

## Alternative: Use OAuth Flow

If manual onboarding still doesn't work, use the OAuth flow instead:

**Endpoint:** `/api/onboarding/stripe-connect`

This is more reliable and doesn't require manual key entry.

## Verification

After redeploy, test:
```bash
curl -X POST https://www.vantirs.com/api/onboarding/connect-stripe \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","stripe_secret_key":"rk_test_test","stripe_webhook_secret":"whsec_test"}'
```

**Expected:** JSON response with `success: true` or error message  
**Not Expected:** 405 Method Not Allowed

---

**Status:** ⚠️ **BLOCKING** - Fix before marketing!


