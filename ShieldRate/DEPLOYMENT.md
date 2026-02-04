# ShieldRate Deployment Guide

## Production Deployment Checklist

### 1. Environment Setup

✅ Set all required environment variables:
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Setup

✅ Run database schema:
```sql
-- Execute database/schema.sql in Supabase SQL Editor
```

✅ Verify tables created:
- `disputes`
- `transactions`
- `user_activity_logs`
- `action_taxonomy`

### 3. Stripe Configuration

✅ Set up webhook endpoint:
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `charge.dispute.created`
- Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

✅ Test webhook:
```bash
stripe listen --forward-to https://your-domain.com/api/webhooks/stripe
stripe trigger charge.dispute.created
```

### 4. Initial Data Sync

✅ Sync historical transactions:
```bash
# Via API
curl -X POST https://your-domain.com/api/sync/transactions?limit=1000

# Or via script
npx tsx scripts/sync-transactions.ts 1000
```

### 5. Health Check

✅ Verify system health:
```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "checks": {
    "environment": true,
    "database": true,
    "stripe": true
  }
}
```

### 6. Shadow Pilot (First Customer)

✅ Run Shadow Pilot to show ROI:
```bash
npx tsx scripts/shadow-pilot.ts
```

Use output to demonstrate recoverable amount to first beta customer.

## Deployment Platforms

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

- Ensure Node.js 18+ runtime
- Set all environment variables
- Configure webhook URL in Stripe dashboard
- Run database migrations

## Monitoring

### Key Metrics to Track

1. **VAMP Ratio**: Monitor `/api/dashboard/stats`
2. **CE 3.0 Match Rate**: Track `auto_win_eligible` disputes
3. **Evidence Submission Success**: Monitor webhook logs
4. **System Health**: Check `/api/health` endpoint

### Alerts

Set up alerts for:
- VAMP ratio > 0.9%
- Health check failures
- Webhook processing errors
- High dispute volume

## Maintenance

### Regular Tasks

1. **Weekly**: Sync new transactions
   ```bash
   npx tsx scripts/sync-transactions.ts 500
   ```

2. **Monthly**: Review dispute win rates
3. **Quarterly**: Audit compliance scores

### Troubleshooting

**Webhook not receiving events:**
- Verify webhook URL in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches
- Review server logs for signature errors

**CE 3.0 matches not found:**
- Ensure historical transactions synced (120-365 days old)
- Verify IP/device fingerprints stored
- Check payment method fingerprints match

**PDF generation fails:**
- Check server has sufficient memory
- Verify database connection
- Review error logs

---

**You're ready for production! 🚀**


