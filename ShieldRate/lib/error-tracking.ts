/**
 * Error Tracking Integration
 * Structured logging for production error monitoring.
 * To add Sentry: npm install @sentry/nextjs, then uncomment Sentry calls below.
 */

/**
 * Initialize error tracking (no-op until Sentry is installed)
 */
export async function initErrorTracking() {
  // To enable Sentry:
  // 1. npm install @sentry/nextjs
  // 2. Set SENTRY_DSN env var
  // 3. Uncomment Sentry.init in this function
}

/**
 * Capture exception for error tracking
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, any>
    user?: { id: string; email?: string }
  }
) {
  console.error('[EXCEPTION]', error.message, context?.tags || {})
}

/**
 * Capture message for error tracking
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, any>
  }
) {
  const logPrefix = `[${level.toUpperCase()}]`
  if (level === 'error') {
    console.error(logPrefix, message, context?.extra || {})
  } else if (level === 'warning') {
    console.warn(logPrefix, message, context?.extra || {})
  } else {
    console.log(logPrefix, message, context?.extra || {})
  }
}

/**
 * Flush pending events (no-op until Sentry is installed)
 */
export async function flushErrorTracking(_timeoutMs = 2000): Promise<void> {
  // No-op
}
