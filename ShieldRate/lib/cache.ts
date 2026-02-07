/**
 * Redis Caching Layer for Vantirs
 * 
 * Provides high-performance caching for:
 * - Dashboard statistics
 * - Dispute lists
 * - CE 3.0 match results
 * 
 * Falls back gracefully if Redis is unavailable
 */

import { Redis } from '@upstash/redis'
import { logger } from './logger'

// Initialize Redis client (same as rate-limit.ts)
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

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl?: number // Time to live in seconds
  keyPrefix?: string
}

const DEFAULT_TTL = 300 // 5 minutes

/**
 * Get cached value
 */
export async function getCache<T>(
  key: string,
  config: CacheConfig = {}
): Promise<T | null> {
  if (!redis) {
    return null // Cache unavailable, return null
  }

  try {
    const fullKey = config.keyPrefix 
      ? `${config.keyPrefix}:${key}`
      : `vantirs:cache:${key}`
    
    const value = await redis.get<T>(fullKey)
    return value
  } catch (error: any) {
    logger.warn({
      event: 'CACHE_GET_FAILED',
      key,
      error: error.message,
      action: 'returning_null',
    })
    return null
  }
}

/**
 * Set cached value
 */
export async function setCache<T>(
  key: string,
  value: T,
  config: CacheConfig = {}
): Promise<boolean> {
  if (!redis) {
    return false // Cache unavailable
  }

  try {
    const fullKey = config.keyPrefix 
      ? `${config.keyPrefix}:${key}`
      : `vantirs:cache:${key}`
    
    const ttl = config.ttl || DEFAULT_TTL
    await redis.setex(fullKey, ttl, value)
    return true
  } catch (error: any) {
    logger.warn({
      event: 'CACHE_SET_FAILED',
      key,
      error: error.message,
      action: 'continuing_without_cache',
    })
    return false
  }
}

/**
 * Delete cached value
 */
export async function deleteCache(
  key: string,
  config: CacheConfig = {}
): Promise<boolean> {
  if (!redis) {
    return false
  }

  try {
    const fullKey = config.keyPrefix 
      ? `${config.keyPrefix}:${key}`
      : `vantirs:cache:${key}`
    
    await redis.del(fullKey)
    return true
  } catch (error: any) {
    logger.warn({
      event: 'CACHE_DELETE_FAILED',
      key,
      error: error.message,
    })
    return false
  }
}

/**
 * Invalidate cache by pattern (for cache invalidation)
 */
export async function invalidateCachePattern(
  pattern: string
): Promise<number> {
  if (!redis) {
    return 0
  }

  try {
    // Note: Upstash Redis doesn't support KEYS command in production
    // This is a placeholder for future implementation with SCAN
    logger.info({
      event: 'CACHE_INVALIDATE_PATTERN',
      pattern,
      note: 'Pattern invalidation requires SCAN implementation',
    })
    return 0
  } catch (error: any) {
    logger.warn({
      event: 'CACHE_INVALIDATE_FAILED',
      pattern,
      error: error.message,
    })
    return 0
  }
}

/**
 * Cache keys for different data types
 */
export const CacheKeys = {
  dashboardStats: (merchantId: string) => `dashboard:stats:${merchantId}`,
  disputes: (merchantId: string, filters?: string) => 
    `disputes:${merchantId}${filters ? `:${filters}` : ''}`,
  ce3Match: (customerId: string, merchantId?: string) => 
    `ce3:match:${merchantId || 'global'}:${customerId}`,
  transactionCount: (merchantId: string) => `transactions:count:${merchantId}`,
} as const

/**
 * Cache TTLs for different data types
 */
export const CacheTTL = {
  dashboardStats: 300, // 5 minutes
  disputes: 60, // 1 minute
  ce3Match: 600, // 10 minutes
  transactionCount: 300, // 5 minutes
} as const

