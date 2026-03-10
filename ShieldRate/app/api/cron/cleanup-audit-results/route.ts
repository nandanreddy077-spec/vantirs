import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

/**
 * Vercel Cron endpoint: delete expired audit results
 * Runs daily at 03:00 UTC
 *
 * Calls cleanup_expired_audit_results() in Supabase to remove
 * audit_results rows past their expiration (plus grace period).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { error } = await supabaseAdmin.rpc('cleanup_expired_audit_results')

    if (error) {
      logger.error({
        event: 'CRON_CLEANUP_AUDIT_RESULTS_FAILED',
        error: error.message,
        code: error.code,
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    logger.info({ event: 'CRON_CLEANUP_AUDIT_RESULTS_OK' })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ event: 'CRON_CLEANUP_AUDIT_RESULTS_ERROR', error: message })
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
