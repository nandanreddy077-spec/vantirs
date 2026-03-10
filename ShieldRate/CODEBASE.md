# Vantirs Codebase Guide

This document helps anyone navigate the project: where things live and how they fit together.

---

## High-level architecture

- **Next.js 14 (App Router)** – All UI and API routes live under `app/`.
- **Multi-tenant** – Each merchant has their own Stripe connection and API key; data is scoped by `merchant_id`.
- **Core flow** – Stripe webhook → dispute created → CE 3.0 matcher runs → dispute row updated (with matched charge IDs) → PDF generated (optionally auto-submitted). Billing is handled by Razorpay.

---

## Directory structure

```
ShieldRate/
├── app/                    # Next.js App Router (pages + API routes)
│   ├── page.tsx            # Landing page
│   ├── layout.tsx          # Root layout
│   ├── onboarding/         # Merchant signup + Stripe connection
│   ├── dashboard/          # Merchant dashboard (API key gated)
│   ├── pricing/            # Pricing tiers + Razorpay checkout
│   ├── audit/              # Free 90-day audit results (token-based)
│   ├── billing/            # Post-checkout success
│   ├── setup-guide/        # Stripe + charge metadata setup
│   ├── documentation/      # API/docs
│   ├── security/           # Security overview
│   ├── terms-of-service/
│   ├── privacy-policy/
│   └── api/                # All API routes (see below)
├── components/             # Reusable UI components
├── lib/                    # Shared logic (no UI)
├── database/               # SQL schema + migrations
├── scripts/                # CLI and one-off scripts
└── CODEBASE.md             # This file
```

---

## `app/api/` – API routes (grouped by purpose)

### Authentication
- **`/api/auth/recover-api-key`** – Recover API key by email (sends or returns key).

### Dashboard & disputes (merchant-scoped; require API key)
- **`/api/dashboard/stats`** – Aggregated stats for the authenticated merchant.
- **`/api/disputes`** – List disputes for the merchant.
- **`/api/disputes/[id]/pdf`** – Generate and download compliance pack PDF (uses merchant Stripe for multi-tenant).
- **`/api/disputes/[id]/submit`** – Manually submit evidence to Stripe.

### Onboarding & sync (merchant-scoped)
- **`/api/onboarding/connect-stripe`** – Create merchant and store encrypted Stripe keys + webhook secret; returns API key.
- **`/api/onboarding/sync-transactions`** – Sync 12 months of Stripe charges into `transactions` (for CE 3.0).
- **`/api/onboarding/sync-disputes`** – Sync existing Stripe disputes into Vantirs (with CE 3.0 + hist match IDs).
- **`/api/onboarding/shadow-pilot`** – Run Shadow Pilot: analyse last 90 days and return recoverable amount / CE 3.0 eligible count.
- **`/api/onboarding/stripe-connect`** – (Optional) Stripe OAuth connect entry.
- **`/api/onboarding/stripe-connect/callback`** – OAuth callback.

### Billing (Razorpay)
- **`/api/billing/checkout`** – Create Razorpay payment link for a plan; redirect merchant to pay.
- **`/api/billing/portal`** – Return URL for managing subscription (e.g. Razorpay dashboard).

### Webhooks (no API key; verified by signature)
- **`/api/webhooks/stripe`** – Legacy single-tenant Stripe webhook (disputes).
- **`/api/webhooks/stripe/[merchantId]`** – Per-merchant Stripe webhook (disputes); verifies with merchant’s webhook secret; runs CE 3.0, stores `hist_match_charge_id_1`/`_2`, optional auto-submit.
- **`/api/webhooks/razorpay`** – Razorpay subscription/payment events; updates merchant plan and billing state.
- **`/api/webhooks/stripe-billing`** – (Legacy) Stripe billing webhook if still used.

### Free audit (public, rate-limited)
- **`/api/audit/free`** – POST: email + Stripe key → runs 90-day CE 3.0 audit; stores result with token; no key stored.
- **`/api/audit/results`** – GET: `?token=...` → returns audit result for that token.

### Sync & background (internal / cron)
- **`/api/sync/transactions`** – Sync transactions (used by onboarding and cron).
- **`/api/cron/sync-transactions`** – Daily cron: sync transactions for active merchants (protected by `CRON_SECRET`).
- **`/api/cron/reset-counters`** – Monthly cron: reset `disputes_used_this_month` for paid plans (calls `reset_monthly_dispute_counters()`).
- **`/api/cron/cleanup-audit-results`** – Daily cron: delete expired audit results (calls `cleanup_expired_audit_results()`).

### Other
- **`/api/health`** – Health check.
- **`/api/metrics`** – Metrics endpoint.
- **`/api/track`** – Event tracking (e.g. for SDK / usage evidence).

---

## `lib/` – Shared logic (no UI)

### Core domain
- **`ce3-matcher.ts`** – Visa CE 3.0 and Mastercard FPT: finds 2+ historical charges (120–365 days) with IP/device match; returns checklist + matched charge IDs. Used by webhooks and sync-disputes.
- **`pdf-generator.ts`** – Builds compliance pack PDF from dispute + stored hist match IDs (and fallback); optional watermark; uses provided Stripe client for multi-tenant.
- **`pdf-validator.ts`** – Validates PDF (size, pages, required fields) before submission.
- **`stripe-submission.ts`** – Loads merchant Stripe, generates PDF, validates, uploads to Stripe Files, submits evidence.
- **`plan-limits.ts`** – Plan definitions (FREE, STARTER, PRO, ENTERPRISE), limits, and helpers (`checkDisputeLimit`, `incrementDisputeCounter`, `hasFeature`).

### Stripe & billing
- **`stripe.ts`** – Default Stripe client (single-tenant / fallback).
- **`merchant-stripe.ts`** – Per-merchant Stripe client from encrypted keys; `getMerchant`, `getMerchantStripe`.
- **`razorpay-billing.ts`** – Razorpay: customer, subscription, payment links; updates merchant plan from webhooks.
- **`transaction-sync.ts`** – Sync Stripe charges into `transactions` (with optional merchant Stripe client).

### Auth & security
- **`auth.ts`** – API key auth: `authenticateRequest(req)` → merchant or null. Reads key from header or query.
- **`api-key-hash.ts`** – Hash/verify API keys (bcrypt); `vant_` prefix.
- **`encryption.ts`** – AES-256-GCM for encrypting Stripe keys and audit email.
- **`rate-limit.ts`** – Upstash rate limiters (e.g. free audit, webhooks).

### Data & infra
- **`supabase.ts`** – Supabase clients: `supabaseAdmin` (service role), `supabase` (anon).
- **`db-transactions.ts`** – DB transaction / process-dispute wrapper used by webhooks.
- **`cache.ts`** – Cache helpers (e.g. CE 3.0 match cache).
- **`types.ts`** – Shared TypeScript types.

### Observability & config
- **`logger.ts`** – Pino logger and log events.
- **`env.ts`** – `validateEnv()` for required env vars.
- **`notifications.ts`** – Notifications (e.g. validation failure).
- **`security-headers.ts`** – Security headers for responses.
- **`pii-scrubber.ts`** – Scrub PII from logs.
- **`error-tracking.ts`** – Error handling helpers.
- **`metrics.ts`** – Metrics.
- **`background-jobs.ts`** – Scheduled sync entry (used by cron).
- **`shieldrate-sdk.ts`** – SDK for event tracking.
- **`job-queue.ts`**, **`supabase-pool.ts`** – Job queue and pool utilities.

---

## `components/` – UI components

- **`Dashboard.tsx`** – Main dashboard: plan banner, Shadow Pilot, sync buttons, dispute queue, VAMP monitor.
- **`DisputeQueue.tsx`** – Table of disputes with compliance status.
- **`VAMPMonitor.tsx`** – VAMP ratio and threshold display.
- **`RecoverableAmount.tsx`** – Recoverable amount ticker.
- **`AuditModal.tsx`** – Modal for free audit (email + Stripe key).
- **`VantirsLogo.tsx`** – Logo.
- **`EmptyState.tsx`**, **`ErrorBoundary.tsx`**, **`*Skeleton.tsx`** – Shared UI/loading/error.

---

## `database/` – Schema and migrations

- **`schema.sql`** – Base schema: `disputes`, `transactions`, `user_activity_logs`, `action_taxonomy`, indexes.
- **Migrations** – Run in order; see **`database/README.md`** for the exact sequence and purpose of each file.
- Important tables: **`merchants`** (Stripe keys, Razorpay IDs, plan, limits), **`disputes`** (includes `hist_match_charge_id_1`/`_2` for PDF triad), **`audit_results`** (token + encrypted email + result JSON).

---

## `scripts/` – CLI and one-off

- **`sync-transactions.ts`** – CLI to sync transactions.
- **`shadow-pilot.ts`** – CLI to run Shadow Pilot.
- **`test-webhook.ts`** – Test Stripe webhook.
- **`verify-production.ts`**, **`validate-production.ts`**, **`test-all.ts`** – Production checks and tests.

---

## How key flows work

1. **New dispute**  
   Stripe sends `charge.dispute.created` to `/api/webhooks/stripe/[merchantId]`. Handler loads merchant Stripe, fetches charge, runs **CE 3.0 matcher**, writes dispute row (including `hist_match_charge_id_1`, `hist_match_charge_id_2`), checks plan limit, increments counter, optionally **auto-submits** evidence (PDF generated with merchant Stripe, then submitted).

2. **PDF generation**  
   **`generateCompliancePack(disputeId, watermark?, stripeClient?)`** loads dispute from DB, uses `stripeClient` (or default) to fetch dispute/charge from Stripe, loads the **two historical matches** by `hist_match_charge_id_1`/`_2` from `transactions` (fallback: last 10 for that customer), builds PDF, validates, returns buffer. Used by submit route and PDF download route.

3. **Billing**  
   Merchant picks plan on pricing page → **`/api/billing/checkout`** creates Razorpay payment link → after payment, **Razorpay webhook** hits **`/api/webhooks/razorpay`** → **`razorpay-billing`** updates merchant `plan`, `subscription_status`, etc. Monthly counters are reset by **`/api/cron/reset-counters`** (calls `reset_monthly_dispute_counters()`).

4. **Free audit**  
   User enters email + Stripe key on landing page → **`/api/audit/free`** (rate-limited) validates key, runs 90-day analysis, stores result in **`audit_results`** with a secure token, returns redirect URL with `?token=...` → **`/api/audit/results`** and **`/audit/results`** page show result by token.

---

## Environment variables (summary)

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **App**: `NEXT_PUBLIC_APP_URL`
- **Stripe**: Per-merchant keys stored in DB (encrypted). Optional global `STRIPE_*` for legacy single-tenant.
- **Razorpay**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`; plan IDs in env or code.
- **Security**: `ENCRYPTION_KEY` (for Stripe keys + audit email), `CRON_SECRET` (for cron routes).
- **Rate limiting**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

See **`.env.production.example`** and **`lib/env.ts`** for the full list and validation.
