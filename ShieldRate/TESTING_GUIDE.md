# 🧪 Complete Testing Guide for Vantirs

This guide walks you through testing all features of Vantirs, from basic health checks to full end-to-end dispute processing.

---

## 🚀 Quick Start Testing

### 1. Run Automated Tests

```bash
# Test local environment
npx tsx scripts/test-all.ts http://localhost:3000

# Test production
npx tsx scripts/test-all.ts https://vantirs.com
```

This will test:
- ✅ Health checks
- ✅ Input validation
- ✅ Authentication
- ✅ Error handling
- ✅ Public pages

---

## 📋 Manual Testing Checklist

### Phase 1: System Health ✅

#### Test Health Check
```bash
curl https://vantirs.com/api/health | jq .
```

**Expected:**
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

**✅ Pass Criteria:** All checks return `true`

---

### Phase 2: Onboarding Flow

#### Step 1: Create Test Stripe Restricted Key

1. Go to Stripe Dashboard → Developers → API Keys
2. Click "Create restricted key"
3. Name: "Vantirs Test"
4. Permissions:
   - ✅ `charges:read`
   - ✅ `disputes:read`
   - ✅ `disputes:write`
   - ✅ `files:write` (for evidence submission)
5. Copy the restricted key (starts with `rk_test_` or `rk_live_`)

#### Step 2: Create Webhook Endpoint in Stripe

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://vantirs.com/api/webhooks/stripe/[MERCHANT_ID]`
   - Note: You'll get the merchant ID after onboarding
4. Events to listen to: `charge.dispute.created`
5. Copy the webhook signing secret (starts with `whsec_`)

#### Step 3: Onboard Merchant via API

```bash
curl -X POST https://vantirs.com/api/onboarding/connect-stripe \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Merchant",
    "email": "test@example.com",
    "stripe_secret_key": "rk_test_YOUR_KEY",
    "stripe_webhook_secret": "whsec_YOUR_SECRET",
    "stripe_publishable_key": "pk_test_YOUR_KEY"
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Stripe account connected successfully",
  "merchant": {
    "id": "uuid-here",
    "name": "Test Merchant",
    "email": "test@example.com",
    "webhook_url": "https://vantirs.com/api/webhooks/stripe/uuid-here",
    "api_key": "vant_xxxxxxxxxxxx"
  },
  "next_steps": [...]
}
```

**✅ Pass Criteria:**
- Returns `success: true`
- API key generated (format: `vant_<hex>`)
- Webhook URL provided
- Merchant record created in Supabase

**⚠️ IMPORTANT:** Save the API key - you'll need it for authenticated requests!

#### Step 4: Verify Merchant in Database

1. Go to Supabase Dashboard → Table Editor → `merchants`
2. Find your test merchant
3. Verify:
   - ✅ `stripe_secret_key` is encrypted (not plaintext)
   - ✅ `api_key` is hashed (not plaintext)
   - ✅ `is_active` is `true`

#### Step 5: Test Duplicate Onboarding

Send the same onboarding request again.

**Expected:** Returns "Merchant already connected" message

---

### Phase 3: Transaction Sync (CE 3.0 Prerequisite)

#### Run 12-Month Backfill

```bash
curl -X POST "https://vantirs.com/api/onboarding/sync-transactions?merchant_id=YOUR_MERCHANT_ID" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected Response:**
```json
{
  "success": true,
  "synced": 150,
  "skipped": 0,
  "errors": []
}
```

**✅ Pass Criteria:**
- Transactions synced successfully
- Check Supabase `transactions` table:
  - ✅ Rows created for historical charges
  - ✅ `ip_address` extracted (if available)
  - ✅ `device_fingerprint` extracted (if available)
  - ✅ `customer_email` populated
  - ✅ `merchant_id` matches your merchant

**Note:** This may take a few minutes for accounts with many transactions.

---

### Phase 4: Dashboard API Testing

#### Test Dashboard Stats

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://vantirs.com/api/dashboard/stats | jq .
```

**Expected Response:**
```json
{
  "totalDisputes": 0,
  "vampDisputes": 0,
  "totalTransactions": 150,
  "vampRatio": 0,
  "recoverableAmount": 0,
  "autoWinEligible": 0,
  "plan": "free",
  "disputesUsed": 0,
  "disputesLimit": 2
}
```

**✅ Pass Criteria:**
- Returns stats for your merchant only
- `totalTransactions` matches synced count
- VAMP ratio calculated correctly

#### Test Disputes List

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://vantirs.com/api/disputes | jq .
```

**Expected:** Array of disputes (empty if none)

**✅ Pass Criteria:**
- Returns disputes scoped to your merchant
- Includes compliance scores
- Includes CE 3.0 eligibility status

---

### Phase 5: Webhook Testing

#### Step 1: Create Test Dispute in Stripe

**Option A: Using Stripe Dashboard**
1. Go to Stripe Dashboard → Payments
2. Find a test charge
3. Click "..." → "Create dispute"
4. Select reason and submit

**Option B: Using Stripe CLI**
```bash
# Install Stripe CLI first: https://stripe.com/docs/stripe-cli
stripe trigger charge.dispute.created
```

#### Step 2: Verify Webhook Received

Check Vercel logs for:
- `DISPUTE_RECEIVED` log entry
- Webhook processing started
- No errors

#### Step 3: Verify Dispute Created

Check Supabase `disputes` table:
- ✅ New dispute record created
- ✅ `stripe_dispute_id` populated
- ✅ `merchant_id` matches your merchant
- ✅ `status` is `pending` or `processing`
- ✅ `amount` matches dispute amount

#### Step 4: Verify CE 3.0 Matching

Check dispute record:
- ✅ `ce3_eligible` field (true/false)
- ✅ `historical_matches` count
- ✅ `compliance_score` calculated (0-100)
- ✅ `auto_win_eligible` (true if CE 3.0 eligible)

**CE 3.0 Eligibility Requirements:**
- 2+ historical transactions 120-365 days ago
- Matching IP address or device fingerprint
- Same customer email

#### Step 5: Test Idempotency

Send the same webhook event again (or trigger dispute again).

**Expected:** Returns 200 OK with `skipped: true` message

**✅ Pass Criteria:** No duplicate dispute created

---

### Phase 6: PDF Generation

#### Download Compliance Pack PDF

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://vantirs.com/api/disputes/DISPUTE_ID/pdf \
  --output dispute.pdf
```

**✅ Pass Criteria:**
- PDF downloads successfully
- PDF contains:
  - Dispute details
  - Compliance checklist
  - CE 3.0 evidence (if eligible)
  - Historical transaction matches
- PDF is formatted for OCR scanning
- File size reasonable (< 5MB)

**Verify PDF Contents:**
- Open PDF and check:
  - ✅ Structured tables (not free-form text)
  - ✅ All evidence categories present
  - ✅ Compliance score displayed
  - ✅ CE 3.0 matches listed (if eligible)

---

### Phase 7: Evidence Submission

#### Test Manual Submission

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  https://vantirs.com/api/disputes/DISPUTE_ID/submit | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Evidence submitted successfully",
  "stripe_dispute_id": "dp_xxx"
}
```

**✅ Pass Criteria:**
- Evidence submitted to Stripe
- Dispute status updated to `submitted`
- PDF attached to Stripe dispute
- Check Stripe Dashboard → Disputes → Your dispute
  - ✅ Evidence file attached
  - ✅ Evidence details populated

#### Test Auto-Submission (CE 3.0 Eligible)

For disputes with `ce3_eligible: true` and `auto_win_eligible: true`:
- Should auto-submit when webhook processes
- Check Vercel logs for auto-submission
- Verify in Stripe Dashboard

**✅ Pass Criteria:**
- Auto-submission triggered automatically
- Evidence attached without manual intervention
- Status updated correctly

---

### Phase 8: Manual Review Feature

#### Test High-Value Dispute

Create a dispute > $500:

**Expected Behavior:**
- ✅ `requires_manual_review: true`
- ✅ Should NOT auto-submit
- ✅ Merchant can add context before submission

**Test Manual Review Flow:**
1. Create dispute > $500
2. Verify flagged for manual review
3. Add custom context (if UI supports)
4. Manually submit evidence
5. Verify submission successful

---

### Phase 9: VAMP Monitoring

#### Check VAMP Ratio Calculation

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://vantirs.com/api/dashboard/stats | jq .vampRatio
```

**VAMP Formula:**
```
VAMP Ratio = (Disputes that count / Total Transactions) * 100
```

**Disputes that COUNT for VAMP:**
- Status: `open`, `warning_needs_response`, `warning_under_review`

**Disputes that DON'T COUNT:**
- Status: `won` (especially CE 3.0 wins)
- Status: `lost`
- Status: `warning_closed`

**✅ Pass Criteria:**
- VAMP ratio calculated correctly
- CE 3.0 won disputes excluded
- Threshold alert at 1.5%

#### Test VAMP Threshold Alert

If ratio exceeds 1.5%:
- ✅ Alert should trigger
- ✅ Notification sent (if configured)
- ✅ Dashboard shows warning

---

### Phase 10: Event Tracking (SDK)

#### Track User Event

```bash
curl -X POST https://vantirs.com/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "YOUR_MERCHANT_ID",
    "action": "export_csv",
    "userId": "user_123",
    "metadata": {
      "ip": "1.2.3.4",
      "deviceId": "unique_fingerprint"
    }
  }' | jq .
```

**✅ Pass Criteria:**
- Event logged in `user_activity_logs` table
- Categorized in `action_taxonomy`
- Evidence available for disputes
- Check Supabase → `user_activity_logs` table

---

### Phase 11: Security Testing

#### Test API Key Authentication

**Without API Key:**
```bash
curl https://vantirs.com/api/dashboard/stats
```
**Expected:** 401 Unauthorized

**With Invalid API Key:**
```bash
curl -H "Authorization: Bearer invalid_key" \
  https://vantirs.com/api/dashboard/stats
```
**Expected:** 401 Unauthorized

**✅ Pass Criteria:** All protected endpoints require valid API key

#### Test Rate Limiting

Send multiple rapid requests:
```bash
for i in {1..20}; do
  curl -H "Authorization: Bearer YOUR_API_KEY" \
    https://vantirs.com/api/dashboard/stats
done
```

**Expected:** Rate limit response after threshold

**✅ Pass Criteria:** Rate limiting active

#### Test Security Headers

```bash
curl -I https://vantirs.com | grep -E "(X-Frame-Options|Content-Security-Policy|Strict-Transport-Security)"
```

**✅ Pass Criteria:** Security headers present

---

### Phase 12: Error Handling

#### Test Invalid Webhook Signature

```bash
curl -X POST https://vantirs.com/api/webhooks/stripe/MERCHANT_ID \
  -H "Stripe-Signature: invalid" \
  -d '{}'
```

**Expected:** 400 Bad Request

**✅ Pass Criteria:** Invalid signatures rejected

#### Test Missing Required Fields

```bash
curl -X POST https://vantirs.com/api/onboarding/connect-stripe \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```

**Expected:** 400 with error message

**✅ Pass Criteria:** Validation errors returned

---

## 🎯 Complete Testing Checklist

### Infrastructure ✅
- [ ] Health check passes
- [ ] Database connection works
- [ ] Stripe connection works (if keys configured)
- [ ] Public pages load

### Onboarding ✅
- [ ] Onboarding creates merchant successfully
- [ ] API key generated and hashed
- [ ] Stripe keys encrypted in database
- [ ] Duplicate onboarding handled
- [ ] Validation errors work

### Transaction Sync ✅
- [ ] 12-month backfill works
- [ ] Transactions synced to database
- [ ] IP addresses extracted
- [ ] Device fingerprints extracted

### Webhook Processing ✅
- [ ] Webhook receives dispute events
- [ ] Dispute created in database
- [ ] CE 3.0 matching works
- [ ] Compliance score calculated
- [ ] Idempotency works (no duplicates)

### PDF Generation ✅
- [ ] PDF generates successfully
- [ ] PDF contains correct evidence
- [ ] PDF formatted for OCR
- [ ] PDF download works

### Evidence Submission ✅
- [ ] Manual submission works
- [ ] Auto-submission works (CE 3.0 eligible)
- [ ] Evidence attached to Stripe dispute
- [ ] Status updated correctly

### Security ✅
- [ ] API authentication works
- [ ] Rate limiting works
- [ ] Security headers present
- [ ] Encryption working
- [ ] API key hashing working

### VAMP Monitoring ✅
- [ ] VAMP ratio calculated correctly
- [ ] CE 3.0 wins excluded
- [ ] Threshold alerts work

---

## 🐛 Troubleshooting

### Issue: Webhook not receiving events
**Solution:**
- Verify webhook URL in Stripe dashboard
- Check webhook signing secret matches
- Check Vercel logs for incoming requests

### Issue: API key authentication failing
**Solution:**
- Verify API key format (`vant_<hex>`)
- Check API key is hashed in database
- Verify merchant is active

### Issue: PDF generation failing
**Solution:**
- Check Vercel logs for errors
- Verify dispute has required transaction data
- Check PDFKit fonts are copied

### Issue: CE 3.0 matching not working
**Solution:**
- Run 12-month backfill first
- Verify transactions have IP addresses
- Check date range (120-365 days ago)
- Verify matching criteria (IP + device + email)

---

## 📊 Success Metrics

After complete testing, you should have:
- ✅ 100% test coverage of core functionality
- ✅ All security features verified
- ✅ End-to-end dispute processing working
- ✅ CE 3.0 matching operational
- ✅ Evidence submission successful

---

**Ready to test? Start with Phase 1 and work through each phase systematically!**




