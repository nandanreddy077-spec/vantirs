import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/auth'
import { getCache, setCache, CacheKeys, CacheTTL } from '@/lib/cache'
import { addSecurityHeaders, addCorsHeaders, validateRequestBodySize } from '@/lib/security-headers'

// Force dynamic rendering (uses request headers for auth)
export const dynamic = 'force-dynamic'

/**
 * Dashboard Stats API
 * Returns aggregated statistics for the authenticated merchant's dashboard
 * 
 * Requires: API key authentication
 */
export async function GET(req: NextRequest) {
  try {
    // SECURITY: Validate request body size (for POST requests)
    const sizeCheck = validateRequestBodySize(req, 1024 * 1024) // 1MB
    if (!sizeCheck.valid) {
      const response = NextResponse.json(
        { error: sizeCheck.error },
        { status: 413 }
      )
      return addSecurityHeaders(addCorsHeaders(response, req))
    }

    // Authenticate request
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      const response = NextResponse.json(
        { error: 'Unauthorized. Please provide a valid API key.' },
        { status: 401 }
      )
      return addSecurityHeaders(addCorsHeaders(response, req))
    }

    // SCALABILITY: Check cache first
    const cacheKey = CacheKeys.dashboardStats(merchant.id)
    const cached = await getCache<any>(cacheKey, { ttl: CacheTTL.dashboardStats })
    
    if (cached) {
      const response = NextResponse.json(cached)
      return addSecurityHeaders(addCorsHeaders(response, req))
    }

    // Get total disputes (all statuses for display) - scoped to merchant
    const { count: disputeCount } = await supabaseAdmin
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)

    // Get disputes that COUNT for VAMP calculation
    // VAMP excludes: won disputes (especially CE 3.0 wins), lost disputes, warning_closed
    // Only includes: open, warning_needs_response, warning_under_review
    const { count: vampDisputeCount } = await supabaseAdmin
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
      .in('status', ['open', 'warning_needs_response', 'warning_under_review'])

    // Get total transactions - scoped to merchant
    // Note: This uses synced transactions. For production accuracy,
    // consider fetching total from Stripe API for all-time transactions
    const { count: transactionCount } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)

    // Calculate VAMP ratio
    // VAMP = (Disputes that count / Total Transactions) * 100
    // CE 3.0 won disputes are automatically excluded (status = 'won')
    const totalDisputes = disputeCount || 0
    const vampDisputes = vampDisputeCount || 0
    const totalTransactions = transactionCount || 0
    const vampRatio = totalTransactions > 0 ? vampDisputes / totalTransactions : 0

    // Get recoverable amount (auto-win eligible disputes) - scoped to merchant
    const { data: eligibleDisputes } = await supabaseAdmin
      .from('disputes')
      .select('amount')
      .eq('merchant_id', merchant.id)
      .eq('auto_win_eligible', true)
      .eq('status', 'open')

    const recoverableAmount = eligibleDisputes?.reduce((sum: number, dispute: { amount: number }) => sum + dispute.amount, 0) || 0

    // Get count of auto-win eligible disputes - scoped to merchant
    const { count: autoWinCount } = await supabaseAdmin
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
      .eq('auto_win_eligible', true)
      .eq('status', 'open')

    const stats = {
      totalDisputes,
      vampDisputes, // Disputes that count for VAMP
      totalTransactions,
      vampRatio,
      recoverableAmount,
      autoWinEligible: autoWinCount || 0,
    }

    // SCALABILITY: Cache the result
    await setCache(cacheKey, stats, { ttl: CacheTTL.dashboardStats })

    const response = NextResponse.json(stats)
    return addSecurityHeaders(addCorsHeaders(response, req))
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
    return addSecurityHeaders(addCorsHeaders(response, req))
  }
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const { handleCorsPreflight } = await import('@/lib/security-headers')
  return handleCorsPreflight(req) || new NextResponse(null, { status: 204 })
}

