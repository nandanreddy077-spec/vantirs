/**
 * Authentication Middleware
 *
 * Provides API key authentication for merchant-scoped endpoints.
 * Uses in-memory cache to avoid N+1 queries on every request.
 *
 * API keys accepted via headers only (Authorization: Bearer or X-API-Key).
 * Query param ?api_key= is NOT supported — keys leak in logs/browser history.
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'
import { logger, LogEvents } from './logger'
import { verifyApiKey, isApiKeyHashed } from './api-key-hash'
import crypto from 'crypto'

/**
 * In-memory cache for authenticated merchants.
 * Keyed by SHA-256 of the API key. TTL: 5 minutes.
 */
const merchantCache = new Map<string, { merchant: AuthenticatedMerchant; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_CACHE_SIZE = 10000

interface AuthenticatedMerchant {
  id: string
  name: string
  email: string
  is_active: boolean
  plan: string | null
}

function getCachedMerchant(cacheKey: string): AuthenticatedMerchant | null {
  const entry = merchantCache.get(cacheKey)
  if (entry && entry.expiresAt > Date.now()) return entry.merchant
  if (entry) merchantCache.delete(cacheKey)
  return null
}

function setCachedMerchant(cacheKey: string, merchant: AuthenticatedMerchant) {
  if (merchantCache.size > MAX_CACHE_SIZE) merchantCache.clear()
  merchantCache.set(cacheKey, { merchant, expiresAt: Date.now() + CACHE_TTL_MS })
}

/**
 * Authenticate request using API key
 *
 * Accepts:
 * - Header: `Authorization: Bearer <api_key>`
 * - Header: `X-API-Key: <api_key>`
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthenticatedMerchant | null> {
  const authHeader = req.headers.get('authorization')
  const apiKeyHeader = req.headers.get('x-api-key')

  let apiKey: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7)
  } else if (apiKeyHeader) {
    apiKey = apiKeyHeader
  }

  if (!apiKey) {
    logger.warn({
      event: 'AUTH_FAILED',
      reason: 'no_api_key',
      path: req.nextUrl.pathname,
    })
    return null
  }

  // Check in-memory cache first (keyed by SHA-256 of API key)
  const cacheKey = crypto.createHash('sha256').update(apiKey).digest('hex')
  const cached = getCachedMerchant(cacheKey)
  if (cached) {
    logger.info({ event: 'AUTH_SUCCESS', merchantId: cached.id, path: req.nextUrl.pathname, cached: true })
    return cached
  }

  // Optimized lookup: try prefix-based narrowing first
  // For plaintext vant_ keys, prefix match narrows to ~1 row
  // For bcrypt hashes, we still need full scan but it's cached after first hit
  const prefix = apiKey.substring(0, 8)
  const { data: candidates, error } = await supabaseAdmin
    .from('merchants')
    .select('id, name, email, is_active, api_key, plan')
    .eq('is_active', true)
    .like('api_key', `${prefix}%`)

  if (error) {
    logger.warn({ event: 'AUTH_FAILED', reason: 'database_error', path: req.nextUrl.pathname })
    return null
  }

  let merchant: any = null

  // Check prefix-matched candidates first
  if (candidates && candidates.length > 0) {
    for (const m of candidates) {
      const isValid = await verifyApiKey(apiKey, m.api_key)
      if (isValid) {
        merchant = m
        break
      }
    }
  }

  // Fall back to full scan for bcrypt-hashed keys (prefix won't match $2b$...)
  if (!merchant) {
    const { data: allMerchants } = await supabaseAdmin
      .from('merchants')
      .select('id, name, email, is_active, api_key, plan')
      .eq('is_active', true)
      .like('api_key', '$2%')

    if (allMerchants) {
      for (const m of allMerchants) {
        const isValid = await verifyApiKey(apiKey, m.api_key)
        if (isValid) {
          merchant = m
          break
        }
      }
    }
  }

  if (!merchant) {
    logger.warn({ event: 'AUTH_FAILED', reason: 'invalid_api_key', path: req.nextUrl.pathname })
    return null
  }

  const result: AuthenticatedMerchant = {
    id: merchant.id,
    name: merchant.name,
    email: merchant.email,
    is_active: merchant.is_active,
    plan: merchant.plan || null,
  }

  setCachedMerchant(cacheKey, result)

  logger.info({ event: 'AUTH_SUCCESS', merchantId: merchant.id, path: req.nextUrl.pathname })

  return result
}

/**
 * Generate a secure API key
 * Format: vant_<32 random hex characters>
 */
export function generateApiKey(): string {
  return `vant_${crypto.randomBytes(16).toString('hex')}`
}

/**
 * Authenticate request and return merchant ID
 * Throws error if authentication fails
 */
export async function requireAuth(req: NextRequest): Promise<string> {
  const merchant = await authenticateRequest(req)
  if (!merchant) {
    throw new Error('Unauthorized: Invalid or missing API key')
  }
  return merchant.id
}
