import { NextRequest, NextResponse } from 'next/server'
import { getMerchantStripe, getMerchant } from '@/lib/merchant-stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { findCE3Matches } from '@/lib/ce3-matcher'
import { classifyDispute, getNetworkReasonCode, deriveFraudSubCode } from '@/lib/dispute-router'
import { headers } from 'next/headers'
import { logger, LogEvents } from '@/lib/logger'
import { webhookRateLimit, getClientIP } from '@/lib/rate-limit'
import { processDisputeTransaction } from '@/lib/db-transactions'
import type Stripe from 'stripe'

// Force dynamic rendering (uses request headers for webhook verification)
export const dynamic = 'force-dynamic'

/**
 * Merchant-Specific Stripe Webhook Handler
 * 
 * POST /api/webhooks/stripe/[merchantId]
 * 
 * Each merchant has their own webhook endpoint with their own webhook secret
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  const merchantId = params.merchantId

  // Rate limiting
  if (webhookRateLimit) {
    const { success } = await webhookRateLimit.limit(`webhook:${clientIP}:${merchantId}`)
    if (!success) {
      logger.warn({
        event: LogEvents.RATE_LIMIT_EXCEEDED,
        ip: clientIP,
        merchantId,
        endpoint: `/api/webhooks/stripe/${merchantId}`,
      })
    }
  }

  // Get merchant to retrieve webhook secret
  const merchant = await getMerchant(merchantId)
  if (!merchant || !merchant.is_active) {
    logger.error({
      event: LogEvents.WEBHOOK_VERIFICATION_FAILED,
      reason: 'merchant_not_found',
      merchantId,
    })
    return NextResponse.json(
      { error: 'Merchant not found or inactive' },
      { status: 404 }
    )
  }

  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    logger.warn({
      event: LogEvents.WEBHOOK_VERIFICATION_FAILED,
      reason: 'missing_signature_header',
      ip: clientIP,
      merchantId,
    })
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  // Get merchant's Stripe client
  const stripe = await getMerchantStripe(merchantId)

  // Verify webhook signature using merchant's webhook secret
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, merchant.stripe_webhook_secret)
    logger.info({
      event: LogEvents.WEBHOOK_VERIFIED,
      eventType: event.type,
      eventId: event.id,
      merchantId,
      ip: clientIP,
    })
  } catch (err: any) {
    logger.error({
      event: LogEvents.WEBHOOK_VERIFICATION_FAILED,
      reason: 'signature_mismatch',
      error: err.message,
      merchantId,
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
      merchantId,
      amount: dispute.amount,
      reason: dispute.reason,
    })

    // Get merchant to check plan limits
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('id', merchantId)
      .single()

    if (!merchant) {
      logger.error({
        event: 'MERCHANT_NOT_FOUND',
        merchantId,
        disputeId: dispute.id,
      })
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      )
    }

    // Check dispute limit before processing
    const { checkDisputeLimit, getPlanLimits, incrementDisputeCounter } = await import('@/lib/plan-limits')
    const limitCheck = checkDisputeLimit(merchant)
    
    if (!limitCheck.allowed) {
      logger.warn({
        event: 'DISPUTE_LIMIT_EXCEEDED',
        merchantId,
        plan: merchant.plan,
        disputeId: dispute.id,
        reason: limitCheck.reason,
      })
      // Still process dispute but mark it (don't auto-submit for free tier)
      // This allows users to see what they're missing
    }

    // IDEMPOTENCY: Check if dispute already processed
    const { data: existingDispute } = await supabaseAdmin
      .from('disputes')
      .select('id, v_compliance_score, auto_win_eligible')
      .eq('stripe_dispute_id', dispute.id)
      .eq('merchant_id', merchantId)
      .single()

    if (existingDispute) {
      logger.info({
        event: LogEvents.IDEMPOTENCY_CHECK,
        disputeId: dispute.id,
        merchantId,
        existingId: existingDispute.id,
        action: 'skipped_duplicate',
      })
      return NextResponse.json({
        received: true,
        skipped: true,
        dispute_id: existingDispute.id,
      })
    }

    // Process dispute with merchant context
    const result = await processDisputeTransaction(async () => {
      const evidenceDueBy = dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const charge = await stripe.charges.retrieve(dispute.charge as string)
      const customerId = charge.customer as string

      // Extract network-level reason code (e.g. "10.1", "10.4", "13.1")
      const networkReasonCode = getNetworkReasonCode(dispute)
      const fraudSubCode = deriveFraudSubCode(networkReasonCode)
      const disputeCategory = classifyDispute(dispute.reason || 'fraudulent', fraudSubCode)

      if (!customerId) {
        logger.warn({
          event: LogEvents.DATABASE_ERROR,
          disputeId: dispute.id,
          chargeId: dispute.charge as string,
          merchantId,
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
            dispute_category: disputeCategory,
            evidence_type: disputeCategory === 'fraud_10_5' ? 'skip' : 'pending',
            network_reason_code: networkReasonCode,
            fraud_sub_code: fraudSubCode,
          })
          .select()
          .single()

        if (insertError || !newDispute) {
          throw new Error(`Failed to save dispute: ${insertError?.message || 'Unknown error'}`)
        }

        return {
          dispute_id: newDispute.id,
          note: 'Dispute saved (no customer ID)',
        }
      }

      // Run CE 3.0 matching (produces compliance checklist for ALL disputes)
      const ce3Result = await findCE3Matches(
        customerId,
        charge.metadata?.ip_address || null,
        charge.metadata?.device_fingerprint || null,
        dispute.charge as string,
        merchantId,
        stripe,
        dispute.reason,
      )
      const complianceChecklist = ce3Result.complianceChecklist
      const histMatch1 = ce3Result.matches[0]?.charge_id ?? null
      const histMatch2 = ce3Result.matches[1]?.charge_id ?? null

      const requiresManualReview = dispute.amount > 50000
      const hasCE3Addon = merchant.ce3_addon === true

      // Determine evidence type: category-specific engine routing
      let evidenceType: string = 'pending'
      if (disputeCategory === 'fraud_10_5') {
        evidenceType = 'skip'
      } else if (disputeCategory === 'fraud_10_1' || disputeCategory === 'fraud_10_2') {
        evidenceType = 'emv_evidence'
      } else if (disputeCategory === 'fraud_10_3') {
        evidenceType = 'card_present_evidence'
      } else if (complianceChecklist.liabilityShiftEligible && hasCE3Addon) {
        evidenceType = 'ce3_auto'
      } else if (disputeCategory === 'fraud_10_4' || disputeCategory === 'fraud_other') {
        evidenceType = 'regular_10_4'
      } else if (disputeCategory === 'consumer') {
        evidenceType = 'consumer_evidence'
      } else if (disputeCategory === 'authorization') {
        evidenceType = 'auth_evidence'
      } else if (disputeCategory === 'processing_error') {
        evidenceType = 'processing_evidence'
      } else {
        evidenceType = 'manual'
      }

      const isAutoEligible = evidenceType !== 'skip' && evidenceType !== 'manual'
      const complianceScore = complianceChecklist.liabilityShiftEligible
        ? 100
        : (evidenceType === 'skip' ? 0 : evidenceType === 'manual' ? 0 : 60)

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
          ip_address: charge.metadata?.ip_address || null,
          device_fingerprint: charge.metadata?.device_fingerprint || null,
          v_compliance_score: complianceScore,
          auto_win_eligible: isAutoEligible,
          liability_shift_eligible: complianceChecklist.liabilityShiftEligible,
          historical_match_found: complianceChecklist.historicalMatchFound,
          usage_audit_attached: complianceChecklist.usageAuditAttached,
          card_network: complianceChecklist.network,
          match_count: complianceChecklist.matchCount,
          hist_match_charge_id_1: histMatch1,
          hist_match_charge_id_2: histMatch2,
          reason_code_eligible: complianceChecklist.reasonCodeEligible,
          billing_descriptor_match: complianceChecklist.billingDescriptorMatch,
          identifier_consistent: complianceChecklist.identifierConsistent,
          ineligibility_reasons: complianceChecklist.ineligibilityReasons,
          requires_manual_review: requiresManualReview,
          dispute_category: disputeCategory,
          evidence_type: evidenceType,
          network_reason_code: networkReasonCode,
          fraud_sub_code: fraudSubCode,
        })
        .select()
        .single()

      if (insertError || !newDispute) {
        throw new Error(`Failed to save dispute: ${insertError?.message || 'Unknown error'}`)
      }

      const { incrementDisputeCounter, getPlanLimits } = await import('@/lib/plan-limits')
      if (limitCheck.allowed) {
        await incrementDisputeCounter(merchantId, supabaseAdmin)
      }

      const planLimits = getPlanLimits(merchant)
      const canAutoSubmit = planLimits.autoSubmission && !planLimits.readOnly && limitCheck.allowed

      if (requiresManualReview) {
        logger.info({
          event: 'MANUAL_REVIEW_REQUIRED',
          disputeId: newDispute.id,
          stripeDisputeId: dispute.id,
          amount: dispute.amount,
          reason: 'dispute_over_500_dollars',
        })
      }

      // --- 10.5 SKIP: Visa does not accept evidence ---
      if (evidenceType === 'skip') {
        logger.info({
          event: 'DISPUTE_AUTO_SKIPPED',
          disputeId: newDispute.id,
          stripeDisputeId: dispute.id,
          fraudSubCode,
          reason: 'Visa Fraud Monitoring Program (10.5) — no recourse.',
        })
        await supabaseAdmin.from('disputes').update({
          status: 'warning_closed',
          evidence_type: 'skip',
          evidence_submission_type: 'auto_skip_10_5',
        }).eq('id', newDispute.id)
      }

      // --- SUBMISSION ROUTING (category-specific engines) ---
      else if (canAutoSubmit && !requiresManualReview) {
        const submission = await import('@/lib/stripe-submission')
        let submissionResult: { success: boolean; message: string } | null = null

        try {
          switch (evidenceType) {
            case 'ce3_auto':
              submissionResult = await submission.submitEvidenceToStripe(newDispute.id, dispute.id, merchantId)
              break
            case 'regular_10_4':
              submissionResult = await submission.submitRegularEvidenceToStripe(newDispute.id, dispute.id, merchantId)
              break
            case 'emv_evidence':
              submissionResult = await submission.submitEMVEvidenceToStripe(newDispute.id, dispute.id, merchantId)
              break
            case 'card_present_evidence':
              submissionResult = await submission.submitCardPresentEvidenceToStripe(newDispute.id, dispute.id, merchantId)
              break
            case 'consumer_evidence':
              submissionResult = await submission.submitConsumerEvidenceToStripe(newDispute.id, dispute.id, merchantId)
              break
            case 'auth_evidence':
              submissionResult = await submission.submitAuthorizationEvidenceToStripe(newDispute.id, dispute.id, merchantId)
              break
            case 'processing_evidence':
              submissionResult = await submission.submitProcessingEvidenceToStripe(newDispute.id, dispute.id, merchantId)
              break
          }

          if (submissionResult?.success) {
            await supabaseAdmin.from('disputes').update({
              status: 'warning_needs_response',
              evidence_submitted_at: new Date().toISOString(),
              evidence_submission_type: evidenceType.replace('_evidence', '_auto'),
            }).eq('id', newDispute.id)
          } else if (submissionResult && !submissionResult.success) {
            await supabaseAdmin.from('disputes').update({ status: 'needs_attention' }).eq('id', newDispute.id)
          }
        } catch (error: any) {
          logger.error({ event: LogEvents.EVIDENCE_SUBMIT_FAILED, disputeId: newDispute.id, error: error.message, type: evidenceType })
          await supabaseAdmin.from('disputes').update({ status: 'needs_attention' }).eq('id', newDispute.id)
        }
      } else if (!canAutoSubmit) {
        logger.info({
          event: 'AUTO_SUBMIT_SKIPPED',
          disputeId: newDispute.id,
          merchantId,
          plan: merchant.plan,
          evidenceType,
          reason: planLimits.readOnly ? 'free_tier_readonly' : !limitCheck.allowed ? 'limit_exceeded' : 'plan_restriction',
        })
      }

      return {
        dispute_id: newDispute.id,
        compliance: complianceChecklist,
        evidenceType,
        category: disputeCategory,
      }
    })

    const processingTime = Date.now() - startTime

    if (!result.success || !result.data) {
      logger.error({
        event: LogEvents.DATABASE_ERROR,
        disputeId: dispute.id,
        merchantId,
        error: result.error || 'Unknown error',
      })
      return NextResponse.json(
        { error: result.error || 'Failed to process dispute' },
        { status: 500 }
      )
    }

    logger.info({
      event: LogEvents.DISPUTE_PROCESSED,
      disputeId: dispute.id,
      merchantId,
      processingTime,
      result: result.data,
    })

    return NextResponse.json({
      received: true,
      dispute_id: result.data.dispute_id,
      processing_time_ms: processingTime,
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
      .eq('merchant_id', merchantId)

    if (updateError) {
      logger.warn({
        event: 'DISPUTE_UPDATE_SYNC_FAILED',
        stripeDisputeId: dispute.id,
        merchantId,
        status: dispute.status,
        error: updateError.message,
      })
    } else {
      logger.info({
        event: 'DISPUTE_OUTCOME_UPDATED',
        stripeDisputeId: dispute.id,
        merchantId,
        status: dispute.status,
      })
    }
    return NextResponse.json({ received: true, dispute_status: dispute.status })
  }

  // Unknown event type
  logger.warn({
    event: 'UNKNOWN_WEBHOOK_EVENT',
    eventType: event.type,
    merchantId,
  })

  return NextResponse.json({ received: true, event_type: event.type })
}

