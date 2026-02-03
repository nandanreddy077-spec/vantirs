# ShieldRate Setup Guide

## Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL script
5. Copy your project URL and anon key from Settings > API

### 3. Configure Environment Variables

⚠️ **CRITICAL: Use Stripe Restricted API Key**

**DO NOT use your main Stripe secret key.**

ShieldRate only needs 3 permissions:
- `charges:read`
- `disputes:read`
- `disputes:write`

See **[STRIPE_API_KEY_SETUP.md](./STRIPE_API_KEY_SETUP.md)** for detailed setup instructions.

Create `.env.local`:

```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=rk_test_...  # MUST be restricted key (starts with rk_)
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SHIELDRATE_ENABLED=true
```

### 4. Set Up Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select event: `charge.dispute.created`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## The "Shadow Pilot" Strategy

Before connecting live data, run the Shadow Pilot to show ROI:

```bash
# Install tsx for running TypeScript scripts
npm install -g tsx

# Run shadow pilot
npx tsx scripts/shadow-pilot.ts
```

This will:
- Scan last 90 days of Stripe disputes
- Identify CE 3.0 eligible disputes
- Calculate recoverable amount
- Show VAMP ratio impact

**Use this output to close your first beta customer.**

## Integrating ShieldRate SDK

Add event tracking to your app:

```typescript
import { shieldrate } from '@/lib/shieldrate-sdk'

// Track user actions
shieldrate.track({
  action: 'export_csv',
  userId: 'user_123',
  metadata: {
    ip: '1.2.3.4',
    deviceId: 'unique_fingerprint'
  }
})
```

Common actions to track:
- `login` - Identity evidence
- `export_data` - Value evidence
- `tos_acceptance` - Consent evidence
- `api_call` - Value evidence
- `seat_added` - Value evidence

## 7. Initial Backfill (CRITICAL - Do This First!)

**⚠️ CRITICAL: Sync Last 12 Months Immediately**

After connecting your Stripe account, you **MUST** sync the last 12 months of transactions:

```bash
# Via API (recommended)
curl -X POST https://your-domain.com/api/onboarding/sync-transactions

# Or via script
npx tsx scripts/sync-transactions.ts --months 12
```

**Why this is critical:**
- CE 3.0 matching requires historical transactions (120-365 days old)
- Without this backfill, ShieldRate is "blind" for the first 4 months
- This ensures immediate protection from day 1
- New merchants must run this before their first dispute

**What happens:**
- Syncs all successful charges from last 12 months
- Extracts IP addresses, device fingerprints, payment method fingerprints
- Stores customer emails and billing descriptors (for Match Triad)
- Enables CE 3.0 matching immediately

---

## Syncing Historical Transactions (Ongoing)

For ongoing syncs (after initial backfill), you can sync specific date ranges:

```typescript
// Example: Sync all successful charges
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

const charges = await stripe.charges.list({ limit: 100 })

for (const charge of charges.data) {
  if (charge.status === 'succeeded' && charge.customer) {
    await supabaseAdmin.from('transactions').insert({
      stripe_charge_id: charge.id,
      customer_id: charge.customer,
      amount: charge.amount,
      status: 'succeeded',
      ip_address: charge.metadata?.ip_address || null,
      device_fingerprint: charge.metadata?.device_fingerprint || null,
      payment_method_fingerprint: charge.payment_method_details?.card?.fingerprint || null,
      created_at: new Date(charge.created * 1000).toISOString(),
    })
  }
}
```

## Testing the Webhook

Use Stripe CLI to test locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger charge.dispute.created
```

## Production Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

- Ensure Node.js 18+ runtime
- Set all environment variables
- Configure webhook URL in Stripe dashboard

## Troubleshooting

### PDF Generation Fails

PDFKit requires Node.js canvas support. If you see errors:

```bash
npm install canvas
```

Or use an alternative PDF library like `@react-pdf/renderer` for client-side generation.

### Webhook Not Receiving Events

1. Check webhook URL is correct in Stripe dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` matches
3. Check server logs for signature verification errors

### CE 3.0 Matches Not Found

Ensure:
1. Historical transactions are synced (120-365 days old)
2. IP addresses or device fingerprints match
3. Payment method fingerprints are stored

## Next Steps

1. ✅ **Set up Stripe Restricted API Key** (see STRIPE_API_KEY_SETUP.md)
2. ✅ **Run 12-month backfill** (critical for immediate protection)
3. ✅ Run Shadow Pilot on first beta customer
4. ✅ Show them recoverable amount
5. ✅ Connect their database
6. ✅ Activate real-time defense
7. ✅ Monitor VAMP ratio

---

**You're ready to dominate the $2B chargeback recovery market.**

