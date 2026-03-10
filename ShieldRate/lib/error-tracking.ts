/**
 * Error Tracking Integration
 * Uses Sentry SDK for production error monitoring and alerting.
 * Falls back to structured logging when Sentry DSN is not configured.
 */

let Sentry: any = null
let initialized = false

async function loadSentry() {
  try {
    Sentry = await import('@sentry/nextjs')
    return true
  } catch {
    return false
  }
}

export async function initErrorTracking() {
  if (initialized) return

  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[ERROR_TRACKING] SENTRY_DSN not set. Error tracking will use structured logging only.')
    }
    return
  }

  const loaded = await loadSentry()
  if (!loaded) {
    console.warn('[ERROR_TRACKING] @sentry/nextjs not installed. Run: npm install @sentry/nextjs')
    return
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event: any) {
        if (event.request?.headers) {
          delete event.request.headers['authorization']
          delete event.request.headers['x-api-key']
          delete event.request.headers['cookie']
        }
        return event
      },
    })
    initialized = true
    console.log('[ERROR_TRACKING] Sentry initialized successfully')
  } catch (error) {
    console.error('[ERROR_TRACKING] Failed to initialize Sentry:', error)
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
  console.error('[EXCEPTION]', error.message, context?.tags || {})

  if (initialized && Sentry) {
    Sentry.withScope((scope: any) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]: [string, string]) => scope.setTag(key, value))
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]: [string, any]) => scope.setExtra(key, value))
      }
      if (context?.user) {
        scope.setUser(context.user)
      }
      Sentry.captureException(error)
    })
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
  const logPrefix = `[${level.toUpperCase()}]`
  if (level === 'error') {
    console.error(logPrefix, message, context?.extra || {})
  } else if (level === 'warning') {
    console.warn(logPrefix, message, context?.extra || {})
  } else {
    console.log(logPrefix, message, context?.extra || {})
  }

  if (initialized && Sentry) {
    Sentry.withScope((scope: any) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]: [string, string]) => scope.setTag(key, value))
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]: [string, any]) => scope.setExtra(key, value))
      }
      Sentry.captureMessage(message, level)
    })
  }
}

/**
 * Flush pending Sentry events (call before serverless function exits)
 */
export async function flushErrorTracking(timeoutMs = 2000): Promise<void> {
  if (initialized && Sentry) {
    await Sentry.flush(timeoutMs)
  }
}
