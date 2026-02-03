import { NextRequest, NextResponse } from 'next/server'
import { syncLast12Months } from '@/lib/transaction-sync'
import { logger, LogEvents } from '@/lib/logger'
import { syncRateLimit, getClientIP } from '@/lib/rate-limit'

/**
 * Onboarding endpoint: Sync last 12 months of transactions
 * 
 * CRITICAL: Call this immediately after a new merchant signs up.
 * Without this backfill, Vantirs is "blind" for the first 4 months
 * because CE 3.0 matching requires historical transactions (120-365 days old).
 * 
 * Usage:
 *   POST /api/onboarding/sync-transactions
 */
export async function POST(req: NextRequest) {
  const clientIP = getClientIP(req)
  
  // Rate limiting
  if (syncRateLimit) {
    const { success } = await syncRateLimit.limit(`sync:${clientIP}`)
    if (!success) {
      logger.warn({
        event: LogEvents.RATE_LIMIT_EXCEEDED,
        ip: clientIP,
        endpoint: '/api/onboarding/sync-transactions',
      })
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
  }

  try {
    logger.info({
      event: LogEvents.SYNC_STARTED,
      type: 'onboarding_backfill',
      ip: clientIP,
    })

    const result = await syncLast12Months()

    logger.info({
      event: LogEvents.SYNC_COMPLETED,
      type: 'onboarding_backfill',
      total: result.total,
      synced: result.synced,
      skipped: result.skipped,
      errors: result.errors,
    })

    return NextResponse.json({
      success: true,
      message: `Synced ${result.synced} transactions from last 12 months. Vantirs is now ready for CE 3.0 matching.`,
      result: {
        total: result.total,
        synced: result.synced,
        skipped: result.skipped,
        errors: result.errors,
      },
    })
  } catch (error: any) {
    logger.error({
      event: LogEvents.SYNC_FAILED,
      type: 'onboarding_backfill',
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        message: 'Failed to sync transactions. Please try again or contact support.',
      },
      { status: 500 }
    )
  }
}

