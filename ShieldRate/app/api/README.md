# API routes

All API endpoints live under `app/api/`. Routes are grouped by folder:

- **auth/** – API key recovery
- **audit/** – Free 90-day audit (submit + results by token)
- **billing/** – Razorpay checkout and portal
- **cron/** – Scheduled jobs (sync-transactions, reset-counters, cleanup-audit-results)
- **dashboard/** – Stats for authenticated merchant
- **disputes/** – List, PDF download, submit evidence
- **onboarding/** – Connect Stripe, sync transactions/disputes, Shadow Pilot
- **webhooks/** – Stripe (per-merchant + legacy), Razorpay
- **sync/** – Transaction sync
- **health**, **metrics**, **track** – Health, metrics, event tracking

**Full list, purpose of each route, and how they fit together:** see **[CODEBASE.md](../../CODEBASE.md)** (section “app/api/ – API routes”).

**Auth:** Most routes under `dashboard`, `disputes`, `onboarding` require API key (header `X-API-Key` or `Authorization: Bearer <key>`). Webhooks use signature verification; cron routes use `CRON_SECRET`.
