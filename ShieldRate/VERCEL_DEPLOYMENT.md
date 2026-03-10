# 🚀 Vercel Deployment Guide

## Quick Deploy Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit https://vercel.com
   - Sign in with GitHub
   - Click "Add New Project"

3. **Import Your Repository**:
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

4. **Configure Project**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

5. **Add Environment Variables** (CRITICAL):
   
   Click "Environment Variables" and add all of these:

   **Required:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

   **Stripe (Required):**
   ```
   STRIPE_SECRET_KEY=rk_live_... (or rk_test_... for testing)
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
   ```

   **Security (Recommended):**
   ```
   ENCRYPTION_KEY=your-32-character-encryption-key
   ```

   **Optional:**
   ```
   STRIPE_CONNECT_CLIENT_ID=ca_... (if using OAuth)
   UPSTASH_REDIS_REST_URL=https://... (if using Redis)
   UPSTASH_REDIS_REST_TOKEN=... (if using Redis)
   ```

6. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

7. **Get Your URL**:
   - After deployment, you'll get: `https://your-app.vercel.app`
   - Update `NEXT_PUBLIC_APP_URL` with this URL
   - Redeploy after updating the environment variable

---

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project? No (first time)
   - Project name: vantirs (or your choice)
   - Directory: ./
   - Override settings? No

4. **Add Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add NEXT_PUBLIC_APP_URL
   vercel env add STRIPE_SECRET_KEY
   vercel env add STRIPE_WEBHOOK_SECRET
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   vercel env add ENCRYPTION_KEY
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## Post-Deployment Checklist

### 1. Update Stripe Webhook URL

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select event: `charge.dispute.created`
4. Copy the webhook signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
6. Redeploy

### 2. Update NEXT_PUBLIC_APP_URL

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
3. Redeploy

### 3. Verify Health Check

```bash
curl https://your-app.vercel.app/api/health
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

### 4. Test Webhook (Optional)

```bash
stripe listen --forward-to https://your-app.vercel.app/api/webhooks/stripe
stripe trigger charge.dispute.created
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL | `https://vantirs.vercel.app` |
| `STRIPE_SECRET_KEY` | Stripe restricted API key | `rk_live_...` or `rk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` or `pk_test_...` |

### Recommended Variables

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `ENCRYPTION_KEY` | 32-character key for AES-256 encryption | `openssl rand -hex 32` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_CONNECT_CLIENT_ID` | For OAuth Stripe Connect |
| `UPSTASH_REDIS_REST_URL` | For Redis rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | For Redis rate limiting |

---

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all required environment variables are set
3. Verify `package.json` has correct build script: `"build": "node scripts/copy-pdfkit-fonts.js && next build"`

### Webhook Not Working

1. Verify webhook URL in Stripe dashboard matches your Vercel URL
2. Check `STRIPE_WEBHOOK_SECRET` is correct
3. Check Vercel function logs for errors

### Database Connection Issues

1. Verify Supabase credentials are correct
2. Check Supabase project is active
3. Ensure database schema is migrated

---

## Custom Domain (Optional)

1. Go to Vercel Dashboard > Your Project > Settings > Domains
2. Add your custom domain (e.g., `vantirs.com`)
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Redeploy

---

## Monitoring

- **Vercel Dashboard**: View deployments, logs, and analytics
- **Health Check**: `https://your-app.vercel.app/api/health`
- **Metrics**: `https://your-app.vercel.app/api/metrics` (if configured)

---

**Ready to deploy?** Follow Option 1 above for the easiest deployment experience! 🚀



