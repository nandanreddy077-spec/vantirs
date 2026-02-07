# Vantirs - CE 3.0 Compliance Engine

**Automated Visa CE 3.0 Liability Shift for SaaS Chargeback Defense**

Vantirs is a forensic-grade chargeback defense engine that automatically identifies disputes eligible for Visa CE 3.0 liability shift and generates bank-admissible forensic evidence. Built as a System of Record for dispute compliance.

## 🎯 Core Features

- **CE 3.0 Historical Footprint Matching**: Automatically finds 2+ successful transactions from 120-365 days ago with matching IP/device fingerprints
- **Compliance Score Calculation**: 0-100 score based on Identity, Value, Consent, and Continuity evidence
- **Forensic PDF Generation**: Bank-ready compliance reports (not letters) formatted for OCR scanning
- **VAMP Threshold Monitoring**: Real-time tracking of dispute ratio vs. 1.5% threshold (April 2026)
- **Auto-Win Eligibility Detection**: Identifies disputes that qualify for automatic liability shift

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (or PostgreSQL database)
- Stripe account with webhook access

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Connect OAuth (Optional - for one-click setup)
STRIPE_CONNECT_CLIENT_ID=ca_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Set up database:**

Run the SQL schema in `database/schema.sql` in your Supabase SQL editor (or PostgreSQL database).

4. **Run development server:**

```bash
npm run dev
```

5. **Configure Stripe webhook:**

Point your Stripe webhook endpoint to:
```
https://your-domain.com/api/webhooks/stripe
```

Listen for: `charge.dispute.created`

## 📊 Database Schema

### Tables

- **`disputes`**: All chargeback disputes with compliance scores
- **`transactions`**: Historical successful charges for CE 3.0 matching
- **`user_activity_logs`**: Product usage evidence (Identity, Value, Consent, Continuity)
- **`action_taxonomy`**: Maps app events to evidence categories

## 🔧 API Routes

### Webhooks

- `POST /api/webhooks/stripe` - Handles Stripe webhook events (idempotent, auto-submits evidence)

### Dashboard

- `GET /api/dashboard/stats` - Returns aggregated statistics
- `GET /api/disputes` - Returns all disputes
- `GET /api/disputes/[id]/pdf` - Downloads compliance pack PDF
- `POST /api/disputes/[id]/submit` - Manually submit evidence to Stripe

### Utilities

- `POST /api/sync/transactions` - Sync historical Stripe charges
- `GET /api/health` - System health check
- `POST /api/track` - Event tracking endpoint (for SDK)

## 🎨 Components

- **Dashboard**: Main dashboard with VAMP monitor and dispute queue
- **VAMPMonitor**: Real-time dispute ratio tracking with threshold alerts
- **DisputeQueue**: Table of all disputes with compliance scores
- **RecoverableAmount**: Ticker showing auto-win eligible dispute value

## 📝 Action Taxonomy

The system normalizes all user activity into 4 evidence categories:

1. **Identity**: Login, profile updates, password resets
2. **Value**: Exports, API calls, feature usage, seat additions
3. **Consent**: ToS acceptance, payment method additions
4. **Continuity**: Historical transaction patterns

## 🔒 Compliance Features

- **CE 3.0 Eligibility**: Automatic detection of disputes with 2+ historical matches
- **VAMP Calculation**: Disputes won via CE 3.0 are removed from ratio calculation
- **Forensic Evidence**: Structured PDFs formatted for bank OCR scanning
- **Idempotent Processing**: Webhook handlers prevent duplicate processing

## 📈 The "Shadow Pilot" Strategy

Before building UI, run the forensic engine against historical Stripe data:

1. Fetch all disputes from last 90 days
2. Run CE 3.0 matching algorithm
3. Show customer: "You have $X,XXX in auto-win eligible disputes"
4. Connect database to activate real-time defense

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase/PostgreSQL**
- **Stripe API**
- **PDFKit** (PDF generation)
- **Tailwind CSS**
- **Lucide React** (Icons)

## 🚀 Complete Feature Set

### Core Features ✅
- **CE 3.0 Historical Footprint Matching**: Automatic detection of eligible disputes
- **Compliance Score Calculation**: 0-100 score based on evidence
- **Forensic PDF Generation**: Bank-ready compliance reports
- **VAMP Threshold Monitoring**: Real-time dispute ratio tracking
- **Auto-Win Detection**: Identifies disputes eligible for liability shift
- **Automatic Evidence Submission**: Auto-submits to Stripe for CE 3.0 eligible disputes

### Additional Features ✅
- **Transaction Sync**: Sync historical Stripe charges for CE 3.0 matching
- **Health Check API**: System status monitoring
- **Error Boundaries**: Graceful error handling
- **Shadow Pilot Script**: Historical ROI analysis
- **Webhook Testing**: Utilities for testing Stripe integration

## 📚 Next Steps

1. **Phase 1 (Days 1-30)**: Build forensic engine ✅ **COMPLETE**
2. **Phase 2 (Days 31-60)**: Create lightweight SDK for event tracking ✅ **COMPLETE**
3. **Phase 3 (Days 61-90)**: Build anonymized risk signal network (Future)

## ⚠️ Important Notes

- **April 1, 2026 Deadline**: VAMP threshold drops to 1.5% (from 2.2%)
- **CE 3.0 Requirements**: Need 2+ historical transactions 120-365 days old
- **Bank Acceptance**: PDFs must be structured tables, not letters
- **Idempotency**: All webhook handlers are idempotent (safe to retry)

## 📄 License

Proprietary - All rights reserved

---

**Built for the April 2026 regulatory cliff. Every SaaS needs this.**

