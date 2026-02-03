/**
 * Merchant-Specific Stripe Client
 * Creates Stripe instances for specific merchants
 */

import Stripe from 'stripe'
import { supabaseAdmin } from './supabase'
import { logger } from './logger'

// Cache for Stripe clients (keyed by merchant_id)
const stripeClientsCache = new Map<string, Stripe>()

/**
 * Get Stripe client for a specific merchant
 */
export async function getMerchantStripe(merchantId: string): Promise<Stripe> {
  // Check cache first
  if (stripeClientsCache.has(merchantId)) {
    return stripeClientsCache.get(merchantId)!
  }

  // Fetch merchant from database
  const { data: merchant, error } = await supabaseAdmin
    .from('merchants')
    .select('stripe_secret_key, is_active')
    .eq('id', merchantId)
    .single()

  if (error || !merchant) {
    throw new Error(`Merchant not found: ${merchantId}`)
  }

  if (!merchant.is_active) {
    throw new Error(`Merchant account is inactive: ${merchantId}`)
  }

  if (!merchant.stripe_secret_key) {
    throw new Error(`Merchant has no Stripe key configured: ${merchantId}`)
  }

  // Create Stripe client
  const stripe = new Stripe(merchant.stripe_secret_key, {
    apiVersion: '2023-10-16',
  })

  // Cache it
  stripeClientsCache.set(merchantId, stripe)

  return stripe
}

/**
 * Get merchant by Stripe webhook secret (for webhook identification)
 */
export async function getMerchantByWebhookSecret(
  webhookSecret: string
): Promise<{ id: string; stripe_secret_key: string } | null> {
  const { data: merchant, error } = await supabaseAdmin
    .from('merchants')
    .select('id, stripe_secret_key, is_active')
    .eq('stripe_webhook_secret', webhookSecret)
    .eq('is_active', true)
    .single()

  if (error || !merchant) {
    return null
  }

  return {
    id: merchant.id,
    stripe_secret_key: merchant.stripe_secret_key,
  }
}

/**
 * Clear Stripe client cache for a merchant (useful when keys are updated)
 */
export function clearMerchantStripeCache(merchantId: string): void {
  stripeClientsCache.delete(merchantId)
}

/**
 * Get merchant by ID
 */
export async function getMerchant(merchantId: string) {
  const { data: merchant, error } = await supabaseAdmin
    .from('merchants')
    .select('*')
    .eq('id', merchantId)
    .single()

  if (error || !merchant) {
    return null
  }

  return merchant
}

