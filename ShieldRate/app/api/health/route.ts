import { NextResponse } from 'next/server'
import { validateEnv } from '@/lib/env'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Health Check API
 * Verifies all systems are operational
 */
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      environment: false,
      database: false,
      stripe: false,
    },
  }

  try {
    // Check environment variables
    try {
      validateEnv()
      health.checks.environment = true
    } catch (error: any) {
      health.status = 'degraded'
      health.checks.environment = false
    }

    // Check database connection
    try {
      const { error } = await supabaseAdmin
        .from('disputes')
        .select('id')
        .limit(1)

      if (!error) {
        health.checks.database = true
      } else {
        health.status = 'degraded'
        health.checks.database = false
      }
    } catch (error) {
      health.status = 'degraded'
      health.checks.database = false
    }

    // Check Stripe connection (using charges:read which restricted key has)
    try {
      const { stripe } = await import('@/lib/stripe')
      // Use charges.list() instead of balance.retrieve() since restricted key doesn't have balance:read
      await stripe.charges.list({ limit: 1 })
      health.checks.stripe = true
    } catch (error) {
      health.status = 'degraded'
      health.checks.stripe = false
    }

    const statusCode = health.status === 'ok' ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

