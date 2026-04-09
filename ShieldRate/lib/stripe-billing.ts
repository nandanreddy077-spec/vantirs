/**
 * Stripe Billing Integration (DISABLED)
 *
 * Vantirs is completely free — all billing functions are no-ops.
 * This file is retained for future use if paid plans are re-introduced.
 */

import type Stripe from 'stripe'

export function getStripePriceId(_plan: string): null {
  return null
}

export async function getOrCreateStripeCustomer(
  _merchantId: string,
  _email: string,
  _name: string,
): Promise<string> {
  throw new Error('Billing is disabled — Vantirs is completely free.')
}

export async function createCheckoutSession(
  _merchantId: string,
  _plan: string,
  _successUrl: string,
  _cancelUrl: string,
): Promise<string> {
  throw new Error('Billing is disabled — Vantirs is completely free.')
}

export async function createPortalSession(
  _merchantId: string,
  _returnUrl: string,
): Promise<string> {
  throw new Error('Billing is disabled — Vantirs is completely free.')
}

export async function updateMerchantPlanFromSubscription(
  _subscription: Stripe.Subscription,
): Promise<void> {
  // No-op
}

export async function cancelSubscription(_merchantId: string): Promise<void> {
  // No-op
}

export async function reactivateSubscription(_merchantId: string): Promise<void> {
  // No-op
}
