# Database schema and migrations

Vantirs uses **Supabase (PostgreSQL)**. Apply the base schema first, then run migrations in order.

---

## Run order

Run these in your Supabase SQL editor in this order:

| Order | File | Purpose |
|-------|------|--------|
| 1 | **schema.sql** | Base schema: `disputes`, `transactions`, `user_activity_logs`, `action_taxonomy`, indexes, `update_updated_at_column()` |
| 2 | **migration-multi-tenant.sql** | Adds `merchants` and `merchant_id` on disputes, transactions, user_activity_logs |
| 3 | **migration-fix-encrypted-key-length.sql** | `merchants`: stripe keys from VARCHAR(255) to TEXT (for encrypted values) |
| 4 | **migration-add-auth-encryption.sql** | Auth/encryption-related columns if not in base schema |
| 5 | **migration-api-key-hashing.sql** | API key hashing (e.g. `api_key_hash` on merchants) |
| 6 | **migration-add-stripe-connect.sql** | Optional Stripe Connect OAuth columns on merchants |
| 7 | **migration-add-subscription-plans.sql** | Plan, limits, Razorpay IDs, `reset_monthly_dispute_counters()` |
| 8 | **migration-add-manual-review.sql** | `requires_manual_review` on disputes (e.g. > $500) |
| 9 | **migration-binary-checklist.sql** | Binary CE 3.0 flags (e.g. `liability_shift_eligible`, `historical_match_found`) |
| 10 | **migration-add-transaction-fields.sql** | Extra fields on `transactions` (e.g. for matching/display) |
| 11 | **migration-add-notification-metadata.sql** | Notification metadata if needed |
| 12 | **migration-audit-results.sql** | `audit_results` table + `cleanup_expired_audit_results()` |
| 13 | **migration-hist-match-charge-ids.sql** | `hist_match_charge_id_1`, `hist_match_charge_id_2` on disputes (for PDF triad) |
| 14 | **migration-security-hardening.sql** | Security hardening (e.g. function `search_path`, comments) |

If a migration uses `IF NOT EXISTS` or `ADD COLUMN IF NOT EXISTS`, it’s safe to run again; otherwise run each once in order.

---

## Main tables (after all migrations)

- **merchants** – Tenant: Stripe keys (encrypted), webhook secret, Razorpay IDs, plan, dispute limits, billing cycle.
- **disputes** – One per Stripe dispute; CE 3.0 flags, `hist_match_charge_id_1`/`_2` for evidence triad.
- **transactions** – Historical Stripe charges for CE 3.0 matching (same customer, 120–365 days, IP/device).
- **user_activity_logs** – Usage evidence (Identity, Value, Consent, Continuity).
- **action_taxonomy** – Maps action keys to evidence categories.
- **audit_results** – Free audit: token, encrypted email, result JSON, expiry.

---

## Cron-related functions

- **reset_monthly_dispute_counters()** – Resets `disputes_used_this_month` (and billing cycle) for active paid plans. Called by `/api/cron/reset-counters` (monthly).
- **cleanup_expired_audit_results()** – Deletes expired rows in `audit_results`. Called by `/api/cron/cleanup-audit-results` (daily).

These must exist in the database for the cron routes to work.
