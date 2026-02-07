/**
 * Metrics and Monitoring
 * 
 * Provides application-level metrics for monitoring and observability
 * Tracks performance, errors, and business metrics
 */

import { logger } from './logger'
import { supabaseAdmin } from './supabase'

/**
 * Metric types
 */
export enum MetricType {
  API_REQUEST = 'api_request',
  API_ERROR = 'api_error',
  CE3_MATCH = 'ce3_match',
  PDF_GENERATION = 'pdf_generation',
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
  DATABASE_QUERY = 'database_query',
  STRIPE_API_CALL = 'stripe_api_call',
}

/**
 * Record a metric
 */
export async function recordMetric(
  type: MetricType,
  value: number,
  tags: Record<string, string | number> = {}
): Promise<void> {
  try {
    // Log metric (for structured logging)
    logger.info({
      event: 'METRIC',
      type,
      value,
      tags,
      timestamp: new Date().toISOString(),
    })

    // In production, you might want to send to:
    // - Datadog
    // - New Relic
    // - CloudWatch
    // - Prometheus
    // For now, we'll just log it
  } catch (error: any) {
    // Don't let metrics break the application
    logger.warn({
      event: 'METRIC_RECORD_FAILED',
      type,
      error: error.message,
    })
  }
}

/**
 * Track API request duration
 */
export async function trackApiRequest(
  endpoint: string,
  method: string,
  durationMs: number,
  statusCode: number
): Promise<void> {
  await recordMetric(MetricType.API_REQUEST, durationMs, {
    endpoint,
    method,
    statusCode,
  })
}

/**
 * Track API error
 */
export async function trackApiError(
  endpoint: string,
  method: string,
  error: string,
  statusCode: number
): Promise<void> {
  await recordMetric(MetricType.API_ERROR, 1, {
    endpoint,
    method,
    error,
    statusCode,
  })
}

/**
 * Track CE3 match result
 */
export async function trackCE3Match(
  matched: boolean,
  matchCount: number,
  network: string,
  durationMs: number
): Promise<void> {
  await recordMetric(MetricType.CE3_MATCH, matchCount, {
    matched: matched ? 'true' : 'false',
    network,
    durationMs,
  })
}

/**
 * Track cache performance
 */
export async function trackCacheHit(key: string): Promise<void> {
  await recordMetric(MetricType.CACHE_HIT, 1, { key })
}

export async function trackCacheMiss(key: string): Promise<void> {
  await recordMetric(MetricType.CACHE_MISS, 1, { key })
}

/**
 * Track PDF generation
 */
export async function trackPdfGeneration(
  disputeId: string,
  durationMs: number,
  sizeBytes: number
): Promise<void> {
  await recordMetric(MetricType.PDF_GENERATION, durationMs, {
    disputeId,
    sizeBytes,
  })
}

/**
 * Track database query
 */
export async function trackDatabaseQuery(
  table: string,
  operation: string,
  durationMs: number
): Promise<void> {
  await recordMetric(MetricType.DATABASE_QUERY, durationMs, {
    table,
    operation,
  })
}

/**
 * Track Stripe API call
 */
export async function trackStripeApiCall(
  endpoint: string,
  durationMs: number,
  success: boolean
): Promise<void> {
  await recordMetric(MetricType.STRIPE_API_CALL, durationMs, {
    endpoint,
    success: success ? 'true' : 'false',
  })
}

/**
 * Get system health metrics
 */
export async function getSystemMetrics(): Promise<{
  timestamp: string
  database: { connected: boolean; latency?: number }
  redis: { connected: boolean; latency?: number }
  stripe: { connected: boolean; latency?: number }
}> {
  const timestamp = new Date().toISOString()
  
  // Check database
  const dbStart = Date.now()
  let dbConnected = false
  let dbLatency: number | undefined
  try {
    await supabaseAdmin.from('disputes').select('id').limit(1)
    dbConnected = true
    dbLatency = Date.now() - dbStart
  } catch {
    dbLatency = Date.now() - dbStart
  }

  // Check Redis (if configured)
  const redisStart = Date.now()
  let redisConnected = false
  let redisLatency: number | undefined
  try {
    const { Redis } = await import('@upstash/redis')
    const hasValidRedisConfig = 
      process.env.UPSTASH_REDIS_REST_URL && 
      process.env.UPSTASH_REDIS_REST_TOKEN
    
    if (hasValidRedisConfig) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
      await redis.ping()
      redisConnected = true
      redisLatency = Date.now() - redisStart
    }
  } catch {
    redisLatency = Date.now() - redisStart
  }

  // Check Stripe
  const stripeStart = Date.now()
  let stripeConnected = false
  let stripeLatency: number | undefined
  try {
    const { stripe } = await import('./stripe')
    await stripe.charges.list({ limit: 1 })
    stripeConnected = true
    stripeLatency = Date.now() - stripeStart
  } catch {
    stripeLatency = Date.now() - stripeStart
  }

  return {
    timestamp,
    database: { connected: dbConnected, latency: dbLatency },
    redis: { connected: redisConnected, latency: redisLatency },
    stripe: { connected: stripeConnected, latency: stripeLatency },
  }
}

