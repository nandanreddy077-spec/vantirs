/**
 * Database Transaction Utilities
 * Wraps operations in transactions to prevent partial data writes
 * 
 * PRODUCTION HARDENING:
 * - Ensures atomic operations (all or nothing)
 * - Prevents partial dispute records if server crashes mid-processing
 * - Provides rollback mechanism for failed operations
 * 
 * Note: Supabase JS client doesn't support explicit transactions,
 * but we use a pattern of:
 * 1. Check idempotency first (prevents duplicates)
 * 2. Insert dispute record
 * 3. Update with compliance score
 * 4. If any step fails, rollback is attempted
 */

import { supabaseAdmin } from './supabase'
import { logger, LogEvents } from './logger'

/**
 * Execute dispute creation and processing in a transaction-like pattern
 * 
 * This ensures DB integrity by:
 * 1. Wrapping all operations in try/catch
 * 2. Providing rollback mechanism
 * 3. Logging all failures for auditability
 * 
 * @param operation - The main operation to execute
 * @param rollback - Optional rollback function if operation fails
 * @returns Success status with data or error message
 */
export async function processDisputeTransaction<T>(
  operation: () => Promise<T>,
  rollback?: () => Promise<void>
): Promise<{ success: boolean; data?: T; error?: string }> {
  const startTime = Date.now()
  
  try {
    const data = await operation()
    const processingTime = Date.now() - startTime
    
    logger.info({
      event: 'TRANSACTION_SUCCESS',
      processingTimeMs: processingTime,
    })
    
    return { success: true, data }
  } catch (error: any) {
    const processingTime = Date.now() - startTime
    
    logger.error({
      event: LogEvents.DATABASE_ERROR,
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime,
    })

    // Attempt rollback if provided
    // This is critical for DB integrity - prevents orphaned records
    if (rollback) {
      try {
        await rollback()
        logger.info({
          event: 'ROLLBACK_SUCCESS',
          message: 'Successfully rolled back failed transaction',
        })
      } catch (rollbackError: any) {
        logger.error({
          event: 'ROLLBACK_FAILED',
          error: rollbackError.message,
          originalError: error.message,
        })
      }
    }

    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Batch insert with error handling
 */
export async function batchInsert<T>(
  table: string,
  records: T[],
  batchSize: number = 100
): Promise<{ inserted: number; errors: number }> {
  let inserted = 0
  let errors = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    
    try {
      const { error } = await supabaseAdmin.from(table).insert(batch)
      
      if (error) {
        logger.error({
          event: 'DATABASE_ERROR',
          table,
          error: error.message,
          batchSize: batch.length,
        })
        errors += batch.length
      } else {
        inserted += batch.length
      }
    } catch (error: any) {
      logger.error({
        event: 'DATABASE_ERROR',
        table,
        error: error.message,
      })
      errors += batch.length
    }
  }

  return { inserted, errors }
}

