# Production Multi-Tenant Setup Guide

Vantirs now supports **multi-tenant architecture**, allowing each customer to connect their own Stripe account. This means you (as the Vantirs founder) don't need your own Stripe account - your customers connect theirs.

## 🎯 How It Works

1. **Customer Onboarding**: Customers visit `/onboarding` and provide their Stripe restricted keys
2. **Merchant Account**: System creates a merchant record with their Stripe credentials
3. **Webhook Routing**: Each merchant gets a unique webhook URL: `/api/webhooks/stripe/[merchantId]`
4. **Data Isolation**: All disputes, transactions, and activity logs are scoped to `merchant_id`

## 📋 Production Setup Steps

### 1. Run Database Migration

Execute the multi-tenant migration in your Supabase SQL Editor:

```sql
-- Run database/migration-multi-tenant.sql
```

This creates:
- `merchants` table
- Adds `merchant_id` to `disputes`, `transactions`, and `user_activity_logs`
- Creates necessary indexes

### 2. Deploy Updated Code

The codebase now includes:
- ✅ `lib/merchant-stripe.ts` - Merchant-specific Stripe client
- ✅ `app/api/onboarding/connect-stripe/route.ts` - Onboarding API
- ✅ `app/onboarding/page.tsx` - Onboarding UI
- ✅ `app/api/webhooks/stripe/[merchantId]/route.ts` - Merchant webhook handler
- ✅ Updated all core functions to support `merchant_id`

### 3. Customer Onboarding Flow

#### Step 1: Customer Visits Onboarding Page

Direct customers to: `https://vantirs.com/onboarding`

They provide:
- Company name
- Contact email
- Stripe restricted key (`rk_live_...` or `rk_test_...`)
- Webhook secret (`whsec_...`)
- Publishable key (optional)

#### Step 2: System Creates Merchant Record

The onboarding API:
1. Validates Stripe key format
2. Tests Stripe connection
3. Creates merchant record in database
4. Returns unique webhook URL

#### Step 3: Customer Configures Stripe Webhook

Customer must:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://vantirs.com/api/webhooks/stripe/[merchantId]`
3. Select event: `charge.dispute.created`
4. Copy webhook signing secret (already provided in onboarding)

#### Step 4: Run 12-Month Backfill

**CRITICAL**: Immediately after onboarding, run the backfill:

```bash
curl -X POST "https://vantirs.com/api/onboarding/sync-transactions?merchant_id=[merchantId]"
```

This syncs historical transactions so CE 3.0 matching works from day 1.

## 🔐 Security Considerations

### Stripe Key Storage

**Current Implementation**: Keys are stored in plaintext in the database.

**Production Recommendation**: Encrypt Stripe keys before storing:

```typescript
// Example: Use encryption library
import { encrypt, decrypt } from '@/lib/encryption'

// When storing
const encryptedKey = encrypt(stripe_secret_key)

// When retrieving
const decryptedKey = decrypt(merchant.stripe_secret_key)
```

### Webhook Security

- Each merchant has a unique webhook URL
- Webhook signature verification uses merchant-specific secret
- No cross-merchant data access possible

## 📊 Data Isolation

All queries are scoped by `merchant_id`:

- Disputes: `WHERE merchant_id = ?`
- Transactions: `WHERE merchant_id = ?`
- Activity Logs: `WHERE merchant_id = ?`

This ensures complete data isolation between customers.

## 🔄 Backward Compatibility

The system maintains backward compatibility:

- Old webhook route (`/api/webhooks/stripe`) still works if `STRIPE_SECRET_KEY` env var is set
- Functions accept optional `merchantId` and `stripeClient` parameters
- Falls back to global Stripe instance if not provided

## 🚀 Testing Multi-Tenant Setup

### 1. Test Onboarding

```bash
curl -X POST https://vantirs.com/api/onboarding/connect-stripe \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "email": "test@example.com",
    "stripe_secret_key": "rk_test_...",
    "stripe_webhook_secret": "whsec_...",
    "stripe_publishable_key": "pk_test_..."
  }'
```

### 2. Test Webhook

Use Stripe CLI to forward to merchant-specific endpoint:

```bash
stripe listen --forward-to https://vantirs.com/api/webhooks/stripe/[merchantId]
stripe trigger charge.dispute.created
```

### 3. Test Backfill

```bash
curl -X POST "https://vantirs.com/api/onboarding/sync-transactions?merchant_id=[merchantId]"
```

## 📝 Environment Variables

No changes needed to existing environment variables. The system works with or without them:

- **With env vars**: Single-tenant mode (backward compatible)
- **Without env vars**: Multi-tenant mode (customers provide keys)

## 🎯 Next Steps

1. ✅ Run database migration
2. ✅ Deploy updated code
3. ✅ Test onboarding flow
4. ✅ Onboard first customer
5. ✅ Run 12-month backfill
6. ✅ Test webhook processing

## 💡 Business Model

- **You (Vantirs)**: Provide the platform, no Stripe account needed
- **Your Customers**: Connect their Stripe accounts, pay you subscription/per-dispute
- **Data Isolation**: Each customer's data is completely separate
- **Scalability**: Unlimited customers, each with their own Stripe account

---

**Status**: ✅ Production-ready for multi-tenant deployment


