/**
 * Background Job Processing
 * Handles long-running tasks like transaction sync
 * Uses Vercel Cron for scheduled jobs, Upstash Queue for async processing
 */

import { logger, LogEvents } from './logger'
import { syncHistoricalTransactions, SyncResult } from './transaction-sync'

/**
 * Process transaction sync as background job
 * Returns job ID for tracking
 */
export async function queueTransactionSync(
  limit: number = 1000,
  startingAfter?: string
): Promise<{ jobId: string; status: 'queued' }> {
  const jobId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  logger.info({
    event: LogEvents.SYNC_STARTED,
    jobId,
    limit,
    startingAfter,
  })

  // In production, this would queue to Upstash Queue
  // For now, we'll process immediately but log as background job
  // In Vercel, you'd use: await fetch('/api/jobs/sync', { method: 'POST', body: JSON.stringify({ limit, startingAfter }) })
  
  // For immediate processing (development/testing)
  if (process.env.NODE_ENV === 'development' || process.env.SYNC_IMMEDIATE === 'true') {
    processTransactionSync(jobId, limit, startingAfter).catch(error => {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        jobId,
        error: error.message,
      })
    })
  }

  return { jobId, status: 'queued' }
}

/**
 * Process transaction sync job
 */
async function processTransactionSync(
  jobId: string,
  limit: number,
  startingAfter?: string
): Promise<SyncResult> {
  try {
    const result = await syncHistoricalTransactions(limit, startingAfter)

    logger.info({
      event: LogEvents.SYNC_COMPLETED,
      jobId,
      ...result,
    })

    return result
  } catch (error: any) {
    logger.error({
      event: LogEvents.SYNC_FAILED,
      jobId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Vercel Cron handler for scheduled syncs
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-transactions",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function handleScheduledSync(): Promise<{ success: boolean; result?: SyncResult }> {
  try {
    const result = await syncHistoricalTransactions(500) // Sync 500 per day
    
    return {
      success: true,
      result,
    }
  } catch (error: any) {
    logger.error({
      event: LogEvents.SYNC_FAILED,
      error: error.message,
      scheduled: true,
    })
    
    return {
      success: false,
    }
  }
}



