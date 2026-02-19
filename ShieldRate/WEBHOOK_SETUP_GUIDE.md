# Stripe Webhook Setup - Step by Step

## What You're Looking At

You're on the Stripe Webhooks page. You need to create a webhook endpoint that will notify Vantirs whenever a dispute is created.

## Step-by-Step Instructions

### Step 1: Click "+ Add destination" Button

Click the blue **"+ Add destination"** button you see on the page.

### Step 2: Choose "Webhook endpoint"

You'll see options. Select **"Webhook endpoint"** (not EventBridge).

### Step 3: Configure the Endpoint

You'll see a form. Fill it out:

**Endpoint URL:**
- For **local testing**: `http://localhost:3000/api/webhooks/stripe`
- For **production**: `https://your-domain.com/api/webhooks/stripe`
- Start with local testing URL for now

**Description (optional):**
- `Vantirs Dispute Handler`

**Version:**
- Select the latest API version (usually `2024-XX-XX.acacia` or similar)

### Step 4: Select Events

You'll see a list of events. You need to select:

**✅ Check this event:**
- `charge.dispute.created`

**Uncheck everything else** (we only need dispute events).

### Step 5: Create the Endpoint

Click **"Add endpoint"** or **"Create endpoint"** button.

### Step 6: Copy the Signing Secret

After creating, you'll see:
- A success message
- Your endpoint details
- **Most importantly: A "Signing secret"** (starts with `whsec_`)

**⚠️ CRITICAL:** Copy this signing secret immediately. You won't be able to see it again!

It will look like:
```
whsec_1234567890abcdef...
```

### Step 7: Add to .env.local

Open your `.env.local` file and replace:

```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

With your actual secret:

```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

## Alternative: Using Stripe CLI (For Local Testing)

If you want to test locally without setting up a webhook in the dashboard:

1. **Install Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login:**
   ```bash
   stripe login
   ```

3. **Forward webhooks:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   
   This will output a webhook secret. Use that in `.env.local`.

## What Happens Next

Once you've added the webhook secret to `.env.local`:

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Test the webhook:**
   ```bash
   # Using Stripe CLI
   stripe trigger charge.dispute.created
   ```

3. **Check your logs:**
   - You should see webhook processing in your terminal
   - Check Supabase `disputes` table - a new dispute should appear

## Troubleshooting

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the signing secret from Stripe
- For local testing with Stripe CLI, use the secret from `stripe listen` output

### "Endpoint URL not reachable"
- Make sure your dev server is running (`npm run dev`)
- Check the URL is correct: `http://localhost:3000/api/webhooks/stripe`
- For production, make sure your domain is accessible

### "Event not received"
- Verify you selected `charge.dispute.created` event
- Check webhook is enabled (not disabled)
- Make sure you're in test mode (orange banner at top)

---

**Once you've copied the webhook secret, let me know and I'll help you add it to your `.env.local` file!**



