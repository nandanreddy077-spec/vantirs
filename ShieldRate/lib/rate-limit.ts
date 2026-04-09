/**
 * Rate Limiting for Vantirs APIs
 * Uses Upstash Redis for distributed rate limiting.
 * Supports both IP-based and API-key-based limiting.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Only initialize if valid Redis config is provided
const hasValidRedisConfig =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('your-redis') &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('placeholder')

const redis = hasValidRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Rate limiter for event tracking (100 requests per minute per IP)
export const trackRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'vantirs:track',
    })
  : null

// Rate limiter for transaction sync (10 requests per hour per IP)
export const syncRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: 'vantirs:sync',
    })
  : null

// Rate limiter for webhooks (500 per minute — tighter than before)
export const webhookRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(500, '1 m'),
      analytics: true,
      prefix: 'vantirs:webhook',
    })
  : null

// Rate limiter for free audit (3 audits per hour per IP)
export const auditRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: 'vantirs:audit',
    })
  : null

// Per-API-key rate limiter (200 requests per minute per merchant API key)
export const apiKeyRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '1 m'),
      analytics: true,
      prefix: 'vantirs:apikey',
    })
  : null

/**
 * Check rate limit by API key (for authenticated endpoints)
 * Returns { success, remaining, reset } or null if rate limiting is disabled
 */
export async function checkApiKeyRateLimit(
  apiKeyIdentifier: string
): Promise<{ success: boolean; remaining: number; reset: number } | null> {
  if (!apiKeyRateLimit) return null
  const result = await apiKeyRateLimit.limit(apiKeyIdentifier)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/**
 * Get client IP from request
 */
export function getClientIP(req: Request | { headers: Headers }): string {
  const headers = 'headers' in req ? req.headers : new Headers()

  const forwarded = headers.get('x-forwarded-for')
  const realIP = headers.get('x-real-ip')
  const cfConnectingIP = headers.get('cf-connecting-ip')

  if (cfConnectingIP) return cfConnectingIP
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIP) return realIP

  return 'unknown'
}
