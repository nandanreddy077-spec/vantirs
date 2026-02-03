/**
 * Rate Limiting for ShieldRate APIs
 * Uses Upstash Redis for distributed rate limiting
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client (falls back to in-memory if not configured)
// Only initialize if valid URLs are provided (not placeholders)
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
      prefix: 'shieldrate:track',
    })
  : null

// Rate limiter for transaction sync (10 requests per hour per IP)
export const syncRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: 'shieldrate:sync',
    })
  : null

// Rate limiter for webhook (unlimited, but tracked)
export const webhookRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 m'),
      analytics: true,
      prefix: 'shieldrate:webhook',
    })
  : null

/**
 * Get client IP from request
 */
export function getClientIP(req: Request | { headers: Headers }): string {
  const headers = 'headers' in req ? req.headers : new Headers()
  
  // Check various headers for IP (for different hosting providers)
  const forwarded = headers.get('x-forwarded-for')
  const realIP = headers.get('x-real-ip')
  const cfConnectingIP = headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return 'unknown'
}

