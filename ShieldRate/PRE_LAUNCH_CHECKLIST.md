# 🚀 Pre-Launch Validation Checklist

**Date:** February 14, 2026  
**Status:** ⚠️ **REQUIRED BEFORE MARKETING**

---

## ⚠️ CRITICAL: Run This Before Marketing

**Time Required:** 30-60 minutes  
**Impact:** If these fail, your product won't work for customers

---

## 🧪 Automated Validation

### Quick Start

```bash
# Run full validation script
npx tsx scripts/validate-production.ts https://vantirs.com
```

This script will:
1. ✅ Test health check
2. ✅ Test onboarding flow
3. ✅ Test transaction sync
4. ✅ Test dashboard API
5. ✅ Test webhook processing (manual step)
6. ✅ Test PDF generation
7. ✅ Test evidence submission (optional)

**All critical tests must pass before marketing!**

---

## 📋 Manual Checklist

If you prefer to test manually, follow this checklist:

### ✅ Phase 1: Onboarding (10 min)

- [ ] **Create Test Merchant**
  ```bash
  curl -X POST https://vantirs.com/api/onboarding/connect-stripe \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Merchant",
      "email": "your-email@example.com",
      "stripe_secret_key": "rk_test_...",
      "stripe_webhook_secret": "whsec_..."
    }'
  ```

- [ ] **Verify:**
  - [ ] API key returned (format: `vant_<hex>`)
  - [ ] Merchant ID returned
  - [ ] Webhook URL provided
  - [ ] Check Supabase → `merchants` table
    - [ ] Merchant record exists
    - [ ] Stripe keys encrypted (not plaintext)
    - [ ] API key hashed (not plaintext)

---

### ✅ Phase 2: Transaction Sync (5 min)

- [ ] **Run 12-Month Backfill**
  ```bash
  curl -X POST "https://vantirs.com/api/onboarding/sync-transactions?merchant_id=YOUR_MERCHANT_ID" \
    -H "Authorization: Bearer YOUR_API_KEY"
  ```

- [ ] **Verify:**
  - [ ] Transactions synced (check response)
  - [ ] Check Supabase → `transactions` table
    - [ ] Rows created
    - [ ] IP addresses extracted (if available)
    - [ ] Device fingerprints extracted (if available)

---

### ✅ Phase 3: Webhook Processing (10 min)

- [ ] **Create Test Dispute in Stripe**
  1. Go to Stripe Dashboard → Payments
  2. Find a test charge
  3. Click "..." → "Create dispute"
  4. Select reason and submit

- [ ] **Verify:**
  - [ ] Check Vercel logs for `DISPUTE_RECEIVED`
  - [ ] Check Supabase → `disputes` table
    - [ ] New dispute record created
    - [ ] `stripe_dispute_id` populated
    - [ ] `merchant_id` matches
    - [ ] `ce3_eligible` calculated
    - [ ] `v_compliance_score` calculated (0-100)

---

### ✅ Phase 4: PDF Generation (5 min)

- [ ] **Download Compliance Pack**
  ```bash
  curl -H "Authorization: Bearer YOUR_API_KEY" \
    https://vantirs.com/api/disputes/DISPUTE_ID/pdf \
    --output test-dispute.pdf
  ```

- [ ] **Verify:**
  - [ ] PDF downloads successfully
  - [ ] PDF opens without errors
  - [ ] PDF contains:
    - [ ] Dispute details
    - [ ] Compliance checklist
    - [ ] CE 3.0 evidence (if eligible)
    - [ ] Historical matches (if found)
  - [ ] PDF size reasonable (< 5MB)

---

### ✅ Phase 5: Evidence Submission (10 min)

- [ ] **Submit Evidence to Stripe**
  ```bash
  curl -X POST \
    -H "Authorization: Bearer YOUR_API_KEY" \
    https://vantirs.com/api/disputes/DISPUTE_ID/submit
  ```

- [ ] **Verify:**
  - [ ] Response shows `success: true`
  - [ ] Check Stripe Dashboard → Disputes
    - [ ] Evidence file attached
    - [ ] Evidence details populated
  - [ ] Check Supabase → `disputes` table
    - [ ] Status updated to `submitted`

---

## 🎯 Success Criteria

### ✅ Ready to Market If:
- [x] All 5 critical tests pass
- [x] Onboarding creates merchant successfully
- [x] Webhook processes disputes
- [x] PDF generates correctly
- [x] Evidence submits to Stripe

### ❌ DO NOT Market If:
- [ ] Any critical test fails
- [ ] Webhook not receiving events
- [ ] PDF generation broken
- [ ] Evidence submission failing
- [ ] Database errors in logs

---

## 🐛 Troubleshooting

### Issue: Onboarding Fails
**Check:**
- Stripe key format (must be `rk_test_...` or `rk_live_...`)
- Webhook secret format (must be `whsec_...`)
- Stripe key has correct permissions
- Database connection working

### Issue: Webhook Not Processing
**Check:**
- Webhook URL configured in Stripe Dashboard
- Webhook secret matches
- Vercel logs for errors
- Database connection working

### Issue: PDF Generation Fails
**Check:**
- Vercel logs for PDF generation errors
- Dispute has required data
- PDFKit fonts copied (should be automatic)

### Issue: Evidence Submission Fails
**Check:**
- Stripe key has `disputes:write` permission
- Dispute status allows submission
- Vercel logs for submission errors

---

## 📊 Validation Results

After running validation, you should see:

```
✅ Passed: 7
❌ Failed: 0
📈 Success Rate: 100.0%

🔴 Critical Tests:
   ✅ Passed: 5
   ❌ Failed: 0

🎉 ALL TESTS PASSED!
✅ Ready for marketing launch!
```

---

## 🚀 Post-Validation Steps

Once all tests pass:

1. **Save Credentials**
   - Save API key securely
   - Document merchant ID
   - Note webhook URL

2. **Configure Production Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://vantirs.com/api/webhooks/stripe/[MERCHANT_ID]`
   - Select: `charge.dispute.created`
   - Copy webhook secret

3. **Monitor First Customer**
   - Watch Vercel logs
   - Monitor Supabase for new merchants
   - Be ready to fix issues quickly

4. **Launch! 🚀**
   - Start marketing
   - Onboard first customers
   - Monitor closely for 24-48 hours

---

## ⚠️ Important Notes

- **Test Mode First:** Always test with Stripe test keys first
- **Monitor Logs:** Watch Vercel logs during first customer onboarding
- **Be Ready:** Have access to fix issues quickly
- **Document Issues:** Track any problems for quick fixes

---

**Ready? Run the validation script and get your green light! 🚀**

```bash
npx tsx scripts/validate-production.ts https://vantirs.com
```




