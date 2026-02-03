import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Dashboard Stats API
 * Returns aggregated statistics for the dashboard
 */
export async function GET() {
  try {
    // Get total disputes (all statuses for display)
    const { count: disputeCount } = await supabaseAdmin
      .from('disputes')
      .select('*', { count: 'exact', head: true })

    // Get disputes that COUNT for VAMP calculation
    // VAMP excludes: won disputes (especially CE 3.0 wins), lost disputes, warning_closed
    // Only includes: open, warning_needs_response, warning_under_review
    const { count: vampDisputeCount } = await supabaseAdmin
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'warning_needs_response', 'warning_under_review'])

    // Get total transactions
    // Note: This uses synced transactions. For production accuracy,
    // consider fetching total from Stripe API for all-time transactions
    const { count: transactionCount } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true })

    // Calculate VAMP ratio
    // VAMP = (Disputes that count / Total Transactions) * 100
    // CE 3.0 won disputes are automatically excluded (status = 'won')
    const totalDisputes = disputeCount || 0
    const vampDisputes = vampDisputeCount || 0
    const totalTransactions = transactionCount || 0
    const vampRatio = totalTransactions > 0 ? vampDisputes / totalTransactions : 0

    // Get recoverable amount (auto-win eligible disputes)
    const { data: eligibleDisputes } = await supabaseAdmin
      .from('disputes')
      .select('amount')
      .eq('auto_win_eligible', true)
      .eq('status', 'open')

    const recoverableAmount = eligibleDisputes?.reduce((sum: number, dispute: { amount: number }) => sum + dispute.amount, 0) || 0

    // Get count of auto-win eligible disputes
    const { count: autoWinCount } = await supabaseAdmin
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .eq('auto_win_eligible', true)
      .eq('status', 'open')

    return NextResponse.json({
      totalDisputes,
      vampDisputes, // Disputes that count for VAMP
      totalTransactions,
      vampRatio,
      recoverableAmount,
      autoWinEligible: autoWinCount || 0,
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}

