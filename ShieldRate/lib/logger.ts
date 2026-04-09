/**
 * Structured Logging for Vantirs
 * Uses Pino for production-grade logging with correlation ID support
 */

import pino from 'pino'
import crypto from 'crypto'

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment && process.env.ENABLE_PINO_PRETTY === 'true'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: 'vantirs',
    environment: process.env.NODE_ENV || 'production',
  },
})

// Event type constants for structured logging
export const LogEvents = {
  DISPUTE_RECEIVED: 'DISPUTE_RECEIVED',
  DISPUTE_PROCESSED: 'DISPUTE_PROCESSED',
  CE3_MATCH_FOUND: 'CE3_MATCH_FOUND',
  CE3_MATCH_NOT_FOUND: 'CE3_MATCH_NOT_FOUND',
  PDF_GENERATED: 'PDF_GENERATED',
  EVIDENCE_SUBMITTED: 'EVIDENCE_SUBMITTED',
  EVIDENCE_SUBMIT_FAILED: 'EVIDENCE_SUBMIT_FAILED',
  SUBMISSION_STATUS: 'SUBMISSION_STATUS',
  SYNC_STARTED: 'SYNC_STARTED',
  SYNC_COMPLETED: 'SYNC_COMPLETED',
  SYNC_FAILED: 'SYNC_FAILED',
  WEBHOOK_VERIFIED: 'WEBHOOK_VERIFIED',
  WEBHOOK_VERIFICATION_FAILED: 'WEBHOOK_VERIFICATION_FAILED',
  IDEMPOTENCY_CHECK: 'IDEMPOTENCY_CHECK',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  VAMP_THRESHOLD_WARNING: 'VAMP_THRESHOLD_WARNING',
  PDF_VALIDATION_FAILED: 'PDF_VALIDATION_FAILED',
  VALIDATION_FAILURE_NOTIFICATION: 'VALIDATION_FAILURE_NOTIFICATION',
} as const

export type LogEvent = typeof LogEvents[keyof typeof LogEvents]

/**
 * Generate a unique correlation ID for request tracing.
 * Format: vnt_<timestamp_hex>_<random_hex>
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(16)
  const random = crypto.randomBytes(4).toString('hex')
  return `vnt_${timestamp}_${random}`
}

/**
 * Create a child logger with a correlation ID bound to it.
 * Use this in API routes to trace all logs for a single request.
 */
export function createRequestLogger(correlationId?: string) {
  const id = correlationId || generateCorrelationId()
  return {
    logger: logger.child({ correlationId: id }),
    correlationId: id,
  }
}
