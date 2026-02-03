# 🇮🇳 Stripe Setup for Indian Businesses

## Stripe in India - Overview

Stripe is available in India through **Stripe India** (stripe.com/in). Indian businesses can accept payments and use Stripe's full suite of features.

---

## Step 1: Create/Verify Stripe India Account

### If You Don't Have a Stripe Account Yet:

1. **Go to Stripe India:**
   - https://stripe.com/in
   - Click "Start now" or "Create account"

2. **Sign Up:**
   - Use your business email
   - Choose "India" as your country
   - Select business type (Sole Proprietor, Private Limited, etc.)

3. **Business Information Required:**
   - **Business Name** (as per GST registration)
   - **GST Number** (if applicable)
   - **PAN Number** (Permanent Account Number)
   - **Business Address** (registered address)
   - **Bank Account Details** (for payouts)
   - **Business Type** (Sole Proprietor, Partnership, Private Limited, etc.)

4. **Verification:**
   - Upload business documents (GST certificate, PAN card, etc.)
   - Verify bank account
   - Complete KYC (Know Your Customer) process

### If You Already Have a Stripe Account:

1. **Log in:**
   - https://dashboard.stripe.com
   - Make sure your account is set to India

2. **Verify Account Status:**
   - Settings → Account → Check if account is active
   - Ensure all documents are verified

---

## Step 2: Get Your Stripe API Keys

### For Testing (Test Mode):

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/test/apikeys
   - Make sure "Test mode" toggle is ON (top right)

2. **Create Restricted Key:**
   - Click "Create restricted key"
   - Name: `Vantirs Test`
   - Permissions: 
     - ✅ `charges:read`
     - ✅ `disputes:read`
     - ✅ `disputes:write`
   - Copy the key (starts with `rk_test_...`)

3. **Get Webhook Secret:**
   - Developers → Webhooks → Add endpoint
   - URL: `http://localhost:3000/api/webhooks/stripe` (for local testing)
   - Event: `charge.dispute.created`
   - Copy signing secret (starts with `whsec_...`)

### For Production (Live Mode):

1. **Switch to Live Mode:**
   - Toggle "Test mode" to OFF (top right)
   - You'll see "Live mode" indicator

2. **Create Production Restricted Key:**
   - Developers → API keys → Create restricted key
   - Name: `Vantirs Production`
   - Permissions: Same as test (charges:read, disputes:read, disputes:write)
   - Copy the key (starts with `rk_live_...`)

3. **Create Production Webhook:**
   - Developers → Webhooks → Add endpoint
   - URL: `https://vantirs.com/api/webhooks/stripe`
   - Event: `charge.dispute.created`
   - Copy signing secret (starts with `whsec_...`)

---

## Step 3: Indian Business Considerations

### Important Notes for Indian Merchants:

1. **GST Compliance:**
   - Stripe automatically handles GST on payments
   - Ensure your business is GST registered if required
   - Stripe will generate GST-compliant invoices

2. **Payment Methods:**
   - Stripe supports: Credit/Debit cards, UPI, Net Banking, Wallets
   - All major Indian payment methods are supported

3. **Currency:**
   - Default currency: INR (Indian Rupees)
   - Stripe handles currency conversion automatically

4. **Payouts:**
   - Payouts go to your Indian bank account
   - Typical payout time: 2-7 business days
   - Minimum payout: ₹100

5. **Disputes/Chargebacks:**
   - Same process as international merchants
   - Vantirs will help you fight chargebacks with CE 3.0 evidence
   - Dispute fees apply (same as international)

---

## Step 4: Connect Stripe to Vantirs

### Local Development (Test Mode):

1. **Add to `.env.local`:**
   ```bash
   # Stripe Test Keys (from Stripe Dashboard - Test Mode)
   STRIPE_SECRET_KEY=rk_test_YOUR_TEST_RESTRICTED_KEY
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY
   ```

2. **Test Webhook:**
   ```bash
   # Use Stripe CLI for local testing
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Production (Live Mode):

1. **Add to Vercel Environment Variables:**
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Add all Stripe keys from Live Mode
   - Make sure to select "Production" environment

2. **Update Webhook URL:**
   - In Stripe Dashboard → Webhooks
   - Update endpoint to: `https://vantirs.com/api/webhooks/stripe`

---

## Step 5: Verify Your Setup

### Test Locally:

```bash
# 1. Check health endpoint
curl http://localhost:3000/api/health

# 2. Trigger test dispute
stripe trigger charge.dispute.created

# 3. Check logs for successful processing
```

### Test in Production:

1. **Health Check:**
   ```bash
   curl https://vantirs.com/api/health
   ```

2. **Test Webhook:**
   - Stripe Dashboard → Webhooks → Send test webhook
   - Select: `charge.dispute.created`
   - Check Vercel logs for processing

---

## Common Issues for Indian Merchants

### Issue 1: Account Not Verified
**Solution:**
- Complete KYC process
- Upload all required documents
- Wait for verification (usually 1-2 business days)

### Issue 2: GST Number Required
**Solution:**
- If your business requires GST registration, get it first
- If exempt, contact Stripe support for exemption

### Issue 3: Bank Account Verification
**Solution:**
- Ensure bank account is in business name
- Complete micro-deposit verification
- Contact bank if verification fails

### Issue 4: Payment Methods Not Showing
**Solution:**
- Check account activation status
- Ensure all verifications are complete
- Contact Stripe support if needed

---

## Support Resources

### Stripe India Support:
- **Email:** support@stripe.com
- **Phone:** Check Stripe dashboard for India support number
- **Documentation:** https://stripe.com/docs/payments/india

### Stripe India Dashboard:
- https://dashboard.stripe.com
- Make sure you're logged into the correct account

### Vantirs Support:
- Check `PRODUCTION_DEPLOYMENT.md` for deployment help
- Review webhook logs in Vercel for debugging

---

## Quick Checklist for Indian Merchants

- [ ] Stripe India account created/verified
- [ ] Business documents uploaded (GST, PAN, etc.)
- [ ] Bank account verified
- [ ] Test mode keys obtained
- [ ] Test webhook working locally
- [ ] Production keys obtained (after account activation)
- [ ] Production webhook configured
- [ ] Vantirs connected to Stripe
- [ ] Test dispute processed successfully

---

## Next Steps

1. **Complete Stripe Account Setup:**
   - Verify your business
   - Get API keys

2. **Connect to Vantirs:**
   - Add keys to `.env.local` (test) or Vercel (production)
   - Configure webhooks

3. **Deploy:**
   - Follow `PRODUCTION_DEPLOYMENT.md`
   - Test with real disputes

---

**Note:** Stripe India works exactly like Stripe in other countries. The main difference is the business verification process (GST, PAN, etc.) and supported payment methods (UPI, Net Banking, etc.). Vantirs works seamlessly with Stripe India! 🇮🇳

