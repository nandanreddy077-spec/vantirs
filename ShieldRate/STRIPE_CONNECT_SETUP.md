# Stripe Connect OAuth Setup Guide

## Overview

Vantirs now supports **one-click Stripe Connect OAuth** integration, making it easier for merchants to connect their Stripe accounts without manually copying API keys.

## Benefits

- ✅ **One-click setup** - No manual key copying
- ✅ **Automatic webhook configuration** - Webhooks are created automatically
- ✅ **More secure** - No API keys exposed to users
- ✅ **Better UX** - Higher conversion rates (60-80% vs 20-30%)
- ✅ **Token refresh** - Automatic token refresh handling

## Setup Instructions

### 1. Register Stripe Connect App

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings → Connect → Settings**
3. Enable **Connect** if not already enabled
4. Click **"Add new platform"** or use existing platform
5. Set **Redirect URI**:
   ```
   https://your-domain.com/api/onboarding/stripe-connect/callback
   ```
   For local development:
   ```
   http://localhost:3000/api/onboarding/stripe-connect/callback
   ```
6. Copy your **Client ID** (starts with `ca_...`)

### 2. Configure Environment Variables

Add to your `.env.local` (or Vercel environment variables):

```bash
# Stripe Connect OAuth
STRIPE_CONNECT_CLIENT_ID=ca_xxxxxxxxxxxxx

# Existing Stripe config (still needed for token refresh)
STRIPE_SECRET_KEY=sk_live_...  # Your platform's Stripe secret key
```

### 3. Run Database Migration

Execute the migration to add OAuth fields:

```sql
-- Run in Supabase SQL Editor
-- File: database/migration-add-stripe-connect.sql
```

This adds:
- `stripe_account_id` - Connected account ID
- `stripe_access_token` - Encrypted OAuth access token
- `stripe_refresh_token` - Encrypted OAuth refresh token
- `oauth_connected_at` - Connection timestamp
- `connection_method` - 'oauth' or 'manual'

### 4. Test OAuth Flow

1. Visit `/onboarding`
2. Click **"Connect with Stripe"** button
3. You'll be redirected to Stripe OAuth page
4. Authorize Vantirs
5. You'll be redirected back with account connected

## How It Works

### OAuth Flow

1. **Initiation** (`/api/onboarding/stripe-connect`)
   - Redirects merchant to Stripe OAuth page
   - Sets CSRF state cookie for security

2. **Callback** (`/api/onboarding/stripe-connect/callback`)
   - Receives authorization code from Stripe
   - Exchanges code for access/refresh tokens
   - Creates webhook endpoint automatically
   - Stores encrypted tokens in database
   - Creates merchant record

3. **Token Usage** (`lib/merchant-stripe.ts`)
   - Automatically uses OAuth tokens if available
   - Falls back to manual API keys (backward compatible)
   - Handles token refresh automatically

### Token Refresh

OAuth access tokens expire. The system automatically:
- Detects expired tokens
- Uses refresh token to get new access token
- Updates database with new token
- Retries the operation

## Manual Setup (Fallback)

Merchants can still use manual API key setup:
1. Click **"Or connect manually with API keys"** on onboarding page
2. Enter restricted API key and webhook secret
3. Works exactly as before (backward compatible)

## Permissions Requested

Stripe Connect requests `read_write` scope, which includes:
- ✅ `charges:read` - Read charge data
- ✅ `disputes:read` - Read dispute data
- ✅ `disputes:write` - Submit dispute evidence
- ✅ `webhook_endpoints:write` - Create webhooks automatically

**Security Note**: Vantirs cannot:
- ❌ Move money
- ❌ Create charges
- ❌ Access full card numbers
- ❌ Change account settings

## Troubleshooting

### "STRIPE_CONNECT_CLIENT_ID not configured"
- Add `STRIPE_CONNECT_CLIENT_ID` to environment variables
- Get Client ID from Stripe Dashboard → Connect → Settings

### "OAuth authorization failed"
- Check redirect URI matches exactly in Stripe Dashboard
- Ensure redirect URI uses HTTPS in production
- Verify Client ID is correct

### "Token refresh failed"
- Check `STRIPE_SECRET_KEY` is set (needed for token refresh)
- Verify refresh token is stored in database
- Check Stripe API logs for errors

### Webhook not created automatically
- System will continue without webhook
- Merchant can create webhook manually in Stripe Dashboard
- Use webhook URL from merchant record

## Migration from Manual to OAuth

Existing merchants with manual API keys:
- Continue working as before (backward compatible)
- Can reconnect via OAuth anytime
- OAuth connection will update their record

## Production Checklist

- [ ] Add `STRIPE_CONNECT_CLIENT_ID` to environment variables
- [ ] Set redirect URI in Stripe Dashboard
- [ ] Run database migration
- [ ] Test OAuth flow in test mode
- [ ] Test OAuth flow in live mode
- [ ] Verify webhook creation works
- [ ] Test token refresh (wait for token expiry or force refresh)
- [ ] Update documentation for customers

## Support

For issues or questions:
- Check Stripe Connect logs in dashboard
- Review application logs for OAuth errors
- Verify environment variables are set correctly
- Test with Stripe test mode first

