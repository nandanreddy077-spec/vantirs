# Local Webhook Testing with Stripe CLI

## The Problem
Stripe requires HTTPS URLs for webhooks, but `http://localhost:3000` won't work. For local testing, use **Stripe CLI** instead.

## Solution: Use Stripe CLI (Recommended)

### Step 1: Install Stripe CLI

**On macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**On Linux/Windows:**
Download from: https://stripe.com/docs/stripe-cli

### Step 2: Login to Stripe

```bash
stripe login
```

This will open a browser window. Click "Allow access" to authenticate.

### Step 3: Forward Webhooks to Local Server

**Start your dev server first:**
```bash
npm run dev
```

**In a NEW terminal window, run:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Step 4: Copy the Webhook Secret

When you run `stripe listen`, you'll see output like:

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef... (^C to quit)
```

**Copy that `whsec_...` secret!**

### Step 5: Add to .env.local

Add the webhook secret to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### Step 6: Restart Dev Server

Restart your dev server to load the new environment variable:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 7: Test the Webhook

**In another terminal, trigger a test dispute:**
```bash
stripe trigger charge.dispute.created
```

**You should see:**
- Webhook received in your `stripe listen` terminal
- Processing logs in your dev server terminal
- A new dispute record in your Supabase `disputes` table

## Alternative: Use ngrok (If you prefer)

If you want to use the Stripe Dashboard webhook instead:

1. **Install ngrok:**
   ```bash
   brew install ngrok
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **Create tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Use in Stripe Dashboard:**
   - Endpoint URL: `https://abc123.ngrok.io/api/webhooks/stripe`
   - Then create the webhook and get the signing secret

**Note:** ngrok URLs change each time you restart, so Stripe CLI is easier for development.

---

## Quick Start Commands

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the whsec_... secret and add to .env.local

# Terminal 3: Trigger test dispute
stripe trigger charge.dispute.created
```

---

**For production:** You'll create the webhook in Stripe Dashboard with your actual HTTPS domain (e.g., `https://shieldrate.com/api/webhooks/stripe`).


