# 🏢 Multi-Tenant Architecture Explained

## Why You DON'T Need Stripe Keys in Vercel

### The Confusion

The deployment guide mentions adding Stripe keys to Vercel, which can be confusing. Here's why:

**You (Vantirs founder) DON'T need Stripe keys for production!**

### How It Actually Works

#### 1. **You Deploy the Platform**
- Deploy Vantirs to Vercel
- Set up Supabase database
- Configure domain
- **NO Stripe keys needed!**

#### 2. **Your Customers Connect Their Stripe Accounts**
- Customer visits: `https://vantirs.com/onboarding`
- Customer enters:
  - Company name
  - Email
  - **Their own Stripe restricted key** (`rk_live_...`)
  - **Their own webhook secret** (`whsec_...`)
- System creates merchant record
- Customer gets unique webhook URL: `/api/webhooks/stripe/[merchantId]`

#### 3. **Each Customer Has Their Own Data**
- All disputes scoped to `merchant_id`
- All transactions scoped to `merchant_id`
- Complete data isolation
- Each customer uses their own Stripe account

### Why Stripe Keys in Vercel?

**They're OPTIONAL and only used for:**

1. **Health Checks** (`/api/health`)
   - Tests if Stripe connection works
   - Can use test keys for this
   - Not required for production

2. **Backward Compatibility**
   - Old webhook route (`/api/webhooks/stripe`) uses env vars
   - New route (`/api/webhooks/stripe/[merchantId]`) uses merchant-specific keys
   - Both work, but new route is preferred

3. **Testing/Demo**
   - For your own testing
   - For demos
   - Not needed for customer onboarding

### What You Actually Need in Vercel

**REQUIRED:**
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# App Config
NEXT_PUBLIC_APP_URL=https://vantirs.com
NEXT_PUBLIC_VANTIRS_ENABLED=true
NODE_ENV=production
```

**OPTIONAL (for health checks only):**
```bash
# These are NOT required for production!
STRIPE_SECRET_KEY=rk_test_...  # Only for /api/health testing
STRIPE_WEBHOOK_SECRET=whsec_...  # Only for backward compatibility
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Only if needed for UI
```

### Customer Onboarding Flow

1. **Customer visits:** `https://vantirs.com/onboarding`
2. **Customer provides:**
   - Company name: "Acme Corp"
   - Email: "billing@acme.com"
   - Stripe restricted key: `rk_live_51AbC123...` (their key)
   - Webhook secret: `whsec_xyz789...` (their secret)
3. **System:**
   - Validates Stripe key
   - Tests connection
   - Creates merchant record
   - Encrypts and stores keys
   - Generates API key: `vant_abc123...`
   - Returns webhook URL: `https://vantirs.com/api/webhooks/stripe/[merchantId]`
4. **Customer:**
   - Configures webhook in their Stripe dashboard
   - Runs 12-month backfill
   - Starts processing disputes

### Business Model

**You (Vantirs):**
- Provide the platform
- No Stripe account needed
- Charge customers subscription/per-dispute fee
- Scale to unlimited customers

**Your Customers:**
- Connect their own Stripe accounts
- Pay you for the service
- Keep their data isolated
- Use their own Stripe keys

### Security Benefits

1. **Data Isolation**
   - Each customer's data is separate
   - No cross-customer access
   - Merchant-scoped queries

2. **Key Security**
   - Customer keys encrypted (AES-256-GCM)
   - Each customer has unique keys
   - No shared credentials

3. **Webhook Security**
   - Each customer has unique webhook URL
   - Webhook signature verification per customer
   - No cross-merchant webhook access

### Example: Two Customers

**Customer A (Acme Corp):**
- Merchant ID: `merchant_abc123`
- Stripe Key: `rk_live_51Acme...`
- Webhook URL: `/api/webhooks/stripe/merchant_abc123`
- Data: Only sees their disputes/transactions

**Customer B (Beta Inc):**
- Merchant ID: `merchant_xyz789`
- Stripe Key: `rk_live_51Beta...`
- Webhook URL: `/api/webhooks/stripe/merchant_xyz789`
- Data: Only sees their disputes/transactions

**Complete isolation!**

### What to Tell Customers

**"Connect your Stripe account in 3 steps:"**

1. **Visit:** `https://vantirs.com/onboarding`
2. **Enter your Stripe restricted key** (create one with only `charges:read`, `disputes:read`, `disputes:write`)
3. **Configure webhook** in your Stripe dashboard using the URL we provide

**That's it!** No need for you to manage their Stripe accounts.

---

## Summary

✅ **You DON'T need Stripe keys in Vercel for production**
✅ **Customers connect their own Stripe accounts**
✅ **Multi-tenant architecture = unlimited scalability**
✅ **Complete data isolation per customer**
✅ **You provide the platform, customers provide their Stripe accounts**

**The Stripe keys in Vercel are optional and only for testing/health checks!**










