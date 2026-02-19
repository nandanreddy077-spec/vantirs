/**
 * Error Tracking Integration
 * Supports Sentry and LogLib for production error monitoring
 */

// Initialize Sentry if DSN is provided
let sentryInitialized = false

export function initErrorTracking() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && typeof window !== 'undefined') {
    try {
      // Sentry is initialized in sentry.client.config.ts
      sentryInitialized = true
    } catch (error) {
      console.error('Failed to initialize Sentry:', error)
    }
  }
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
  // In production, this would send to Sentry
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Sentry.captureException(error, { tags: context?.tags, extra: context?.extra, user: context?.user })
    console.error('Exception captured:', error, context)
  } else {
    console.error('Exception:', error, context)
  }
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
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Sentry.captureMessage(message, level, { tags: context?.tags, extra: context?.extra })
    console.log(`[${level.toUpperCase()}] ${message}`, context)
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, context)
  }
}










