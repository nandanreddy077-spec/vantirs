# Quick Verification Checklist

## ✅ What's Working

- [x] Health check: All systems operational
- [x] Dashboard: Loading successfully  
- [x] Database: Connected
- [x] Stripe: Connected
- [x] Test disputes: Triggered (2x)

## ❓ What to Verify

### 1. Check `stripe listen` Terminal

**Look for lines like:**
```
2026-02-02 ... charge.dispute.created [200] ...
```

**Status codes:**
- `[200]` = ✅ Webhook forwarded successfully
- `[500]` = ❌ Server error (check dev server)
- `[400]` = ❌ Bad request (check webhook secret)
- **No line** = ❌ Webhook not received

**If you don't see any lines:**
- Make sure `stripe listen` is still running
- Restart it: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### 2. Check Dev Server Logs

**Look for:**
- `WEBHOOK_VERIFIED` - Signature verified ✅
- `DISPUTE_RECEIVED` - Processing started ✅
- `CE3_MATCH_FOUND` or `CE3_NO_MATCH` - Matching completed ✅
- Any red error messages ❌

**If you don't see logs:**
- Pino logger might need `pino-pretty` installed
- Check if webhook endpoint is being hit

### 3. Check Supabase Database

1. Go to: https://supabase.com/dashboard/project/wsmthoimcnlxebvxhisp/editor
2. Click `disputes` table
3. Check if new rows exist

**If no disputes:**
- Webhook wasn't processed
- Check for errors in logs

## 🔧 Quick Fixes

### If `stripe listen` isn't running:

```bash
# Start it in a new terminal
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### If logs aren't showing:

```bash
# Install pino-pretty for readable logs
npm install pino-pretty --save-dev
```

Then restart dev server.

### If webhooks aren't being received:

1. **Verify webhook secret matches:**
   ```bash
   # Check .env.local
   grep STRIPE_WEBHOOK_SECRET .env.local
   ```

2. **Restart dev server:**
   ```bash
   # Stop (Ctrl+C) and restart
   npm run dev
   ```

3. **Test webhook endpoint directly:**
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

## 🎯 Next Steps

Once you verify:
1. ✅ Webhooks are being received (`[200]` in `stripe listen`)
2. ✅ Logs show processing (in dev server)
3. ✅ Disputes appear in Supabase

Then you can:
- Run 12-month backfill
- Test with more disputes
- Deploy to production

---

**Please check your `stripe listen` terminal and share what you see!**

