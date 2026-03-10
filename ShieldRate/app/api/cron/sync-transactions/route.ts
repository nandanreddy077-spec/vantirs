import { NextResponse } from 'next/server'
import { handleScheduledSync } from '@/lib/background-jobs'

/**
 * Vercel Cron endpoint for scheduled transaction sync
 * Runs daily at 2 AM UTC
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-transactions",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(req: Request) {
  // Verify cron secret (Vercel sets this header)
  const authHeader = req.headers.get('authorization')
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const result = await handleScheduledSync()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        synced: result.result?.synced || 0,
        skipped: result.result?.skipped || 0,
        errors: result.result?.errors || 0,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Sync failed' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}












