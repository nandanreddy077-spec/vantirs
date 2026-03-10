/**
 * Razorpay Billing Integration (DISABLED)
 *
 * Vantirs is completely free — all billing functions are no-ops.
 * This file is retained for future use if paid plans are re-introduced.
 */

export function getRazorpayPlanId(_plan: string): null {
  return null
}

export async function getOrCreateRazorpayCustomer(
  _merchantId: string,
  _email: string,
  _name: string,
): Promise<string> {
  throw new Error('Billing is disabled — Vantirs is completely free.')
}

export async function createRazorpaySubscription(
  _merchantId: string,
  _plan: string,
  _successUrl: string,
  _cancelUrl: string,
): Promise<{ subscriptionId: string; checkoutUrl: string }> {
  throw new Error('Billing is disabled — Vantirs is completely free.')
}

export async function createRazorpayPaymentLink(
  _merchantId: string,
  _plan: string,
  _successUrl: string,
  _cancelUrl: string,
): Promise<string> {
  throw new Error('Billing is disabled — Vantirs is completely free.')
}

export async function updateMerchantPlanFromRazorpaySubscription(
  _subscriptionId: string,
  _subscriptionStatus: string,
): Promise<void> {
  // No-op
}

export async function cancelRazorpaySubscription(_merchantId: string): Promise<void> {
  // No-op
}

export async function reactivateRazorpaySubscription(_merchantId: string): Promise<void> {
  // No-op
}
