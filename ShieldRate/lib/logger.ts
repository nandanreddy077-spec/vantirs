/**
 * Structured Logging for Vantirs
 * Uses Pino for production-grade logging
 */

import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'

// Disable pino-pretty worker thread in development to avoid crashes
// Use basic pino with minimal config for development
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  // Disable transport in development to avoid worker thread issues
  // Logs will be in JSON format but readable
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

