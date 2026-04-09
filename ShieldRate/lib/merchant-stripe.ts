/**
 * Merchant-Specific Stripe Client
 * Creates Stripe instances for specific merchants
 * Handles encrypted Stripe keys and OAuth tokens transparently
 * Supports automatic token refresh for OAuth connections
 */

import Stripe from 'stripe'
import { supabaseAdmin } from './supabase'
import { logger } from './logger'
import { decrypt, encrypt } from './encryption'

// Cache for Stripe clients (keyed by merchant_id) with TTL
const STRIPE_CLIENT_CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
const stripeClientsCache = new Map<string, { client: Stripe; expiresAt: number }>()

/**
 * Refresh OAuth access token using refresh token
 */
async function refreshAccessToken(
  merchantId: string,
  refreshToken: string
): Promise<string> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured for token refresh')
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  })

  try {
    const tokenResponse = await stripe.oauth.token({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    // Validate access token exists
    if (!tokenResponse.access_token) {
      throw new Error('No access token in refresh response')
    }

    // Update merchant with new access token
    const encryptedAccessToken = encrypt(tokenResponse.access_token)
    await supabaseAdmin
      .from('merchants')
      .update({
        stripe_access_token: encryptedAccessToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', merchantId)

    logger.info({
      event: 'STRIPE_TOKEN_REFRESHED',
      merchantId,
    })

    return tokenResponse.access_token
  } catch (error: any) {
    logger.error({
      event: 'STRIPE_TOKEN_REFRESH_FAILED',
      merchantId,
      error: error.message,
    })
    throw new Error(`Failed to refresh access token: ${error.message}`)
  }
}

/**
 * Get Stripe client for a specific merchant
 * Automatically decrypts Stripe keys or OAuth tokens
 * Handles OAuth token refresh if needed
 */
export async function getMerchantStripe(merchantId: string): Promise<Stripe> {
  // Check cache first (with TTL)
  const cached = stripeClientsCache.get(merchantId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.client
  }
  if (cached) {
    stripeClientsCache.delete(merchantId)
  }

  // Fetch merchant from database
  // Note: Use .maybeSingle() instead of .single() to handle case where merchant might not exist
  // Select all columns - if OAuth columns don't exist (migration not run), they'll be null
  const { data: merchant, error } = await supabaseAdmin
    .from('merchants')
    .select('*') // Select all columns to handle missing OAuth columns gracefully
    .eq('id', merchantId)
    .maybeSingle()

  if (error) {
    logger.error({
      event: 'MERCHANT_FETCH_ERROR',
      merchantId,
      error: error.message,
      code: error.code,
      details: error.details,
    })
    throw new Error(`Database error fetching merchant: ${merchantId}. Error: ${error.message}`)
  }

  if (!merchant) {
    logger.error({
      event: 'MERCHANT_NOT_FOUND',
      merchantId,
      message: 'Merchant ID exists in auth but not found in database query',
    })
    throw new Error(`Merchant not found: ${merchantId}`)
  }

  if (!merchant.is_active) {
    throw new Error(`Merchant account is inactive: ${merchantId}`)
  }

  // Extract merchant fields (handle missing OAuth columns gracefully)
  const connectionMethod = (merchant as any).connection_method || 'manual'
  const stripeSecretKey = (merchant as any).stripe_secret_key
  const stripeAccessToken = (merchant as any).stripe_access_token || null
  const stripeRefreshToken = (merchant as any).stripe_refresh_token || null

  // Check if merchant has any Stripe credentials
  if (!stripeSecretKey && !stripeAccessToken) {
    logger.error({
      event: 'MERCHANT_NO_STRIPE_CREDENTIALS',
      merchantId,
      connection_method: connectionMethod,
    })
    throw new Error(`Merchant has no Stripe credentials configured. Please connect your Stripe account first.`)
  }

  let decryptedKey: string
  
  if (connectionMethod === 'oauth' && stripeAccessToken) {
      try {
        decryptedKey = decrypt(stripeAccessToken)
        
        // Test if token is still valid by making a simple API call
        try {
          const testStripe = new Stripe(decryptedKey, {
            apiVersion: '2023-10-16',
          })
          await testStripe.accounts.retrieve()
        } catch (tokenError: any) {
          // Token might be expired, try to refresh
          if (stripeRefreshToken && tokenError.code === 'invalid_api_key') {
            logger.info({
              event: 'STRIPE_TOKEN_EXPIRED',
              merchantId,
              action: 'refreshing',
            })
            
            const decryptedRefreshToken = decrypt(stripeRefreshToken)
            decryptedKey = await refreshAccessToken(merchantId, decryptedRefreshToken)
          } else {
            throw tokenError
          }
        }
    } catch (error: any) {
      logger.error({
        event: 'STRIPE_OAUTH_TOKEN_ERROR',
        merchantId,
        error: error.message,
      })
      throw new Error(`Failed to use OAuth token: ${error.message}`)
    }
  } else if ((merchant as any).stripe_secret_key) {
      // Fallback to manual API key (backward compatibility)
      const stripeSecretKey = (merchant as any).stripe_secret_key
      try {
        decryptedKey = decrypt(stripeSecretKey)
      } catch (error: any) {
        // If decryption fails, assume it's plaintext (backward compatibility)
        logger.warn({
          event: 'STRIPE_KEY_DECRYPT_FAILED',
          merchantId,
          message: 'Using plaintext key (backward compatibility)',
        })
        decryptedKey = stripeSecretKey
      }
  } else {
    throw new Error(`Merchant has no Stripe credentials configured: ${merchantId}`)
  }

  // Create Stripe client
  const stripe = new Stripe(decryptedKey, {
    apiVersion: '2023-10-16',
  })

  // Cache it with TTL
  stripeClientsCache.set(merchantId, {
    client: stripe,
    expiresAt: Date.now() + STRIPE_CLIENT_CACHE_TTL_MS,
  })

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


