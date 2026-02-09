import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { getMerchantStripe } from '@/lib/merchant-stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { getComplianceChecklist } from '@/lib/ce3-matcher'
import { processDisputeTransaction } from '@/lib/db-transactions'
import { logger, LogEvents } from '@/lib/logger'
import type Stripe from 'stripe'

// Force dynamic rendering (uses request headers for auth)
export const dynamic = 'force-dynamic'

/**
 * Sync Existing Disputes API
 * 
 * Fetches all disputes from Stripe and processes them into Vantirs
 * Useful for importing disputes that were created before webhook setup
 * 
 * POST /api/onboarding/sync-disputes
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid API key.' },
        { status: 401 }
      )
    }

    const merchantId = merchant.id

    // Verify merchant is active
    if (!merchant.is_active) {
      return NextResponse.json(
        { error: 'Merchant account is inactive' },
        { status: 403 }
      )
    }

    // Verify merchant exists in database before getting Stripe client
    const { data: merchantCheck, error: merchantCheckError } = await supabaseAdmin
      .from('merchants')
      .select('id, is_active')
      .eq('id', merchantId)
      .maybeSingle()

    if (merchantCheckError) {
      logger.error({
        event: 'MERCHANT_VERIFY_ERROR',
        merchantId,
        error: merchantCheckError.message,
      })
      return NextResponse.json(
        { error: `Database error: ${merchantCheckError.message}` },
        { status: 500 }
      )
    }

    if (!merchantCheck) {
      logger.error({
        event: 'MERCHANT_NOT_IN_DB',
        merchantId,
        message: 'Merchant authenticated but not found in database',
      })
      return NextResponse.json(
        { error: 'Merchant record not found in database. Please reconnect your Stripe account.' },
        { status: 404 }
      )
    }

    const stripeClient = await getMerchantStripe(merchantId)

    logger.info({
      event: 'DISPUTE_SYNC_STARTED',
      merchantId,
    })

    // Fetch all disputes from Stripe (paginated)
    const allDisputes: Stripe.Dispute[] = []
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const response = await stripeClient.disputes.list({
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter }),
      })

      allDisputes.push(...response.data)
      hasMore = response.has_more
      
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id
      }
    }

    logger.info({
      event: 'DISPUTES_FETCHED',
      merchantId,
      totalDisputes: allDisputes.length,
    })

    let synced = 0
    let skipped = 0
    let errors = 0

    // Process each dispute
    for (const dispute of allDisputes) {
      try {
        // Check if already exists (idempotency)
        const { data: existing } = await supabaseAdmin
          .from('disputes')
          .select('id')
          .eq('stripe_dispute_id', dispute.id)
          .eq('merchant_id', merchantId)
          .single()

        if (existing) {
          skipped++
          continue
        }

        // Process dispute (same logic as webhook)
        const result = await processDisputeTransaction(async () => {
          // Calculate evidence due date
          const evidenceDueBy = dispute.evidence_details?.due_by
            ? new Date(dispute.evidence_details.due_by * 1000)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

          // Fetch the charge to get customer and payment details
          const charge = await stripeClient.charges.retrieve(dispute.charge as string)
          const customerId = charge.customer as string

          // Handle test charges that may not have a customer ID
          if (!customerId) {
            const fallbackCustomerId = `test_customer_${(dispute.charge as string).replace('ch_', '')}`
            
            const { data: newDispute, error: insertError } = await supabaseAdmin
              .from('disputes')
              .insert({
                stripe_dispute_id: dispute.id,
                amount: dispute.amount,
                status: dispute.status,
                reason_code: dispute.reason,
                evidence_due_by: evidenceDueBy.toISOString(),
                customer_id: fallbackCustomerId,
                charge_id: dispute.charge as string,
                merchant_id: merchantId,
                ip_address: null,
                device_fingerprint: null,
                v_compliance_score: 0,
                auto_win_eligible: false,
                liability_shift_eligible: false,
                historical_match_found: false,
                usage_audit_attached: false,
                card_network: 'UNKNOWN',
                match_count: 0,
              })
              .select()
              .single()

            if (insertError || !newDispute) {
              throw new Error(`Failed to save dispute: ${insertError?.message || 'Unknown error'}`)
            }

            return {
              dispute_id: newDispute.id,
              note: 'Test dispute processed (no customer ID for CE 3.0 matching)',
            }
          }

          // Extract IP and device fingerprint from charge metadata
          const ipAddress = charge.metadata?.ip_address || null
          const deviceFingerprint = charge.metadata?.device_fingerprint || null

          // Insert dispute record
          const { data: newDispute, error: insertError } = await supabaseAdmin
            .from('disputes')
            .insert({
              stripe_dispute_id: dispute.id,
              amount: dispute.amount,
              status: dispute.status,
              reason_code: dispute.reason,
              evidence_due_by: evidenceDueBy.toISOString(),
              customer_id: customerId,
              charge_id: dispute.charge as string,
              merchant_id: merchantId,
              ip_address: ipAddress,
              device_fingerprint: deviceFingerprint,
            })
            .select()
            .single()

          if (insertError || !newDispute) {
            throw new Error(`Failed to save dispute: ${insertError?.message || 'Unknown error'}`)
          }

          // Get compliance checklist (with merchant_id)
          const complianceChecklist = await getComplianceChecklist(
            customerId,
            merchantId,
            stripeClient,
            dispute.charge as string,
            ipAddress,
            deviceFingerprint
          )

          // Determine if manual review required (disputes over $500)
          const requiresManualReview = dispute.amount > 50000

          // Update dispute with compliance checklist
          const { error: updateError } = await supabaseAdmin
            .from('disputes')
            .update({
              v_compliance_score: complianceChecklist.liabilityShiftEligible ? 100 : 0,
              auto_win_eligible: complianceChecklist.liabilityShiftEligible,
              liability_shift_eligible: complianceChecklist.liabilityShiftEligible,
              historical_match_found: complianceChecklist.historicalMatchFound,
              usage_audit_attached: complianceChecklist.usageAuditAttached,
              card_network: complianceChecklist.network,
              match_count: complianceChecklist.matchCount,
              requires_manual_review: requiresManualReview,
            })
            .eq('id', newDispute.id)

          if (updateError) {
            logger.error({
              event: LogEvents.DATABASE_ERROR,
              error: updateError.message,
              disputeId: newDispute.id,
            })
          }

          // Log match status
          if (complianceChecklist.historicalMatchFound) {
            logger.info({
              event: LogEvents.CE3_MATCH_FOUND,
              disputeId: dispute.id,
              matchCount: complianceChecklist.matchCount,
              network: complianceChecklist.network,
              liabilityShiftEligible: complianceChecklist.liabilityShiftEligible,
            })
          }

          return {
            dispute_id: newDispute.id,
            liability_shift_eligible: complianceChecklist.liabilityShiftEligible,
            historical_match_found: complianceChecklist.historicalMatchFound,
            network: complianceChecklist.network,
          }
        }, async () => {
          // Rollback: Delete dispute if processing failed
          // (handled by processDisputeTransaction)
        })

        if (result.success) {
          synced++
        } else {
          errors++
          logger.error({
            event: 'DISPUTE_SYNC_ERROR',
            disputeId: dispute.id,
            error: result.error,
          })
        }
      } catch (error: any) {
        errors++
        logger.error({
          event: 'DISPUTE_SYNC_ERROR',
          disputeId: dispute.id,
          error: error.message,
          stack: error.stack,
        })
      }
    }

    logger.info({
      event: 'DISPUTE_SYNC_COMPLETED',
      merchantId,
      total: allDisputes.length,
      synced,
      skipped,
      errors,
    })

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} disputes. ${skipped} already existed. ${errors} errors.`,
      result: {
        total: allDisputes.length,
        synced,
        skipped,
        errors,
      },
    })
  } catch (error: any) {
    logger.error({
      event: LogEvents.SYNC_FAILED,
      type: 'dispute_sync',
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to sync disputes. Please try again or contact support.',
      },
      { status: 500 }
    )
  }
}

