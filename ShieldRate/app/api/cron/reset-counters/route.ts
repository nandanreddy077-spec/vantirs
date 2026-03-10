import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

/**
 * Vercel Cron endpoint: reset monthly dispute counters for paid plans
 * Runs on the 1st of each month at 00:00 UTC
 *
 * Calls reset_monthly_dispute_counters() in Supabase to set
 * disputes_used_this_month = 0 and update billing_cycle_start for active subscriptions.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { error } = await supabaseAdmin.rpc('reset_monthly_dispute_counters')

    if (error) {
      logger.error({
        event: 'CRON_RESET_COUNTERS_FAILED',
        error: error.message,
        code: error.code,
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    logger.info({ event: 'CRON_RESET_COUNTERS_OK' })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ event: 'CRON_RESET_COUNTERS_ERROR', error: message })
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
