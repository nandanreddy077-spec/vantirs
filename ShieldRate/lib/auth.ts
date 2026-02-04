/**
 * Authentication Middleware
 * 
 * Provides API key authentication for merchant-scoped endpoints
 * 
 * Usage:
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const merchant = await authenticateRequest(req)
 *   if (!merchant) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *   // Use merchant.id for scoped queries
 * }
 * ```
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'
import { logger, LogEvents } from './logger'

/**
 * Authenticate request using API key
 * 
 * Supports:
 * - Header: `Authorization: Bearer <api_key>`
 * - Header: `X-API-Key: <api_key>`
 * - Query param: `?api_key=<api_key>`
 * 
 * @param req - Next.js request object
 * @returns Merchant object if authenticated, null otherwise
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<{ id: string; name: string; email: string; is_active: boolean } | null> {
  // Extract API key from various sources
  const authHeader = req.headers.get('authorization')
  const apiKeyHeader = req.headers.get('x-api-key')
  const apiKeyQuery = req.nextUrl.searchParams.get('api_key')

  let apiKey: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7)
  } else if (apiKeyHeader) {
    apiKey = apiKeyHeader
  } else if (apiKeyQuery) {
    apiKey = apiKeyQuery
  }

  if (!apiKey) {
    logger.warn({
      event: 'AUTH_FAILED',
      reason: 'no_api_key',
      path: req.nextUrl.pathname,
    })
    return null
  }

  // Look up merchant by API key
  const { data: merchant, error } = await supabaseAdmin
    .from('merchants')
    .select('id, name, email, is_active, api_key')
    .eq('api_key', apiKey)
    .single()

  if (error || !merchant) {
    logger.warn({
      event: 'AUTH_FAILED',
      reason: 'invalid_api_key',
      path: req.nextUrl.pathname,
    })
    return null
  }

  if (!merchant.is_active) {
    logger.warn({
      event: 'AUTH_FAILED',
      reason: 'merchant_inactive',
      merchantId: merchant.id,
      path: req.nextUrl.pathname,
    })
    return null
  }

  logger.info({
    event: 'AUTH_SUCCESS',
    merchantId: merchant.id,
    path: req.nextUrl.pathname,
  })

  return {
    id: merchant.id,
    name: merchant.name,
    email: merchant.email,
    is_active: merchant.is_active,
  }
}

/**
 * Generate a secure API key
 * Format: vant_<32 random hex characters>
 */
export function generateApiKey(): string {
  const randomBytes = require('crypto').randomBytes(16)
  return `vant_${randomBytes.toString('hex')}`
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

