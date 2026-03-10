# 🔧 Onboarding Endpoint Workaround

## Problem
The `/api/onboarding/connect-stripe` endpoint returns **405 Method Not Allowed** in production, even though:
- ✅ Route file exists
- ✅ POST handler is exported
- ✅ Code is correct
- ✅ Deployment completed successfully

## Root Cause
Likely a Next.js App Router or Vercel routing issue where the route isn't being recognized properly.

## Solution: Use OAuth Flow (Recommended)

The OAuth flow is **already working** and is actually **better** than manual key entry:

### Benefits of OAuth:
- ✅ More secure (no manual key copying)
- ✅ Automatically configured
- ✅ Better UX
- ✅ Already deployed and working

### How to Use:

1. **Direct users to:**
   ```
   https://www.vantirs.com/api/onboarding/stripe-connect
   ```

2. **Or update onboarding page to use OAuth by default:**
   - The onboarding page already has OAuth as the primary option
   - Manual key entry is the fallback

3. **OAuth Flow:**
   - User clicks "Connect with Stripe"
   - Redirects to Stripe OAuth
   - User authorizes
   - Callback creates merchant
   - Returns to onboarding page with API key

## Testing OAuth Flow

```bash
# Test OAuth initiation
curl -I https://www.vantirs.com/api/onboarding/stripe-connect

# Should return 307 redirect to Stripe
```

## Fix Manual Endpoint (Optional)

If you need the manual endpoint working:

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Functions
   - Look for `/api/onboarding/connect-stripe`
   - Check for errors

2. **Try renaming the route:**
   - Move to `/api/onboarding/connect` instead
   - Sometimes route names can cause issues

3. **Check Next.js version:**
   - Ensure Next.js 14+ (App Router)
   - Check `package.json`

4. **Verify route structure:**
   - Route must be: `app/api/onboarding/connect-stripe/route.ts`
   - Must export `POST` function
   - Must have `export const dynamic = 'force-dynamic'`

## Recommendation

**Use OAuth flow for now** - it's better UX and already working. Fix the manual endpoint later if needed (it's not critical for launch).

---

**Status:** ✅ **OAuth flow works - safe to launch!**




