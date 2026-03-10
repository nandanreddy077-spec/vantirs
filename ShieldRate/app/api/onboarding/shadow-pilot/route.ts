import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { getMerchantStripe } from '@/lib/merchant-stripe'
import { findCE3Matches } from '@/lib/ce3-matcher'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

/**
 * Shadow Pilot API - Revenue Analysis
 * 
 * Analyzes customer's historical Stripe disputes to show recoverable revenue
 * Non-technical users can click a button to run this analysis
 * 
 * Returns:
 * - Total disputes in last 90 days
 * - CE 3.0 eligible disputes
 * - Recoverable amount
 * - VAMP ratio impact
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logger.info({
      event: 'SHADOW_PILOT_STARTED',
      merchantId: merchant.id,
      plan: merchant.plan,
    })

    const stripeClient = await getMerchantStripe(merchant.id)

    // Fetch disputes from last 90 days
    const daysAgo90 = new Date()
    daysAgo90.setDate(daysAgo90.getDate() - 90)
    const timestamp90DaysAgo = Math.floor(daysAgo90.getTime() / 1000)

    const disputes: Stripe.Dispute[] = []
    let hasMore = true
    let startingAfter: string | undefined

    // Paginate through all disputes
    while (hasMore) {
      const response = await stripeClient.disputes.list({
        limit: 100,
        created: { gte: timestamp90DaysAgo },
        ...(startingAfter && { starting_after: startingAfter }),
      })
      disputes.push(...response.data)
      hasMore = response.has_more
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id
      }
    }

    // Filter for fraudulent reason codes (CE 3.0 eligible)
    const fraudulentDisputes = disputes.filter(
      d => d.reason === 'fraudulent' || d.reason === 'general'
    )

    // Get historical transactions for matching
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('merchant_id', merchant.id)
      .eq('status', 'succeeded')
      .eq('disputed', false)

    // Process each dispute
    let ce3Eligible = 0
    let goldenMatches = 0
    let recoverableAmount = 0
    const disputesByReason: Record<string, number> = {}
    const eligibleDisputes: Array<{
      dispute_id: string
      amount: number
      reason_code: string
      matches_found: number
    }> = []

    for (const dispute of fraudulentDisputes) {
      // Count by reason code
      disputesByReason[dispute.reason] = (disputesByReason[dispute.reason] || 0) + 1

      try {
        // Get charge details
        const charge = await stripeClient.charges.retrieve(dispute.charge as string)
        const customerId = charge.customer as string

        if (!customerId) continue

        // Extract IP and device fingerprint
        const ipAddress = charge.metadata?.ip_address || null
        const deviceFingerprint = charge.metadata?.device_fingerprint || null

        // Run CE 3.0 matching (pass reason code for 10.4 eligibility)
        const match = await findCE3Matches(
          customerId,
          ipAddress,
          deviceFingerprint,
          dispute.charge as string,
          merchant.id,
          stripeClient,
          dispute.reason,
        )

        if (match.matched && match.matches.length >= 2) {
          ce3Eligible++
          goldenMatches += match.matches.length
          recoverableAmount += dispute.amount
          eligibleDisputes.push({
            dispute_id: dispute.id,
            amount: dispute.amount,
            reason_code: dispute.reason,
            matches_found: match.matches.length,
          })
        }
      } catch (error: any) {
        logger.warn({
          event: 'SHADOW_PILOT_DISPUTE_ERROR',
          disputeId: dispute.id,
          error: error.message,
        })
        // Continue processing other disputes
      }
    }

    // Calculate VAMP ratios
    const totalTransactions = transactions?.length || 1
    const currentVampRatio = totalTransactions > 0 ? disputes.length / totalTransactions : 0
    const projectedVampRatio = totalTransactions > 0 
      ? (disputes.length - ce3Eligible) / totalTransactions 
      : 0

    // Calculate VAMP penalty savings (if ratio > 1.5%, $8 per dispute)
    const vampPenaltySavings = currentVampRatio > 0.015 
      ? ce3Eligible * 8 
      : 0

    const result = {
      total_disputes: disputes.length,
      ce_3_0_eligible: ce3Eligible,
      golden_matches: goldenMatches,
      recoverable_amount: recoverableAmount,
      current_vamp_ratio: currentVampRatio,
      projected_vamp_ratio: projectedVampRatio,
      vamp_penalty_savings: vampPenaltySavings,
      disputes_by_reason_code: disputesByReason,
      eligible_disputes: eligibleDisputes,
    }

    logger.info({
      event: 'SHADOW_PILOT_COMPLETED',
      merchantId: merchant.id,
      totalDisputes: result.total_disputes,
      ce3Eligible: result.ce_3_0_eligible,
      recoverableAmount: result.recoverable_amount,
    })

    return NextResponse.json({
      success: true,
      message: `Analysis complete! Found ${ce3Eligible} CE 3.0 eligible disputes worth $${(recoverableAmount / 100).toFixed(2)}.`,
      result,
    })
  } catch (error: any) {
    logger.error({
      event: 'SHADOW_PILOT_FAILED',
      error: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        message: 'Failed to run revenue analysis. Please try again or contact support.',
      },
      { status: 500 }
    )
  }
}

