/**
 * Merchant-Specific Stripe Client
 * Creates Stripe instances for specific merchants
 * Handles encrypted Stripe keys transparently
 */

import Stripe from 'stripe'
import { supabaseAdmin } from './supabase'
import { logger } from './logger'
import { decrypt } from './encryption'

// Cache for Stripe clients (keyed by merchant_id)
const stripeClientsCache = new Map<string, Stripe>()

/**
 * Get Stripe client for a specific merchant
 * Automatically decrypts Stripe keys if encrypted
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

  // Decrypt Stripe key if encrypted
  let decryptedKey: string
  try {
    decryptedKey = decrypt(merchant.stripe_secret_key)
  } catch (error: any) {
    // If decryption fails, assume it's plaintext (backward compatibility)
    logger.warn({
      event: 'STRIPE_KEY_DECRYPT_FAILED',
      merchantId,
      message: 'Using plaintext key (backward compatibility)',
    })
    decryptedKey = merchant.stripe_secret_key
  }

  // Create Stripe client
  const stripe = new Stripe(decryptedKey, {
    apiVersion: '2023-10-16',
  })

  // Cache it
  stripeClientsCache.set(merchantId, stripe)

  return stripe
}

/**
 * Get merchant by Stripe webhook secret (for webhook identification)
 * Automatically decrypts webhook secret for comparison
 */
export async function getMerchantByWebhookSecret(
  webhookSecret: string
): Promise<{ id: string; stripe_secret_key: string } | null> {
  // Fetch all active merchants (we need to decrypt to compare)
  const { data: merchants, error } = await supabaseAdmin
    .from('merchants')
    .select('id, stripe_secret_key, stripe_webhook_secret, is_active')
    .eq('is_active', true)

  if (error || !merchants) {
    return null
  }

  // Find merchant by comparing decrypted webhook secrets
  for (const merchant of merchants) {
    try {
      const decryptedWebhookSecret = decrypt(merchant.stripe_webhook_secret)
      if (decryptedWebhookSecret === webhookSecret) {
        // Decrypt Stripe secret key for return
        let decryptedStripeKey: string
        try {
          decryptedStripeKey = decrypt(merchant.stripe_secret_key)
        } catch {
          decryptedStripeKey = merchant.stripe_secret_key // Fallback to plaintext
        }

        return {
          id: merchant.id,
          stripe_secret_key: decryptedStripeKey,
        }
      }
    } catch {
      // If decryption fails, try plaintext comparison (backward compatibility)
      if (merchant.stripe_webhook_secret === webhookSecret) {
        return {
          id: merchant.id,
          stripe_secret_key: merchant.stripe_secret_key,
        }
      }
    }
  }

  return null
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


