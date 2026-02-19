# 🚨 Critical Deployment Issue - Onboarding Endpoint

## Problem

The `/api/onboarding/connect-stripe` endpoint is returning **405 Method Not Allowed** in production.

**Error:**
```
Status: 405
Empty response from https://www.vantirs.com/api/onboarding/connect-stripe
```

## Root Cause

The route file exists (`app/api/onboarding/connect-stripe/route.ts`) but may not be properly deployed to Vercel.

## Solution: Redeploy to Vercel

### Option 1: Trigger Redeploy via Git (Recommended)

1. **Make a small change to trigger redeploy:**
   ```bash
   # Add a comment to trigger rebuild
   git add .
   git commit -m "fix: trigger redeploy for onboarding endpoint"
   git push
   ```

2. **Or force redeploy in Vercel:**
   - Go to Vercel Dashboard → Your Project
   - Click "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

### Option 2: Check Vercel Build Logs

1. Go to Vercel Dashboard → Your Project
2. Click on latest deployment
3. Check "Build Logs" for errors
4. Look for:
   - Missing route files
   - Build errors
   - TypeScript compilation errors

### Option 3: Verify Route is Included

Check if the route file is in your repository:

```bash
ls -la app/api/onboarding/connect-stripe/route.ts
```

If it exists, the issue is deployment. If it doesn't exist, you need to commit it.

## Quick Test After Redeploy

```bash
curl -X POST https://www.vantirs.com/api/onboarding/connect-stripe \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@test.com",
    "stripe_secret_key": "rk_test_test",
    "stripe_webhook_secret": "whsec_test"
  }'
```

**Expected:** JSON response (not 405)

## Alternative: Use OAuth Flow

If the manual onboarding endpoint isn't working, you can use the OAuth flow:

**Endpoint:** `/api/onboarding/stripe-connect`

This redirects users to Stripe OAuth, which is more reliable.

## Next Steps

1. ✅ Redeploy to Vercel
2. ✅ Test endpoint after redeploy
3. ✅ Run validation script again
4. ✅ If still failing, check Vercel logs for errors

---

**Status:** ⚠️ **BLOCKING MARKETING** - Fix before launch!


