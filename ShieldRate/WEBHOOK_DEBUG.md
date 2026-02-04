# Webhook Debugging Guide

## Current Status

✅ **Health Check:** PASSING (all systems operational)
✅ **Dashboard:** Loading successfully
❓ **Disputes:** 0 (webhook may not have processed)

## What to Check

### 1. Check `stripe listen` Terminal

Look for a line like:
```
2026-02-02 ... charge.dispute.created [200] ...
```

**What the status codes mean:**
- `[200]` = Webhook forwarded successfully ✅
- `[400]` = Bad request (check webhook secret)
- `[500]` = Server error (check dev server logs)
- No line = Webhook not received

### 2. Check Dev Server Logs

In your `npm run dev` terminal, look for:

**Success indicators:**
- `WEBHOOK_VERIFIED` - Signature verified
- `DISPUTE_RECEIVED` - Processing started
- `CE3_MATCH_FOUND` or `CE3_NO_MATCH` - Matching completed

**Error indicators:**
- `WEBHOOK_VERIFICATION_FAILED` - Signature mismatch
- `Missing STRIPE_WEBHOOK_SECRET` - Environment variable issue
- Database connection errors
- Any red error messages

### 3. Check Supabase Database

1. Go to: https://supabase.com/dashboard/project/wsmthoimcnlxebvxhisp/editor
2. Click on `disputes` table
3. Check if there's a new row

**If no dispute:**
- Webhook wasn't processed
- Check dev server logs for errors
- Verify database connection

### 4. Common Issues & Fixes

#### Issue: Webhook Not Received
**Symptoms:** No line in `stripe listen` terminal

**Fix:**
1. Make sure `stripe listen` is still running
2. Verify command: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Restart if needed

#### Issue: Signature Verification Failed
**Symptoms:** `WEBHOOK_VERIFICATION_FAILED` in logs

**Fix:**
1. Check `STRIPE_WEBHOOK_SECRET` in `.env.local`
2. Make sure it matches the secret from `stripe listen`
3. Restart dev server after updating

#### Issue: Database Connection Failed
**Symptoms:** Database errors in logs

**Fix:**
1. Verify Supabase credentials in `.env.local`
2. Check Supabase project is active
3. Verify tables exist (run schema.sql if needed)

## Next Steps

1. **Check your terminals** - What do you see?
2. **Check Supabase** - Is there a dispute?
3. **Share the results** - I'll help debug

## Test Again

If nothing happened, try triggering another test dispute:

```bash
stripe trigger charge.dispute.created
```

Then watch both terminals for activity.


