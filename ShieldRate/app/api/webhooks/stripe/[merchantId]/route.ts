import { NextRequest, NextResponse } from 'next/server'
import { getMerchantStripe, getMerchant } from '@/lib/merchant-stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { findCE3Matches, getComplianceChecklist } from '@/lib/ce3-matcher'
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

      // Get compliance checklist using merchant's Stripe client
      const complianceChecklist = await getComplianceChecklist(
        customerId,
        merchantId,
        stripe,
        dispute.charge as string,
        charge.metadata?.ip_address || null,
        charge.metadata?.device_fingerprint || null
      )

      // ELITE FEATURE: Determine if manual review required (disputes over $500)
      // This allows merchants to add custom communication (e.g., customer complaint emails)
      const requiresManualReview = dispute.amount > 50000 // $500 in cents

      // Insert dispute with merchant_id
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
          v_compliance_score: complianceChecklist.liabilityShiftEligible ? 100 : 0,
          auto_win_eligible: complianceChecklist.liabilityShiftEligible,
          liability_shift_eligible: complianceChecklist.liabilityShiftEligible,
          historical_match_found: complianceChecklist.historicalMatchFound,
          usage_audit_attached: complianceChecklist.usageAuditAttached,
          card_network: complianceChecklist.network,
          match_count: complianceChecklist.matchCount,
          requires_manual_review: requiresManualReview, // ELITE: Manual review flag
        })
        .select()
        .single()

      if (insertError || !newDispute) {
        throw new Error(`Failed to save dispute: ${insertError?.message || 'Unknown error'}`)
      }

      // Increment dispute counter (even if limit exceeded, we still track it)
      const { incrementDisputeCounter, getPlanLimits } = await import('@/lib/plan-limits')
      if (limitCheck.allowed) {
        await incrementDisputeCounter(merchantId, supabaseAdmin)
      }

      // Auto-submit evidence if eligible AND not requiring manual review
      
      if (requiresManualReview) {
        // Mark dispute as requiring manual review
        await supabaseAdmin
          .from('disputes')
          .update({ requires_manual_review: true })
          .eq('id', newDispute.id)
        
        logger.info({
          event: 'MANUAL_REVIEW_REQUIRED',
          disputeId: newDispute.id,
          stripeDisputeId: dispute.id,
          amount: dispute.amount,
          reason: 'dispute_over_500_dollars',
          action: 'merchant_review_required_before_submission',
        })
      }

      // Auto-submit only if eligible AND not requiring manual review AND plan allows it
      const planLimits = getPlanLimits(merchant)
      const canAutoSubmit = planLimits.autoSubmission && !planLimits.readOnly && limitCheck.allowed
      
      if (complianceChecklist.liabilityShiftEligible && !requiresManualReview && canAutoSubmit) {
        try {
          const { submitEvidenceToStripe } = await import('@/lib/stripe-submission')
          const result = await submitEvidenceToStripe(newDispute.id, dispute.id, merchantId)
          
          if (result.success) {
            // Update status to indicate evidence submitted
            await supabaseAdmin
              .from('disputes')
              .update({ status: 'warning_needs_response' })
              .eq('id', newDispute.id)
          }
        } catch (error: any) {
          logger.error({
            event: LogEvents.EVIDENCE_SUBMIT_FAILED,
            disputeId: newDispute.id,
            stripeDisputeId: dispute.id,
            merchantId,
            error: error.message,
          })
          
          // Mark as needs_attention if auto-submission fails
          await supabaseAdmin
            .from('disputes')
            .update({ status: 'needs_attention' })
            .eq('id', newDispute.id)
        }
      } else if (complianceChecklist.liabilityShiftEligible && !canAutoSubmit) {
        // Eligible but can't auto-submit (free tier or limit exceeded)
        logger.info({
          event: 'AUTO_SUBMIT_SKIPPED',
          disputeId: newDispute.id,
          merchantId,
          plan: merchant.plan,
          reason: planLimits.readOnly 
            ? 'Free tier - read-only mode' 
            : !limitCheck.allowed 
            ? limitCheck.reason 
            : 'Plan does not allow auto-submission',
        })
      } else if (complianceChecklist.liabilityShiftEligible && requiresManualReview) {
        // Eligible but requires manual review - notify merchant
        logger.info({
          event: 'AUTO_SUBMIT_SKIPPED_MANUAL_REVIEW',
          disputeId: newDispute.id,
          stripeDisputeId: dispute.id,
          amount: dispute.amount,
          message: 'Dispute eligible for CE 3.0 but requires manual review due to high value',
        })
      }

      return {
        dispute_id: newDispute.id,
        compliance: complianceChecklist,
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

  // Unknown event type
  logger.warn({
    event: 'UNKNOWN_WEBHOOK_EVENT',
    eventType: event.type,
    merchantId,
  })

  return NextResponse.json({ received: true, event_type: event.type })
}

