# 🔧 Fix Production 405 Error

## Status
- ✅ **Local:** Working perfectly (returns 400 for invalid key - correct behavior)
- ❌ **Production:** Returns 405 Method Not Allowed

## Root Cause
Vercel deployment/routing issue - the route works locally but isn't recognized in production.

## Solutions to Try

### Option 1: Check Vercel Function Logs
1. Go to Vercel Dashboard → Your Project
2. Click "Functions" tab
3. Look for `/api/onboarding/connect-stripe`
4. Check for errors or routing issues

### Option 2: Rename the Route (Sometimes Fixes Routing Issues)
```bash
# Rename from:
app/api/onboarding/connect-stripe/route.ts
# To:
app/api/onboarding/connect/route.ts
```

Then update any references and redeploy.

### Option 3: Check Next.js Build Output
1. Go to Vercel Dashboard → Latest Deployment
2. Check "Build Logs"
3. Look for:
   - "app/api/onboarding/connect-stripe" in output
   - Any errors about this route
   - TypeScript compilation errors

### Option 4: Verify Route Export
Make sure the route file has:
```typescript
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) { ... }
export async function OPTIONS(req: NextRequest) { ... }
```

### Option 5: Use OAuth Flow Instead (Recommended)
The OAuth flow is already working in production:
- Endpoint: `/api/onboarding/stripe-connect`
- Status: ✅ Working (307 redirect)
- Better UX anyway

## Quick Test After Fix

```bash
curl -X POST https://www.vantirs.com/api/onboarding/connect-stripe \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","stripe_secret_key":"rk_test_REAL_KEY","stripe_webhook_secret":"whsec_REAL_SECRET"}'
```

**Expected:** JSON response (not 405)

## Recommendation

Since:
- ✅ Local endpoint works
- ✅ OAuth flow works in production
- ❌ Manual endpoint has 405 in production

**Use OAuth flow for now** - it's better UX and already working. Fix the manual endpoint later if needed.

---

**Priority:** Medium (OAuth is working, manual endpoint is nice-to-have)


