# Components

Reusable React UI components used across the app.

- **Dashboard.tsx** – Main merchant dashboard (plan banner, Shadow Pilot, sync, dispute queue, VAMP monitor)
- **DisputeQueue.tsx** – Table of disputes with compliance status and actions
- **VAMPMonitor.tsx** – VAMP ratio and threshold (e.g. 1.5%) display
- **RecoverableAmount.tsx** – Recoverable amount ticker
- **AuditModal.tsx** – Modal for free 90-day audit (email + Stripe key)
- **VantirsLogo.tsx** – Logo asset
- **EmptyState.tsx**, **ErrorBoundary.tsx** – Empty state and error boundary
- **DisputeQueueSkeleton.tsx**, **VAMPMonitorSkeleton.tsx** – Loading skeletons

All are client components unless noted. Used by pages under `app/` (e.g. dashboard, onboarding, landing).
