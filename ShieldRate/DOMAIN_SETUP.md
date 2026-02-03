# Setting Up vantirs.com Domain

## 🎯 Domain Configuration for Production

You've purchased `vantirs.com` on Namecheap. Here's how to configure it for production deployment.

## Step 1: Configure DNS in Namecheap

### Option A: Point to Vercel (Recommended)

1. **Go to Namecheap Dashboard:**
   - Navigate to: https://www.namecheap.com/myaccount/login/
   - Go to **Domain List** → Click **"Manage"** next to `vantirs.com`

2. **Go to Advanced DNS:**
   - Click the **"Advanced DNS"** tab

3. **Add Vercel Records:**
   After deploying to Vercel, you'll get DNS records. Add these:
   
   **Type A Record:**
   - Host: `@`
   - Value: `76.76.21.21` (Vercel's IP - will be provided when you deploy)
   - TTL: Automatic

   **Type CNAME Record:**
   - Host: `www`
   - Value: `cname.vercel-dns.com` (or your Vercel domain)
   - TTL: Automatic

### Option B: Use Vercel's Nameservers (Easier)

1. **Get Vercel Nameservers:**
   - After deploying, Vercel will provide nameservers
   - Usually: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`, etc.

2. **Update in Namecheap:**
   - Go to **Domain List** → **"Manage"** → **"Nameservers"**
   - Select **"Custom DNS"**
   - Enter Vercel's nameservers
   - Click **"Save"**

## Step 2: Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Rebrand to Vantirs"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to: https://vercel.com
   - Import your GitHub repository
   - Add all environment variables from `.env.local`
   - Deploy

3. **Add Custom Domain:**
   - In Vercel project settings → **Domains**
   - Add: `vantirs.com` and `www.vantirs.com`
   - Follow Vercel's DNS instructions

## Step 3: Update Environment Variables

In Vercel, update:

```bash
NEXT_PUBLIC_APP_URL=https://vantirs.com
```

## Step 4: Configure Stripe Webhook (Production)

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks

2. **Create New Webhook:**
   - Endpoint URL: `https://vantirs.com/api/webhooks/stripe`
   - Description: "Vantirs Dispute Handler"
   - Events: `charge.dispute.created`

3. **Copy Webhook Secret:**
   - Copy the `whsec_...` secret
   - Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 5: SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt. Once DNS propagates (usually 24-48 hours), HTTPS will be active.

## Step 6: Verify Setup

1. **Check DNS Propagation:**
   ```bash
   # Check if domain points to Vercel
   dig vantirs.com
   ```

2. **Test Health Endpoint:**
   ```bash
   curl https://vantirs.com/api/health
   ```

3. **Test Webhook:**
   - Use Stripe Dashboard to send a test event
   - Check Vercel logs for webhook processing

## DNS Propagation Time

- **Initial propagation:** 1-4 hours
- **Full propagation:** 24-48 hours
- **SSL activation:** Automatic after DNS propagates

## Troubleshooting

### Domain Not Resolving

1. **Check DNS records** in Namecheap
2. **Verify nameservers** are correct
3. **Wait for propagation** (can take up to 48 hours)

### SSL Not Working

1. **Wait for DNS propagation** (SSL can't activate until DNS is correct)
2. **Check Vercel dashboard** for SSL status
3. **Verify domain is added** in Vercel project settings

### Webhook Not Working

1. **Verify webhook URL** in Stripe: `https://vantirs.com/api/webhooks/stripe`
2. **Check webhook secret** matches in Vercel
3. **Test with Stripe CLI** first to verify endpoint works

---

**Once DNS propagates, your production site will be live at https://vantirs.com! 🚀**

