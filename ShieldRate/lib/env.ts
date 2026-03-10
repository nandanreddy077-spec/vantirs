/**
 * Environment variable validation
 * Validates all required and security-critical variables at startup
 */
export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === 'production'

  // Always required
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL',
  ]

  // Required in production only
  const productionRequired = [
    'ENCRYPTION_KEY',
    'CRON_SECRET',
  ]

  // Recommended in production (warn if missing)
  const productionRecommended = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'SENTRY_DSN',
  ]

  const missing: string[] = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (isProduction) {
    for (const key of productionRequired) {
      if (!process.env[key]) {
        missing.push(key)
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      (isProduction
        ? 'These are required for production. Check your Vercel environment variables.'
        : 'Please check your .env.local file.')
    )
  }

  // Validate ENCRYPTION_KEY format if provided
  if (process.env.ENCRYPTION_KEY) {
    const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
    if (keyBuffer.length < 32) {
      throw new Error(
        `ENCRYPTION_KEY is too short (${keyBuffer.length} bytes, need 32+). ` +
        'Generate with: openssl rand -base64 32'
      )
    }
  }

  // Validate Supabase URL format
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL starting with https://')
  }

  // Warn about recommended variables in production
  if (isProduction) {
    const missingRecommended: string[] = []
    for (const key of productionRecommended) {
      if (!process.env[key]) {
        missingRecommended.push(key)
      }
    }
    if (missingRecommended.length > 0) {
      console.warn(
        `[STARTUP] Recommended env vars not set: ${missingRecommended.join(', ')}. ` +
        'Rate limiting and error tracking may be degraded.'
      )
    }
  }
}
