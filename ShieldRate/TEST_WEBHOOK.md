# Testing Your Webhook Setup

## ✅ Current Status

- [x] Supabase credentials configured
- [x] Stripe restricted key added
- [x] Stripe webhook secret added
- [x] Dev server running
- [x] Stripe CLI forwarding webhooks

## 🔴 Still Need to Do

### 1. Run Database Migrations (CRITICAL)

Before testing, you need to create the database tables:

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/wsmthoimcnlxebvxhisp/sql/new

2. **Run the schema:**
   - Copy contents of `database/schema.sql`
   - Paste into SQL Editor
   - Click "Run" (or Cmd+Enter)

3. **Verify tables created:**
   - Go to "Table Editor" in Supabase
   - Should see: `disputes`, `transactions`, `user_activity_logs`, `action_taxonomy`

### 2. Restart Dev Server

**Important:** Restart your dev server to load the new webhook secret:

```bash
# Stop the server (Ctrl+C in the terminal running npm run dev)
# Then restart:
npm run dev
```

### 3. Test the Webhook

**In a NEW terminal window**, trigger a test dispute:

```bash
stripe trigger charge.dispute.created
```

**What to expect:**
- You'll see webhook received in your `stripe listen` terminal
- Processing logs in your dev server terminal
- Check Supabase `disputes` table - a new dispute should appear

### 4. Test Health Check

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

## 🎯 Next Steps After Testing

1. **Run 12-month backfill:**
   ```bash
   curl -X POST http://localhost:3000/api/onboarding/sync-transactions
   ```

2. **Check dashboard:**
   - Visit: http://localhost:3000
   - Should see the Vantirs dashboard

3. **Deploy to production:**
   - Push to GitHub
   - Deploy to Vercel
   - Add environment variables in Vercel
   - Create production webhook in Stripe Dashboard

---

**Ready to test? Run the database migrations first, then restart your dev server!**



