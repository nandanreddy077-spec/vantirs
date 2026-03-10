# Stripe Billing Setup Guide

This guide will help you set up Stripe billing for Vantirs subscription plans.

## Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Access to Stripe Dashboard
3. Environment variables configured

## Step 1: Create Products in Stripe Dashboard

1. Go to Stripe Dashboard → Products
2. Click "Add product" for each plan:

### STARTER Plan
- **Name**: Vantirs Starter
- **Description**: 25 disputes/month, Auto-submission, VAMP monitoring
- **Pricing**: 
  - Type: Recurring
  - Price: $99.00 USD
  - Billing period: Monthly
- **Save** and copy the Price ID (starts with `price_`)

### PROFESSIONAL Plan
- **Name**: Vantirs Professional
- **Description**: 100 disputes/month, Priority processing, Shadow Pilot, Advanced analytics
- **Pricing**:
  - Type: Recurring
  - Price: $249.00 USD
  - Billing period: Monthly
- **Save** and copy the Price ID (starts with `price_`)

## Step 2: Configure Environment Variables

Add these to your `.env.local` and Vercel environment variables:

```bash
# Stripe Billing
STRIPE_PRICE_STARTER=price_xxxxx  # Replace with your Starter price ID
STRIPE_PRICE_PROFESSIONAL=price_yyyyy  # Replace with your Professional price ID
STRIPE_BILLING_WEBHOOK_SECRET=whsec_xxxxx  # Will be generated in Step 3
```

## Step 3: Set Up Webhook Endpoint

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe-billing`
4. **Events to listen for**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to `STRIPE_BILLING_WEBHOOK_SECRET` in your environment variables

## Step 4: Enable Customer Portal (Optional but Recommended)

1. Go to Stripe Dashboard → Settings → Billing → Customer portal
2. Enable the customer portal
3. Configure allowed actions:
   - ✅ Update payment method
   - ✅ Cancel subscription
   - ✅ Update billing information
4. Save settings

## Step 5: Test the Integration

### Test Mode

1. Use Stripe Test Mode (toggle in Stripe Dashboard)
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date, any CVC
4. Test the checkout flow:
   - Go to `/pricing`
   - Click "Subscribe" on Starter or Professional
   - Complete checkout with test card
   - Verify webhook receives events
   - Check merchant plan is updated in database

### Test Webhook Locally (Optional)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe-billing

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

## Step 6: Verify Database Migration

Make sure you've run the subscription plans migration:

```sql
-- Run in Supabase SQL Editor
-- File: database/migration-add-subscription-plans.sql
```

## Step 7: Go Live

1. Switch Stripe Dashboard to **Live mode**
2. Create products and prices in Live mode (repeat Step 1)
3. Update environment variables with Live mode price IDs
4. Create webhook endpoint in Live mode (repeat Step 3)
5. Update `STRIPE_BILLING_WEBHOOK_SECRET` with Live mode webhook secret
6. Deploy to production

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct and accessible
2. Verify webhook secret matches in environment variables
3. Check Stripe Dashboard → Webhooks → Recent events for errors
4. Check application logs for webhook processing errors

### Subscription Not Updating Merchant Plan

1. Verify webhook is receiving events (check Stripe Dashboard)
2. Check webhook handler logs for errors
3. Verify `vantirs_merchant_id` is in subscription metadata
4. Check database to see if merchant record is updating

### Checkout Session Not Creating

1. Verify Stripe price IDs are correct in environment variables
2. Check API key authentication is working
3. Verify merchant has email and name in database
4. Check application logs for checkout creation errors

## API Endpoints

- `POST /api/billing/checkout` - Create checkout session
- `POST /api/billing/portal` - Create customer portal session
- `POST /api/webhooks/stripe-billing` - Webhook handler

## Support

For issues or questions:
- Check Stripe Dashboard → Logs for detailed error messages
- Review application logs for webhook processing
- Verify all environment variables are set correctly








