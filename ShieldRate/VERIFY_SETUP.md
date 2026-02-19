# Verify Your Setup - Step by Step

## ✅ What You've Done So Far

- [x] Supabase credentials configured
- [x] Stripe restricted key added
- [x] Stripe webhook secret added
- [x] Database schema run (with trigger fix)
- [x] Dev server running
- [x] Stripe CLI forwarding webhooks
- [x] Test dispute triggered

## 🔍 Verification Steps

### Step 1: Check Webhook Was Received

**In your `stripe listen` terminal**, you should see:
```
2026-02-02 ... charge.dispute.created [200] ...
```

If you see `[200]`, the webhook was successfully forwarded to your server.

### Step 2: Check Dev Server Logs

**In your `npm run dev` terminal**, look for:
- `WEBHOOK_VERIFIED` - Webhook signature verified
- `DISPUTE_RECEIVED` - Dispute processing started
- Any error messages

### Step 3: Check Supabase Database

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/wsmthoimcnlxebvxhisp/editor

2. **Check `disputes` table:**
   - Click on "disputes" table
   - You should see a new row with the test dispute
   - Check fields: `stripe_dispute_id`, `amount`, `status`, `customer_id`

3. **If no dispute appears:**
   - Check the dev server logs for errors
   - Verify database connection is working

### Step 4: Fix Stripe Connection Issue

The health check shows `"stripe": false`. Let's verify your Stripe key:

```bash
# Test Stripe connection
curl http://localhost:3000/api/health
```

**Possible issues:**
- Stripe key might be incorrect
- Stripe key might not have the right permissions
- Network issue

### Step 5: Test Dashboard

1. **Visit:** http://localhost:3000
2. **Check:**
   - Dashboard loads without errors
   - Dispute queue shows the test dispute (if it was created)
   - VAMP monitor displays correctly

## 🐛 Troubleshooting

### No Dispute in Database

**Check dev server logs for:**
- `WEBHOOK_VERIFICATION_FAILED` - Signature mismatch
- `Missing STRIPE_WEBHOOK_SECRET` - Environment variable not loaded
- Database connection errors

**Fix:**
1. Restart dev server to reload environment variables
2. Verify `.env.local` has correct values
3. Check Supabase connection

### Webhook Not Received

**Check `stripe listen` terminal:**
- Should show `[200]` for successful webhooks
- If `[500]` or `[400]`, check dev server logs

**Fix:**
1. Make sure dev server is running
2. Verify webhook URL is correct: `localhost:3000/api/webhooks/stripe`
3. Check webhook secret matches

### Stripe Connection Fails

**Check:**
1. Stripe key format: Should start with `rk_test_` or `rk_live_`
2. Key permissions: Should have `charges:read`, `disputes:read`, `disputes:write`
3. Key is not expired

**Fix:**
1. Verify key in Stripe Dashboard
2. Regenerate if needed
3. Update `.env.local`

## ✅ Success Criteria

You're ready when:
- [ ] Health check shows all green: `{"status":"ok","checks":{"environment":true,"database":true,"stripe":true}}`
- [ ] Test dispute appears in Supabase `disputes` table
- [ ] Dashboard loads at http://localhost:3000
- [ ] No errors in dev server logs

---

**Next Steps After Verification:**
1. Run 12-month backfill: `curl -X POST http://localhost:3000/api/onboarding/sync-transactions`
2. Test with real Stripe data
3. Deploy to production










