import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { findCE3Matches, getComplianceChecklist } from '@/lib/ce3-matcher'
import { headers } from 'next/headers'
import { logger, LogEvents } from '@/lib/logger'
import { webhookRateLimit, getClientIP } from '@/lib/rate-limit'
import { processDisputeTransaction } from '@/lib/db-transactions'
import type Stripe from 'stripe'

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

      // Handle test charges that may not have a customer ID
      // For test disputes, use the charge ID as a fallback customer identifier
      if (!customerId) {
        logger.warn({
          event: LogEvents.DATABASE_ERROR,
          disputeId: dispute.id,
          chargeId: dispute.charge as string,
          message: 'Charge has no customer ID - using charge ID as fallback for test disputes',
        })
        
        // For test disputes, we can't match CE 3.0 but we can still log the dispute
        // Use a placeholder customer ID based on charge ID
        const fallbackCustomerId = `test_customer_${(dispute.charge as string).replace('ch_', '')}`
        
        // Insert dispute with fallback customer ID (won't match CE 3.0 but will be logged)
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
          })
          .select()
          .single()

        if (insertError || !newDispute) {
          throw new Error(`Failed to save dispute: ${insertError?.message || 'Unknown error'}`)
        }

        logger.info({
          event: LogEvents.DISPUTE_RECEIVED,
          disputeId: dispute.id,
          chargeId: dispute.charge as string,
          amount: dispute.amount,
          reason: dispute.reason,
          note: 'Test dispute - no customer ID, CE 3.0 matching skipped',
        })

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
          ip_address: ipAddress,
          device_fingerprint: deviceFingerprint,
        })
        .select()
        .single()

      if (insertError || !newDispute) {
        throw new Error(`Failed to save dispute: ${insertError?.message || 'Unknown error'}`)
      }

      // Store ID for potential rollback
      insertedDisputeId = newDispute.id

      // Run CE 3.0 matching algorithm (includes Mastercard support)
      const ce3Match = await findCE3Matches(
        customerId,
        ipAddress,
        deviceFingerprint,
        dispute.charge as string
      )

      // Get compliance checklist (binary YES/NO)
      const complianceChecklist = await getComplianceChecklist(
        newDispute.id,
        customerId,
        ce3Match
      )

      // Update dispute with compliance checklist (binary flags)
      const { error: updateError } = await supabaseAdmin
        .from('disputes')
        .update({
          v_compliance_score: complianceChecklist.liabilityShiftEligible ? 100 : 0, // Keep for backward compatibility
          auto_win_eligible: complianceChecklist.liabilityShiftEligible,
          liability_shift_eligible: complianceChecklist.liabilityShiftEligible,
          historical_match_found: complianceChecklist.historicalMatchFound,
          usage_audit_attached: complianceChecklist.usageAuditAttached,
          card_network: complianceChecklist.network,
          match_count: complianceChecklist.matchCount,
        })
        .eq('id', newDispute.id)

      if (updateError) {
        logger.error({
          event: LogEvents.DATABASE_ERROR,
          error: updateError.message,
          disputeId: newDispute.id,
        })
      }

      if (ce3Match.matched) {
        logger.info({
          event: LogEvents.CE3_MATCH_FOUND,
          disputeId: dispute.id,
          matches: ce3Match.matches.length,
          network: complianceChecklist.network,
          liabilityShiftEligible: complianceChecklist.liabilityShiftEligible,
        })
      } else {
        logger.info({
          event: LogEvents.CE3_MATCH_NOT_FOUND,
          disputeId: dispute.id,
          network: complianceChecklist.network,
          matchCount: complianceChecklist.matchCount,
        })
      }

      // Auto-submit evidence if liability shift eligible
      let autoSubmitted = false
      if (complianceChecklist.liabilityShiftEligible) {
        try {
          const { submitEvidenceToStripe } = await import('@/lib/stripe-submission')
          const result = await submitEvidenceToStripe(newDispute.id, dispute.id)
          if (result.success) {
            autoSubmitted = true
            logger.info({
              event: LogEvents.EVIDENCE_SUBMITTED,
              disputeId: dispute.id,
              autoSubmitted: true,
            })
          } else {
            // Submission failed (e.g., validation failed)
            // Status already updated to 'needs_attention' in submitEvidenceToStripe
            logger.warn({
              event: LogEvents.EVIDENCE_SUBMIT_FAILED,
              disputeId: dispute.id,
              reason: result.message,
              action: 'marked_as_needs_attention',
            })
          }
        } catch (error: any) {
          logger.error({
            event: LogEvents.EVIDENCE_SUBMIT_FAILED,
            disputeId: dispute.id,
            error: error.message,
          })
          // Mark as needs_attention if submission fails
          await supabaseAdmin
            .from('disputes')
            .update({ status: 'needs_attention' })
            .eq('id', newDispute.id)
          // Don't fail the webhook if submission fails
        }
      }

      const processingTime = Date.now() - startTime
      logger.info({
        event: 'DISPUTE_PROCESSED',
        disputeId: dispute.id,
        processingTimeMs: processingTime,
        liabilityShiftEligible: complianceChecklist.liabilityShiftEligible,
        network: complianceChecklist.network,
      })

      return {
        dispute_id: newDispute.id,
        liability_shift_eligible: complianceChecklist.liabilityShiftEligible,
        historical_match_found: complianceChecklist.historicalMatchFound,
        usage_audit_attached: complianceChecklist.usageAuditAttached,
        network: complianceChecklist.network,
        auto_submitted: autoSubmitted,
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

  // Handle other webhook events if needed
  return NextResponse.json({ received: true })
}

