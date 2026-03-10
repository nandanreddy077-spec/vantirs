# Razorpay Billing Setup Guide

## Overview

Vantirs now uses **Razorpay** for subscription billing, making it easier for Indian merchants to subscribe and manage their plans.

## Prerequisites

1. Razorpay account (https://razorpay.com)
2. Razorpay API keys (Key ID and Key Secret)
3. Razorpay subscription plans created
4. Razorpay webhook configured

## Setup Instructions

### 1. Get Razorpay API Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings → API Keys**
3. Copy your **Key ID** (starts with `rzp_live_` or `rzp_test_`)
4. Copy your **Key Secret** (starts with `rzp_live_` or `rzp_test_`)

### 2. Create Subscription Plans

1. Go to **Subscriptions → Plans** in Razorpay Dashboard
2. Click **"Create Plan"** or **"+ New Plan"**

#### Plan 1: STARTER
- **Plan Name**: `Vantirs Starter`
- **Billing Amount**: `8250.00` (₹82.50 in INR, or equivalent in your currency)
- **Billing Frequency**: Every 1 Month(s)
- **Description**: "25 disputes/month, Auto-submission, VAMP monitoring"
- Copy the **Plan ID** (starts with `plan_`)

#### Plan 2: PROFESSIONAL
- **Plan Name**: `Vantirs Professional`
- **Billing Amount**: `20750.00` (₹207.50 in INR, or equivalent in your currency)
- **Billing Frequency**: Every 1 Month(s)
- **Description**: "100 disputes/month, Priority processing, Shadow Pilot, Advanced analytics"
- Copy the **Plan ID** (starts with `plan_`)

### 3. Configure Webhook

1. Go to **Settings → Webhooks** in Razorpay Dashboard
2. Click **"Add New Webhook"** or **"Create Webhook"**
3. Set **Webhook URL**: `https://vantirs.com/api/webhooks/razorpay`
4. Add **Secret**: Generate a secure random string (e.g., `whsec_vantirs_razorpay_2024_xyz123abc456`)
5. Select **Active Events**:
   - `subscription.created`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `payment.captured`
   - `payment.failed`
   - `payment.authorized` (optional)
6. Set **Alert Email**: Your email for webhook failure notifications
7. Click **"Create Webhook"** or **"Save Webhook"**
8. Copy the **Webhook Secret** (the one you entered)

### 4. Configure Environment Variables

Add to your `.env.local` (or Vercel environment variables):

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_live_SG6JpL5lH0Xv8R
RAZORPAY_KEY_SECRET=jJR7XEJPMxAg4mA7OnYJW4OV
RAZORPAY_WEBHOOK_SECRET=whsec_vantirs_razorpay_2024_xyz123abc456

# Razorpay Plan IDs
RAZORPAY_PLAN_STARTER=plan_SG6t5HnxJ6S75c
RAZORPAY_PLAN_PROFESSIONAL=plan_SG6txu02j5MI7C
```

**Note**: The Plan IDs above are examples. Use your actual Plan IDs from Razorpay Dashboard.

### 5. Run Database Migration

Execute the migration to add Razorpay fields:

```sql
-- Run in Supabase SQL Editor
-- File: database/migration-add-subscription-plans.sql
```

This adds:
- `razorpay_customer_id` - Razorpay customer ID
- `razorpay_subscription_id` - Razorpay subscription ID
- Indexes for efficient lookups

### 6. Test the Integration

1. Visit `/pricing` page
2. Click **"Subscribe"** on STARTER or PROFESSIONAL plan
3. You'll be redirected to Razorpay payment page
4. Complete payment (use test mode for testing)
5. You'll be redirected back to `/billing/success`
6. Check dashboard to verify plan is updated

## How It Works

### Subscription Flow

1. **Merchant clicks "Subscribe"** on pricing page
2. **API creates Razorpay Payment Link** (`/api/billing/checkout`)
3. **Merchant redirected to Razorpay** payment page
4. **Merchant completes payment**
5. **Razorpay sends webhook** to `/api/webhooks/razorpay`
6. **Webhook handler updates merchant plan** in database
7. **Merchant redirected to success page**

### Webhook Events

The webhook handler processes:
- `subscription.created` - New subscription created
- `subscription.activated` - Subscription activated
- `subscription.charged` - Monthly charge successful
- `subscription.cancelled` - Subscription cancelled
- `payment.captured` - Payment captured
- `payment.failed` - Payment failed

### Subscription Management

Merchants can manage subscriptions:
- Via Razorpay Dashboard (link provided in `/api/billing/portal`)
- Via API endpoints (cancel/reactivate)

## Troubleshooting

### "RAZORPAY_KEY_ID not configured"
- Add `RAZORPAY_KEY_ID` to environment variables
- Get Key ID from Razorpay Dashboard → Settings → API Keys

### "Webhook signature verification failed"
- Check `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay Dashboard
- Verify webhook URL is correct in Razorpay Dashboard

### "No plan ID configured for plan"
- Check `RAZORPAY_PLAN_STARTER` and `RAZORPAY_PLAN_PROFESSIONAL` are set
- Verify Plan IDs exist in Razorpay Dashboard

### Payment link not working
- Check Razorpay account is in correct mode (test/live)
- Verify API keys match the mode
- Check plan IDs are correct

### Subscription not updating after payment
- Check webhook is configured correctly
- Verify webhook secret matches
- Check webhook events are selected
- Review server logs for webhook errors

## Production Checklist

- [ ] Add Razorpay API keys to environment variables
- [ ] Create subscription plans in Razorpay Dashboard
- [ ] Add Plan IDs to environment variables
- [ ] Configure webhook in Razorpay Dashboard
- [ ] Add webhook secret to environment variables
- [ ] Run database migration
- [ ] Test subscription flow in test mode
- [ ] Test webhook events
- [ ] Switch to live mode for production
- [ ] Update webhook URL to production domain

## Support

For issues or questions:
- Check Razorpay Dashboard logs
- Review application logs for webhook errors
- Verify environment variables are set correctly
- Test with Razorpay test mode first

---

**Razorpay Integration Complete!** 🎉

Your Vantirs platform is now ready to accept subscriptions via Razorpay.






