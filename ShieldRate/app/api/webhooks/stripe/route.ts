import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { findCE3Matches } from '@/lib/ce3-matcher'
import { classifyDispute } from '@/lib/dispute-router'
import { headers } from 'next/headers'
import { logger, LogEvents } from '@/lib/logger'
import { webhookRateLimit, getClientIP } from '@/lib/rate-limit'
import { processDisputeTransaction } from '@/lib/db-transactions'
import type Stripe from 'stripe'

// Force dynamic rendering (uses request headers for webhook verification)
export const dynamic = 'force-dynamic'

/**
 * Stripe Webhook Handler - Idempotent CE 3.0 Dispute Processor
 * 
 * PRODUCTION HARDENING REQUIREMENTS:
 * 1. WEBHOOK SECURITY: Strict signature verification using stripe.webhooks.constructEvent
 *    - Prevents webhook spoofing attacks
 *    - Validates all webhooks come from Stripe
 * 2. IDEMPOTENCY: Check stripe_dispute_id exists before processing
 *    - Prevents duplicate evidence submission
 *    - Returns 200 OK for duplicate webhooks (safe to retry)
 * 3. DB INTEGRITY: All operations wrapped in transaction pattern
 *    - Prevents partial data writes on crashes
 *    - Ensures atomic dispute processing
 * 4. STRUCTURED LOGGING: All lifecycle events logged with Pino
 *    - DISPUTE_RECEIVED, CE3_MATCH_FOUND, PDF_GENERATED, SUBMISSION_STATUS
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  
  // Rate limiting (tracking only, webhooks should not be rate limited)
  if (webhookRateLimit) {
    const { success } = await webhookRateLimit.limit(`webhook:${clientIP}`)
    if (!success) {
      logger.warn({
        event: LogEvents.RATE_LIMIT_EXCEEDED,
        ip: clientIP,
        endpoint: '/api/webhooks/stripe',
      })
    }
  }

  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  // SECURITY: Require signature header
  if (!signature) {
    logger.warn({
      event: LogEvents.WEBHOOK_VERIFICATION_FAILED,
      reason: 'missing_signature_header',
      ip: clientIP,
    })
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  // SECURITY: Require webhook secret
  if (!webhookSecret) {
    logger.error({
      event: LogEvents.WEBHOOK_VERIFICATION_FAILED,
      reason: 'missing_webhook_secret',
    })
    return NextResponse.json(
      { error: 'Missing STRIPE_WEBHOOK_SECRET' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  // SECURITY: Strict signature verification - prevents webhook spoofing
  // This is the ONLY way to verify webhooks actually come from Stripe
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    logger.info({
      event: LogEvents.WEBHOOK_VERIFIED,
      eventType: event.type,
      eventId: event.id,
      ip: clientIP,
    })
  } catch (err: any) {
    logger.error({
      event: LogEvents.WEBHOOK_VERIFICATION_FAILED,
      reason: 'signature_mismatch',
      error: err.message,
      ip: clientIP,
    })
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle charge.dispute.created event
  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object as Stripe.Dispute

    logger.info({
      event: LogEvents.DISPUTE_RECEIVED,
      disputeId: dispute.id,
      chargeId: dispute.charge as string,
      amount: dispute.amount,
      reason: dispute.reason,
    })

    // IDEMPOTENCY: Check if dispute already processed
    // CRITICAL: This must be the FIRST database operation
    // Prevents duplicate evidence submission if webhook is retried
    // Returns 200 OK (safe to retry) if duplicate found
    const { data: existingDispute, error: idempotencyError } = await supabaseAdmin
      .from('disputes')
      .select('id, v_compliance_score, auto_win_eligible')
      .eq('stripe_dispute_id', dispute.id)
      .single()

    if (existingDispute) {
      logger.info({
        event: LogEvents.IDEMPOTENCY_CHECK,
        disputeId: dispute.id,
        existingId: existingDispute.id,
        action: 'skipped_duplicate',
        message: 'Dispute already processed, returning 200 OK (idempotent)',
      })
      return NextResponse.json({ 
        received: true, 
        skipped: true,
        dispute_id: existingDispute.id,
      })
    }

    // DB INTEGRITY: Process dispute in transaction-like pattern
    // This ensures atomic operations - if any step fails, we can rollback
    let insertedDisputeId: string | null = null
    
    const result = await processDisputeTransaction(async () => {

      // Calculate evidence due date first (needed for both test and real disputes)
      const evidenceDueBy = dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Fetch the charge to get customer and payment details
      const charge = await stripe.charges.retrieve(dispute.charge as string)
      const customerId = charge.customer as string

      const disputeCategory = classifyDispute(dispute.reason || 'fraudulent')

      if (!customerId) {
        logger.warn({
          event: LogEvents.DATABASE_ERROR,
          disputeId: dispute.id,
          chargeId: dispute.charge as string,
          message: 'Charge has no customer ID - using charge ID as fallback',
        })
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
            ip_address: null,
            device_fingerprint: null,
            v_compliance_score: 0,
            auto_win_eligible: false,
            liability_shift_eligible: false,
            historical_match_found: false,
            usage_audit_attached: false,
            card_network: 'UNKNOWN',
            match_count: 0,
            dispute_category: disputeCategory,
            evidence_type: 'pending',
          })
          .select()
          .single()

        if (insertError || !newDispute) {
          throw new Error(`Failed to save dispute: ${insertError?.message || 'Unknown error'}`)
        }

        return { dispute_id: newDispute.id, note: 'No customer ID — saved for tracking' }
      }

      const ipAddress = charge.metadata?.ip_address || null
      const deviceFingerprint = charge.metadata?.device_fingerprint || null

      // Run CE 3.0 matching
      const ce3Result = await findCE3Matches(
        customerId,
        ipAddress,
        deviceFingerprint,
        dispute.charge as string,
        undefined,
        stripe,
        dispute.reason,
      )
      const complianceChecklist = ce3Result.complianceChecklist
      const requiresManualReview = dispute.amount > 50000

      let evidenceType: string = 'pending'
      if (complianceChecklist.liabilityShiftEligible) {
        evidenceType = 'ce3_auto'
      } else if (disputeCategory === 'fraud_10_4' || disputeCategory === 'authorization' || disputeCategory === 'consumer' || disputeCategory === 'fraud_other') {
        evidenceType = 'regular_10_4'
      } else {
        evidenceType = 'manual'
      }

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
          ip_address: ipAddress,
          device_fingerprint: deviceFingerprint,
          v_compliance_score: complianceChecklist.liabilityShiftEligible ? 100 : (evidenceType === 'regular_10_4' ? 60 : 0),
          auto_win_eligible: complianceChecklist.liabilityShiftEligible || evidenceType === 'regular_10_4',
          liability_shift_eligible: complianceChecklist.liabilityShiftEligible,
          historical_match_found: complianceChecklist.historicalMatchFound,
          usage_audit_attached: complianceChecklist.usageAuditAttached,
          card_network: complianceChecklist.network,
          match_count: complianceChecklist.matchCount,
          hist_match_charge_id_1: ce3Result.matches[0]?.charge_id ?? null,
          hist_match_charge_id_2: ce3Result.matches[1]?.charge_id ?? null,
          reason_code_eligible: complianceChecklist.reasonCodeEligible,
          billing_descriptor_match: complianceChecklist.billingDescriptorMatch,
          identifier_consistent: complianceChecklist.identifierConsistent,
          ineligibility_reasons: complianceChecklist.ineligibilityReasons,
          requires_manual_review: requiresManualReview,
          dispute_category: disputeCategory,
          evidence_type: evidenceType,
        })
        .select()
        .single()

      if (insertError || !newDispute) {
        throw new Error(`Failed to save dispute: ${insertError?.message || 'Unknown error'}`)
      }

      insertedDisputeId = newDispute.id

      // --- Submission routing ---
      let autoSubmitted = false
      if (!requiresManualReview) {
        if (evidenceType === 'ce3_auto') {
          try {
            const { submitEvidenceToStripe } = await import('@/lib/stripe-submission')
            const res = await submitEvidenceToStripe(newDispute.id, dispute.id)
            if (res.success) {
              autoSubmitted = true
              await supabaseAdmin.from('disputes').update({
                status: 'warning_needs_response',
                evidence_submitted_at: new Date().toISOString(),
                evidence_submission_type: 'ce3_auto',
              }).eq('id', newDispute.id)
            } else {
              await supabaseAdmin.from('disputes').update({ status: 'needs_attention' }).eq('id', newDispute.id)
            }
          } catch (error: any) {
            logger.error({ event: LogEvents.EVIDENCE_SUBMIT_FAILED, disputeId: dispute.id, error: error.message })
            await supabaseAdmin.from('disputes').update({ status: 'needs_attention' }).eq('id', newDispute.id)
          }
        } else if (evidenceType === 'regular_10_4') {
          try {
            const { submitRegularEvidenceToStripe } = await import('@/lib/stripe-submission')
            const res = await submitRegularEvidenceToStripe(newDispute.id, dispute.id)
            if (res.success) {
              autoSubmitted = true
              await supabaseAdmin.from('disputes').update({
                status: 'warning_needs_response',
                evidence_submitted_at: new Date().toISOString(),
                evidence_submission_type: 'regular_auto',
              }).eq('id', newDispute.id)
            } else {
              await supabaseAdmin.from('disputes').update({ status: 'needs_attention' }).eq('id', newDispute.id)
            }
          } catch (error: any) {
            logger.error({ event: LogEvents.EVIDENCE_SUBMIT_FAILED, disputeId: dispute.id, error: error.message, type: 'regular_10_4' })
            await supabaseAdmin.from('disputes').update({ status: 'needs_attention' }).eq('id', newDispute.id)
          }
        }
      } else {
        logger.info({
          event: 'MANUAL_REVIEW_REQUIRED',
          disputeId: newDispute.id,
          amount: dispute.amount,
        })
      }

      return {
        dispute_id: newDispute.id,
        liability_shift_eligible: complianceChecklist.liabilityShiftEligible,
        historical_match_found: complianceChecklist.historicalMatchFound,
        network: complianceChecklist.network,
        auto_submitted: autoSubmitted,
        evidence_type: evidenceType,
        category: disputeCategory,
      }
    }, async () => {
      // ROLLBACK: If transaction fails, delete the inserted dispute record
      // This prevents orphaned/partial records in the database
      if (insertedDisputeId) {
        try {
          await supabaseAdmin
            .from('disputes')
            .delete()
            .eq('id', insertedDisputeId)
          
          logger.info({
            event: 'ROLLBACK_EXECUTED',
            disputeId: dispute.id,
            insertedId: insertedDisputeId,
            message: 'Rolled back failed dispute transaction',
          })
        } catch (rollbackError: any) {
          logger.error({
            event: 'ROLLBACK_FAILED',
            disputeId: dispute.id,
            insertedId: insertedDisputeId,
            error: rollbackError.message,
          })
        }
      }
    })

    if (!result.success) {
      logger.error({
        event: LogEvents.DATABASE_ERROR,
        disputeId: dispute.id,
        error: result.error,
      })
      return NextResponse.json(
        { error: `Processing failed: ${result.error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      received: true,
      ...result.data,
    })
  }

  // Handle charge.dispute.updated — outcome tracking (won/lost/closed)
  if (event.type === 'charge.dispute.updated') {
    const dispute = event.data.object as Stripe.Dispute
    const { error: updateError } = await supabaseAdmin
      .from('disputes')
      .update({
        status: dispute.status,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_dispute_id', dispute.id)

    if (updateError) {
      logger.warn({
        event: 'DISPUTE_UPDATE_SYNC_FAILED',
        stripeDisputeId: dispute.id,
        status: dispute.status,
        error: updateError.message,
      })
    } else {
      logger.info({
        event: 'DISPUTE_OUTCOME_UPDATED',
        stripeDisputeId: dispute.id,
        status: dispute.status,
      })
    }
    return NextResponse.json({ received: true, dispute_status: dispute.status })
  }

  // Handle other webhook events if needed
  return NextResponse.json({ received: true })
}

