/**
 * Razorpay Billing Integration
 * Handles subscription creation, updates, and cancellations
 */

import Razorpay from 'razorpay'
import { supabaseAdmin } from './supabase'
import { logger } from './logger'
import type { Plan } from './plan-limits'

// Lazy-load Razorpay instance to avoid build-time errors
let razorpayInstance: Razorpay | null = null

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured')
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return razorpayInstance
}

// Razorpay Plan IDs
const RAZORPAY_PLAN_IDS: Record<Exclude<Plan, 'free' | 'enterprise'>, string> = {
  starter: process.env.RAZORPAY_PLAN_STARTER || 'plan_SG6t5HnxJ6S75c',
  professional: process.env.RAZORPAY_PLAN_PROFESSIONAL || 'plan_SG6txu02j5MI7C',
}

// Map plan names to Razorpay plan IDs
export function getRazorpayPlanId(plan: Plan): string | null {
  if (plan === 'free' || plan === 'enterprise') {
    return null // Free doesn't need Razorpay, Enterprise is custom
  }
  return RAZORPAY_PLAN_IDS[plan] || null
}

/**
 * Create or retrieve Razorpay customer for merchant
 */
export async function getOrCreateRazorpayCustomer(
  merchantId: string,
  email: string,
  name: string,
  contact?: string
): Promise<string> {
  // Check if merchant already has a Razorpay customer ID
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('razorpay_customer_id')
    .eq('id', merchantId)
    .single()

  if (merchant?.razorpay_customer_id) {
    return merchant.razorpay_customer_id
  }

  // Create new Razorpay customer
  const customer = await getRazorpayInstance().customers.create({
    name,
    email,
    contact: contact || undefined,
    notes: {
      vantirs_merchant_id: merchantId,
    },
  })

  // Save customer ID to merchant record
  await supabaseAdmin
    .from('merchants')
    .update({
      razorpay_customer_id: customer.id,
    })
    .eq('id', merchantId)

  logger.info({
    event: 'RAZORPAY_CUSTOMER_CREATED',
    merchantId,
    customerId: customer.id,
  })

  return customer.id
}

/**
 * Create Razorpay Subscription for merchant
 */
export async function createRazorpaySubscription(
  merchantId: string,
  plan: 'starter' | 'professional',
  successUrl: string,
  cancelUrl: string
): Promise<{ subscriptionId: string; checkoutUrl: string }> {
  // Get merchant details
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('email, name')
    .eq('id', merchantId)
    .single()

  if (!merchant) {
    throw new Error('Merchant not found')
  }

  // Get or create Razorpay customer
  const customerId = await getOrCreateRazorpayCustomer(
    merchantId,
    merchant.email,
    merchant.name
  )

  // Get plan ID for plan
  const planId = getRazorpayPlanId(plan)
  if (!planId) {
    throw new Error(`No plan ID configured for plan: ${plan}`)
  }

  // Create subscription
  const subscription = await getRazorpayInstance().subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: 0, // 0 = infinite subscription
    notes: {
      vantirs_merchant_id: merchantId,
      plan: plan,
    },
  })

  // Create checkout session (Razorpay subscription link)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantirs.com'
  
  // For Razorpay, we'll use the subscription's hosted page or create a payment link
  // Note: Razorpay subscriptions don't have a direct checkout URL like Stripe
  // We'll need to create a payment link or use Razorpay Checkout
  const checkoutUrl = `${baseUrl}/billing/razorpay-checkout?subscription_id=${subscription.id}`

  // Save subscription ID to merchant record
  await supabaseAdmin
    .from('merchants')
    .update({
      razorpay_subscription_id: subscription.id,
      razorpay_customer_id: customerId,
    })
    .eq('id', merchantId)

  logger.info({
    event: 'RAZORPAY_SUBSCRIPTION_CREATED',
    merchantId,
    plan,
    subscriptionId: subscription.id,
  })

  return {
    subscriptionId: subscription.id,
    checkoutUrl,
  }
}

/**
 * Create Razorpay Subscription and return checkout URL
 * For Razorpay, we create a subscription and use the subscription's hosted page
 */
export async function createRazorpayPaymentLink(
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

  // Get or create Razorpay customer
  const customerId = await getOrCreateRazorpayCustomer(
    merchantId,
    merchant.email,
    merchant.name
  )

  // Get plan ID
  const planId = getRazorpayPlanId(plan)
  if (!planId) {
    throw new Error(`No plan ID configured for plan: ${plan}`)
  }

  // Create subscription
  const subscription = await getRazorpayInstance().subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: 0, // 0 = infinite subscription
    notes: {
      vantirs_merchant_id: merchantId,
      plan: plan,
    },
  })

  // Save subscription ID to merchant record
  await supabaseAdmin
    .from('merchants')
    .update({
      razorpay_subscription_id: subscription.id,
      razorpay_customer_id: customerId,
    })
    .eq('id', merchantId)

  logger.info({
    event: 'RAZORPAY_SUBSCRIPTION_CREATED_FOR_CHECKOUT',
    merchantId,
    plan,
    subscriptionId: subscription.id,
  })

  // For Razorpay subscriptions, we need to create a payment link or use checkout
  // The subscription will be activated once the first payment is captured
  // Return a URL that redirects to Razorpay checkout for the subscription
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantirs.com'
  
  // Create a payment link for the subscription's first payment
  // Note: Razorpay subscriptions require the first payment to be captured
  // We'll use the subscription's short_url if available, or create a payment link
  try {
    // Fetch subscription to get payment details
    const subscriptionDetails = await getRazorpayInstance().subscriptions.fetch(subscription.id)
    
    // If subscription has a short_url, use it
    if ((subscriptionDetails as any).short_url) {
      return (subscriptionDetails as any).short_url
    }
    
    // Otherwise, create a payment link for the subscription amount
    const planDetails = await getRazorpayInstance().plans.fetch(planId)
    const amount = planDetails.item.amount
    
    const paymentLink = await getRazorpayInstance().paymentLink.create({
      amount: amount,
      currency: planDetails.item.currency || 'INR',
      description: `Vantirs ${plan.toUpperCase()} Plan - First Payment`,
      customer: {
        name: merchant.name,
        email: merchant.email,
      },
      notify: {
        email: true,
        sms: false,
      },
      callback_url: successUrl,
      callback_method: 'get',
      notes: {
        vantirs_merchant_id: merchantId,
        plan: plan,
        subscription_id: subscription.id,
        type: 'subscription_first_payment',
      },
    })
    
    return paymentLink.short_url || paymentLink.id
  } catch (error: any) {
    // Fallback: return a URL that shows subscription details
    logger.warn({
      event: 'RAZORPAY_PAYMENT_LINK_FALLBACK',
      merchantId,
      subscriptionId: subscription.id,
      error: error.message,
    })
    
    return `${baseUrl}/billing/razorpay-checkout?subscription_id=${subscription.id}`
  }
}

/**
 * Update merchant plan based on Razorpay subscription
 */
export async function updateMerchantPlanFromRazorpaySubscription(
  subscriptionId: string,
  subscriptionStatus: string
): Promise<void> {
  // Fetch subscription from Razorpay
  const subscription = await getRazorpayInstance().subscriptions.fetch(subscriptionId)
  
  const merchantId = subscription.notes?.vantirs_merchant_id
  if (!merchantId) {
    logger.warn({
      event: 'RAZORPAY_SUBSCRIPTION_MISSING_MERCHANT_ID',
      subscriptionId,
    })
    return
  }

  // Determine plan from subscription
  const planId = subscription.plan_id
  let plan: Plan = 'free'
  
  if (planId === RAZORPAY_PLAN_IDS.starter) {
    plan = 'starter'
  } else if (planId === RAZORPAY_PLAN_IDS.professional) {
    plan = 'professional'
  } else {
    // Check metadata
    plan = (subscription.notes?.plan as Plan) || 'free'
  }

  // Get plan limits
  const { PLAN_LIMITS } = await import('./plan-limits')
  const limits = PLAN_LIMITS[plan]

  // Map Razorpay status to our status
  let status = 'active'
  if (subscriptionStatus === 'cancelled' || subscriptionStatus === 'expired') {
    status = 'canceled'
  } else if (subscriptionStatus === 'paused') {
    status = 'past_due'
  } else if (subscriptionStatus === 'active') {
    status = 'active'
  }

  // Update merchant record
  const updates: any = {
    plan: plan,
    razorpay_subscription_id: subscriptionId,
    subscription_status: status,
    disputes_limit: limits.disputesLimit === 'unlimited' ? null : limits.disputesLimit,
    subscription_started_at: new Date(subscription.created_at * 1000).toISOString(),
    billing_cycle_start: new Date().toISOString(), // Reset billing cycle
    disputes_used_this_month: 0, // Reset monthly counter
  }

  // Handle cancellation
  if (status === 'canceled') {
    // Downgrade to free plan
    updates.plan = 'free'
    updates.disputes_limit = 2
    updates.subscription_status = 'canceled'
    updates.subscription_ends_at = subscription.ended_at
      ? new Date(subscription.ended_at * 1000).toISOString()
      : new Date().toISOString()
  } else if (status === 'active') {
    updates.subscription_ends_at = null
  }

  await supabaseAdmin
    .from('merchants')
    .update(updates)
    .eq('id', merchantId)

  logger.info({
    event: 'MERCHANT_PLAN_UPDATED_RAZORPAY',
    merchantId,
    plan,
    subscriptionId,
    status,
  })
}

/**
 * Cancel Razorpay subscription
 */
export async function cancelRazorpaySubscription(merchantId: string): Promise<void> {
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('razorpay_subscription_id')
    .eq('id', merchantId)
    .single()

  if (!merchant?.razorpay_subscription_id) {
    throw new Error('No active subscription found')
  }

  // Cancel subscription (cancel_at_cycle_end = true means cancel at end of billing period)
  // Note: Razorpay API expects second parameter as boolean or number, not an object
  await getRazorpayInstance().subscriptions.cancel(merchant.razorpay_subscription_id, true)

  // Update merchant status
  await supabaseAdmin
    .from('merchants')
    .update({
      subscription_status: 'canceled',
    })
    .eq('id', merchantId)

  logger.info({
    event: 'RAZORPAY_SUBSCRIPTION_CANCELED',
    merchantId,
    subscriptionId: merchant.razorpay_subscription_id,
  })
}

/**
 * Reactivate canceled Razorpay subscription
 */
export async function reactivateRazorpaySubscription(merchantId: string): Promise<void> {
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('razorpay_subscription_id')
    .eq('id', merchantId)
    .single()

  if (!merchant?.razorpay_subscription_id) {
    throw new Error('No subscription found')
  }

  // Resume subscription
  await getRazorpayInstance().subscriptions.resume(merchant.razorpay_subscription_id, {
    resume_at: 'now', // Resume immediately
  })

  // Update merchant status
  await supabaseAdmin
    .from('merchants')
    .update({
      subscription_status: 'active',
    })
    .eq('id', merchantId)

  logger.info({
    event: 'RAZORPAY_SUBSCRIPTION_REACTIVATED',
    merchantId,
    subscriptionId: merchant.razorpay_subscription_id,
  })
}

