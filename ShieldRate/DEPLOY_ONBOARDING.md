# Deploy Onboarding Page

The onboarding page is ready but needs to be deployed to Vercel.

## Quick Fix for 404 Error

### Option 1: Deploy to Vercel (Recommended)

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Add multi-tenant onboarding page"
   git push origin main
   ```

2. **Vercel will auto-deploy** - the onboarding page will be available at:
   - `https://vantirs.com/onboarding`
   - `https://your-app.vercel.app/onboarding`

### Option 2: Test Locally First

1. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Visit locally:**
   - `http://localhost:3000/onboarding`

## Verify Onboarding Page

After deployment, test:

1. **Visit:** `https://vantirs.com/onboarding`
2. **Should see:** Form with fields for:
   - Company Name
   - Contact Email
   - Stripe Restricted Key
   - Webhook Secret
   - Publishable Key (optional)

3. **Test connection** with a Stripe test account

## PDF Validation Fix

The `pdf-parse` import issue has been fixed. The validator will now:
- Try to use `pdf-parse` for text extraction
- Fall back to regex extraction if `pdf-parse` fails
- Still validate PDF structure (size, pages) even if text extraction fails

---

**Status**: ✅ Code ready, needs deployment

