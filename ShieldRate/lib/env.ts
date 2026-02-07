/**
 * Environment variable validation
 * Throws error if required variables are missing
 */
export function validateEnv(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL',
  ]

  const missing: string[] = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file or Vercel environment variables.'
    )
  }

  // Warn about optional but recommended variables
  const recommended = ['ENCRYPTION_KEY']
  const missingRecommended: string[] = []

  for (const key of recommended) {
    if (!process.env[key]) {
      missingRecommended.push(key)
    }
  }

  if (missingRecommended.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn(
      `⚠️  Recommended environment variables not set: ${missingRecommended.join(', ')}\n` +
      'These are optional but recommended for production security.'
    )
  }
}



