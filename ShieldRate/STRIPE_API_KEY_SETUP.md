# Stripe Restricted API Key Setup Guide

## ⚠️ CRITICAL: Use Restricted Keys Only

**DO NOT use your main Stripe secret key.**

ShieldRate follows the **principle of least privilege**. We only request the minimum API permissions needed to protect your chargebacks.

---

## Why Restricted Keys?

- **Security**: Limits potential damage if key is compromised
- **Compliance**: Follows security best practices
- **Trust**: Shows we only need what's necessary
- **Protection**: Prevents unauthorized access to your account

---

## Required Permissions

### ✅ Permitted Scopes (ONLY these 3):

1. **`charges:read`** - Read charge details for CE 3.0 matching
2. **`disputes:read`** - Read dispute information
3. **`disputes:write`** - Submit evidence to Stripe

### ❌ What We DON'T Need (and will never request):

- ❌ `charges:write` - We never create or modify charges
- ❌ `customers:write` - We never modify customer data
- ❌ `payment_intents:write` - We never process payments
- ❌ `refunds:write` - We never issue refunds
- ❌ `payouts:read` - We don't access your bank account
- ❌ `account:read` - We don't access your account settings
- ❌ `balance:read` - We don't see your account balance
- ❌ `transfers:write` - We cannot transfer money

---

## Step-by-Step Setup

### Step 1: Navigate to API Keys

1. Go to **Stripe Dashboard**: https://dashboard.stripe.com
2. Click **Developers** → **API keys**
3. Scroll to **Restricted keys** section
4. Click **"Create restricted key"**

### Step 2: Name Your Key

- **Name**: `ShieldRate Compliance Engine`
- **Description** (optional): `CE 3.0 chargeback defense - read-only access`

### Step 3: Set Permissions

**ONLY enable these three permissions:**

```
☑️ charges:read
☑️ disputes:read  
☑️ disputes:write
```

**Uncheck everything else.**

### Step 4: Copy the Key

1. After creating, you'll see a key starting with:
   - `rk_live_...` (for live mode)
   - `rk_test_...` (for test mode)
2. **Copy this key immediately** (you won't see it again)
3. Add it to your environment variables:
   ```bash
   STRIPE_SECRET_KEY=rk_live_51AbC123...
   ```

### Step 5: Verify Setup

Test that the key works:
```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "checks": {
    "stripe": true
  }
}
```

---

## Visual Setup Guide

### Permission Selection Screen

When creating the restricted key, you'll see a list of permissions. Here's what to select:

```
☑️ Charges
   └─ ☑️ Read charges
   └─ ☐ Create charges
   └─ ☐ Update charges

☑️ Disputes
   └─ ☑️ Read disputes
   └─ ☑️ Update disputes

☐ Customers (leave unchecked)
☐ Payment Intents (leave unchecked)
☐ Refunds (leave unchecked)
☐ Payouts (leave unchecked)
☐ Account (leave unchecked)
... (everything else unchecked)
```

---

## Security Guarantee

With these restricted permissions, ShieldRate can:

✅ **Read** charge details (for CE 3.0 matching)  
✅ **Read** dispute information  
✅ **Submit** evidence to Stripe  

ShieldRate **CANNOT**:

❌ Access your bank account  
❌ Issue refunds  
❌ Process payments  
❌ Modify charges  
❌ Change account settings  
❌ Transfer money  
❌ View account balance  

---

## FAQ

### Q: Can ShieldRate access my bank account?
**A:** No. We only have `disputes:read` and `disputes:write` permissions. We cannot access payouts, transfers, or bank account information.

### Q: Can ShieldRate issue refunds?
**A:** No. We don't have `refunds:write` permission. We can only submit evidence for disputes.

### Q: Can ShieldRate modify my charges?
**A:** No. We only have `charges:read` (read-only). We cannot create, update, or delete charges.

### Q: What if I accidentally give full access?
**A:** 
1. Delete the key immediately in Stripe Dashboard
2. Create a new restricted key with only the 3 permissions above
3. Update your `STRIPE_SECRET_KEY` environment variable

### Q: Can I revoke access later?
**A:** Yes. You can delete the restricted key at any time in Stripe Dashboard → Developers → API keys.

### Q: What happens if the key is compromised?
**A:** Since it's restricted, the attacker can only:
- Read charge details
- Read dispute information
- Submit evidence (which you can review in Stripe Dashboard)

They **cannot** access your money, issue refunds, or modify your account.

---

## Video Tutorial

**30-Second Setup Video:**

1. Go to Stripe Dashboard → Developers → API keys
2. Click "Create restricted key"
3. Name it "ShieldRate Compliance Engine"
4. Check ONLY: `charges:read`, `disputes:read`, `disputes:write`
5. Copy the key (starts with `rk_live_...`)
6. Add to `STRIPE_SECRET_KEY` environment variable

---

## Troubleshooting

### Error: "Insufficient permissions"
- **Cause**: Key doesn't have all 3 required permissions
- **Fix**: Delete key and create new one with all 3 permissions checked

### Error: "Invalid API key"
- **Cause**: Key copied incorrectly or wrong mode (test vs live)
- **Fix**: Verify key starts with `rk_live_` or `rk_test_`, copy again

### Error: "Key not found"
- **Cause**: Key was deleted in Stripe Dashboard
- **Fix**: Create new restricted key and update environment variable

---

## Support

If you have questions about API key permissions:
- **Email**: support@shieldrate.com
- **Documentation**: See [SETUP.md](./SETUP.md) for full setup guide

---

## Quick Reference

**Required Permissions:**
- `charges:read`
- `disputes:read`
- `disputes:write`

**Key Format:**
- Live: `rk_live_...`
- Test: `rk_test_...`

**Environment Variable:**
```bash
STRIPE_SECRET_KEY=rk_live_...
```

---

**Last Updated:** 2026-02-01  
**Version:** 1.0.0

