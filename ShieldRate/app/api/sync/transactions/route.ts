import { NextRequest, NextResponse } from 'next/server'
import { syncHistoricalTransactions, syncCustomerTransactions } from '@/lib/transaction-sync'
import { queueTransactionSync } from '@/lib/background-jobs'
import { syncRateLimit, getClientIP } from '@/lib/rate-limit'
import { logger, LogEvents } from '@/lib/logger'

// Force dynamic rendering (uses request headers for IP detection)
export const dynamic = 'force-dynamic'

/**
 * Transaction Sync API
 * Syncs historical Stripe charges to database
 * Hardened with rate limiting and background job pattern
 * 
 * Query params:
 * - limit: number of transactions to sync (default: 100, max: 1000)
 * - customer_id: sync transactions for specific customer only
 * 
 * Note: For large syncs (>1000), use the background script instead
 */
export async function POST(req: NextRequest) {
  const clientIP = getClientIP(req)

  // Rate limiting (10 requests per hour)
  if (syncRateLimit) {
    const { success, limit, remaining } = await syncRateLimit.limit(`sync:${clientIP}`)
    
    if (!success) {
      logger.warn({
        event: LogEvents.RATE_LIMIT_EXCEEDED,
        endpoint: '/api/sync/transactions',
        ip: clientIP,
      })
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 syncs per hour.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'Retry-After': '3600',
          },
        }
      )
    }
  }

  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000) // Cap at 1000
    const customerId = searchParams.get('customer_id')

    logger.info({
      event: LogEvents.SYNC_STARTED,
      limit,
      customerId: customerId || 'all',
      ip: clientIP,
    })

    let result

    if (customerId) {
      result = await syncCustomerTransactions(customerId)
    } else {
      result = await syncHistoricalTransactions(limit)
    }

    logger.info({
      event: LogEvents.SYNC_COMPLETED,
      ...result,
      customerId: customerId || 'all',
    })

    return NextResponse.json({
      success: true,
      ...result,
      message: customerId
        ? `Synced ${result.synced} transactions for customer ${customerId}`
        : `Synced ${result.synced} transactions`,
    })
  } catch (error: any) {
    logger.error({
      event: LogEvents.SYNC_FAILED,
      error: error.message,
      stack: error.stack,
      ip: clientIP,
    })
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

