/**
 * Stripe Billing Integration
 * Handles subscription creation, updates, and cancellations
 */

import Stripe from 'stripe'
import { stripe } from './stripe'
import { supabaseAdmin } from './supabase'
import { encrypt } from './encryption'
import { logger } from './logger'
import type { Plan } from './plan-limits'

// Stripe Price IDs - These need to be created in Stripe Dashboard
// Format: price_xxxxx for each plan
// You'll need to:
// 1. Create Products in Stripe Dashboard (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
// 2. Create Prices for each product
// 3. Update these constants with your actual Price IDs
const STRIPE_PRICE_IDS: Record<Exclude<Plan, 'free' | 'enterprise'>, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional_placeholder',
}

// Map plan names to Stripe price IDs
export function getStripePriceId(plan: Plan): string | null {
  if (plan === 'free' || plan === 'enterprise') {
    return null // Free doesn't need Stripe, Enterprise is custom
  }
  return STRIPE_PRICE_IDS[plan] || null
}

/**
 * Create or retrieve Stripe customer for merchant
 */
export async function getOrCreateStripeCustomer(
  merchantId: string,
  email: string,
  name: string
): Promise<string> {
  // Check if merchant already has a Stripe customer ID
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('stripe_customer_id')
    .eq('id', merchantId)
    .single()

  if (merchant?.stripe_customer_id) {
    return merchant.stripe_customer_id
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      vantirs_merchant_id: merchantId,
    },
  })

  // Save customer ID to merchant record
  await supabaseAdmin
    .from('merchants')
    .update({
      stripe_customer_id: customer.id,
    })
    .eq('id', merchantId)

  logger.info({
    event: 'STRIPE_CUSTOMER_CREATED',
    merchantId,
    customerId: customer.id,
  })

  return customer.id
}

/**
 * Create Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(
  merchantId: string,
  plan: 'starter' | 'professional',
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  // Get merchant details
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('email, name')
    .eq('id', merchantId)
    .single()

  if (!merchant) {
    throw new Error('Merchant not found')
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(
    merchantId,
    merchant.email,
    merchant.name
  )

  // Get price ID for plan
  const priceId = getStripePriceId(plan)
  if (!priceId) {
    throw new Error(`No price ID configured for plan: ${plan}`)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      vantirs_merchant_id: merchantId,
      plan: plan,
    },
    subscription_data: {
      metadata: {
        vantirs_merchant_id: merchantId,
        plan: plan,
      },
    },
    allow_promotion_codes: true,
  })

  logger.info({
    event: 'CHECKOUT_SESSION_CREATED',
    merchantId,
    plan,
    sessionId: session.id,
  })

  return session.url || ''
}

/**
 * Create Customer Portal session for subscription management
 */
export async function createPortalSession(
  merchantId: string,
  returnUrl: string
): Promise<string> {
  // Get merchant's Stripe customer ID
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('stripe_customer_id')
    .eq('id', merchantId)
    .single()

  if (!merchant?.stripe_customer_id) {
    throw new Error('Merchant does not have a Stripe customer ID')
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: merchant.stripe_customer_id,
    return_url: returnUrl,
  })

  logger.info({
    event: 'PORTAL_SESSION_CREATED',
    merchantId,
    sessionId: session.id,
  })

  return session.url
}

/**
 * Update merchant plan based on Stripe subscription
 */
export async function updateMerchantPlanFromSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  const merchantId = subscription.metadata?.vantirs_merchant_id
  if (!merchantId) {
    logger.warn({
      event: 'SUBSCRIPTION_MISSING_MERCHANT_ID',
      subscriptionId: subscription.id,
    })
    return
  }

  // Determine plan from subscription
  const priceId = subscription.items.data[0]?.price.id
  let plan: Plan = 'free'
  
  if (priceId === STRIPE_PRICE_IDS.starter) {
    plan = 'starter'
  } else if (priceId === STRIPE_PRICE_IDS.professional) {
    plan = 'professional'
  } else {
    // Could be enterprise or unknown - check metadata
    plan = (subscription.metadata?.plan as Plan) || 'free'
  }

  // Get plan limits
  const { PLAN_LIMITS } = await import('./plan-limits')
  const limits = PLAN_LIMITS[plan]

  // Update merchant record
  const updates: any = {
    plan: plan,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    disputes_limit: limits.disputesLimit === 'unlimited' ? null : limits.disputesLimit,
    subscription_started_at: new Date(subscription.created * 1000).toISOString(),
    billing_cycle_start: new Date().toISOString(), // Reset billing cycle
    disputes_used_this_month: 0, // Reset monthly counter
  }

  // Handle cancellation
  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    // Downgrade to free plan
    updates.plan = 'free'
    updates.disputes_limit = 2
    updates.subscription_status = subscription.status
    updates.subscription_ends_at = subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : new Date().toISOString()
  } else if (subscription.status === 'active' || subscription.status === 'trialing') {
    updates.subscription_ends_at = null
  }

  await supabaseAdmin
    .from('merchants')
    .update(updates)
    .eq('id', merchantId)

  logger.info({
    event: 'MERCHANT_PLAN_UPDATED',
    merchantId,
    plan,
    subscriptionId: subscription.id,
    status: subscription.status,
  })
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(merchantId: string): Promise<void> {
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('stripe_subscription_id')
    .eq('id', merchantId)
    .single()

  if (!merchant?.stripe_subscription_id) {
    throw new Error('No active subscription found')
  }

  // Cancel subscription immediately (or at period end)
  await stripe.subscriptions.update(merchant.stripe_subscription_id, {
    cancel_at_period_end: true, // Cancel at end of billing period
  })

  // Update merchant status
  await supabaseAdmin
    .from('merchants')
    .update({
      subscription_status: 'canceled',
    })
    .eq('id', merchantId)

  logger.info({
    event: 'SUBSCRIPTION_CANCELED',
    merchantId,
    subscriptionId: merchant.stripe_subscription_id,
  })
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(merchantId: string): Promise<void> {
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('stripe_subscription_id')
    .eq('id', merchantId)
    .single()

  if (!merchant?.stripe_subscription_id) {
    throw new Error('No subscription found')
  }

  // Reactivate subscription
  await stripe.subscriptions.update(merchant.stripe_subscription_id, {
    cancel_at_period_end: false,
  })

  // Update merchant status
  await supabaseAdmin
    .from('merchants')
    .update({
      subscription_status: 'active',
    })
    .eq('id', merchantId)

  logger.info({
    event: 'SUBSCRIPTION_REACTIVATED',
    merchantId,
    subscriptionId: merchant.stripe_subscription_id,
  })
}








