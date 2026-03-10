/**
 * Stripe Evidence Submission
 * Handles two evidence paths:
 *  1. CE 3.0  — forensic PDF compliance pack (add-on)
 *  2. Regular — template evidence from charge/customer data (all plans)
 */

import { stripe } from './stripe'
import { generateCompliancePack } from './pdf-generator'
import { logger, LogEvents } from './logger'
import { validateVantirsEvidence } from './pdf-validator'
import { supabaseAdmin } from './supabase'
import { sendValidationFailureNotification } from './notifications'
import { getMerchantStripe } from './merchant-stripe'
import { buildRegular104Evidence } from './regular-evidence'
import { buildConsumerEvidence } from './consumer-evidence'
import { buildAuthorizationEvidence } from './authorization-evidence'
import { buildProcessingErrorEvidence } from './processing-evidence'
import type Stripe from 'stripe'

const SUBMISSION_RETRY_ATTEMPTS = 3
const SUBMISSION_RETRY_DELAY_MS = 1500

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: any
  for (let attempt = 1; attempt <= SUBMISSION_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      if (attempt < SUBMISSION_RETRY_ATTEMPTS) {
        logger.warn({ event: 'SUBMISSION_RETRY', label, attempt, error: err?.message })
        await new Promise((r) => setTimeout(r, SUBMISSION_RETRY_DELAY_MS))
      }
    }
  }
  throw lastError
}

/**
 * Submit evidence to Stripe for a dispute
 */
export async function submitEvidenceToStripe(
  disputeId: string,
  stripeDisputeId: string,
  merchantId?: string
): Promise<{ success: boolean; message: string }> {
  const startTime = Date.now()
  
  try {
    logger.info({
      event: LogEvents.SUBMISSION_STATUS,
      disputeId,
      stripeDisputeId,
      status: 'started',
    })

    // Get dispute record and merchant Stripe client before generating PDF (multi-tenant: use correct account)
    const { data: disputeRecord } = await supabaseAdmin
      .from('disputes')
      .select('card_network, merchant_id')
      .eq('id', disputeId)
      .single()

    const network = (disputeRecord?.card_network as 'VISA' | 'MASTERCARD' | 'UNKNOWN') || 'UNKNOWN'

    let stripeInstance = stripe
    if (merchantId || disputeRecord?.merchant_id) {
      const merchantIdToUse = merchantId || disputeRecord.merchant_id
      if (merchantIdToUse) {
        stripeInstance = await getMerchantStripe(merchantIdToUse)
      }
    }

    // Generate compliance pack PDF (with merchant's Stripe so dispute/charge data is from correct account)
    const pdfBuffer = await generateCompliancePack(disputeId, false, stripeInstance)

    // Pre-flight validation before submission
    const validation = await validateVantirsEvidence(pdfBuffer, network)
    
    if (!validation.passed) {
      logger.error({
        event: LogEvents.EVIDENCE_SUBMIT_FAILED,
        disputeId,
        stripeDisputeId,
        reason: 'PDF_VALIDATION_FAILED',
        errors: validation.errors,
        warnings: validation.warnings,
        metadata: validation.metadata,
      })
      
      // MANUAL OVERRIDE: Update dispute status to needs_attention
      // This ensures high-value disputes don't get silently blocked
      await supabaseAdmin
        .from('disputes')
        .update({ 
          status: 'needs_attention',
        })
        .eq('id', disputeId)
      
      // Send notification to merchant
      await sendValidationFailureNotification(disputeId, stripeDisputeId, validation.errors)
      
      return {
        success: false,
        message: `PDF validation failed: ${validation.errors.join(', ')}. Dispute marked as 'needs_attention' and notification sent.`,
      }
    }
    
    if (validation.warnings.length > 0) {
      logger.warn({
        event: LogEvents.SUBMISSION_STATUS,
        disputeId,
        stripeDisputeId,
        warnings: validation.warnings,
        metadata: validation.metadata,
      })
    }

    // Upload PDF to Stripe Files API first (required for proper evidence submission)
    // Stripe Files API can take 5-10 seconds to process, so we poll until ready
    const file = await stripeInstance.files.create({
      purpose: 'dispute_evidence',
      file: {
        data: pdfBuffer,
        name: `compliance-pack-${disputeId}.pdf`,
        type: 'application/pdf',
      },
    })

    // Poll for file to be ready (Stripe processes files asynchronously)
    // Maximum 30 seconds wait time (6 attempts × 5 seconds)
    const maxAttempts = 6
    const pollInterval = 5000 // 5 seconds
    let fileReady = false
    let attempts = 0

    while (!fileReady && attempts < maxAttempts) {
      const retrievedFile = await stripeInstance.files.retrieve(file.id)
      
      if (retrievedFile.purpose === 'dispute_evidence' && retrievedFile.size > 0) {
        fileReady = true
        logger.info({
          event: 'STRIPE_FILE_READY',
          disputeId,
          stripeDisputeId,
          fileId: file.id,
          attempts: attempts + 1,
          waitTimeMs: (attempts + 1) * pollInterval,
        })
        break
      }

      attempts++
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }
    }

    if (!fileReady) {
      logger.warn({
        event: 'STRIPE_FILE_TIMEOUT',
        disputeId,
        stripeDisputeId,
        fileId: file.id,
        attempts,
        action: 'proceeding_with_file_id_anyway',
      })
      // Continue anyway - file might be ready by the time we attach it
    }

    // Submit evidence to Stripe with the PDF attached (with retry for transient failures)
    const stripeDispute = await withRetry(
      () =>
        stripeInstance.disputes.update(stripeDisputeId, {
          evidence: {
            uncategorized_file: file.id,
            uncategorized_text: 'CE 3.0 Compliance Report: historical footprint match found, liability shift eligible. See attached PDF for full forensic evidence pack.',
          },
        }),
      'ce3_disputes_update'
    )
    
    // Log successful submission with file reference
    logger.info({
      event: 'STRIPE_EVIDENCE_SUBMITTED_WITH_FILE',
      disputeId,
      stripeDisputeId,
      fileId: file.id,
      fileReady,
      fileSizeBytes: pdfBuffer.length,
      note: 'File uploaded to Stripe Files API (purpose=dispute_evidence) and referenced in evidence text',
    })

    const processingTime = Date.now() - startTime

    logger.info({
      event: LogEvents.EVIDENCE_SUBMITTED,
      disputeId,
      stripeDisputeId,
      status: 'success',
      processingTimeMs: processingTime,
      pdfSizeBytes: pdfBuffer.length,
      stripeFileId: file.id,
      fileReady: fileReady,
    })

    return {
      success: true,
      message: `Evidence submitted to Stripe for dispute ${stripeDisputeId}. PDF file attached (ID: ${file.id}).`,
    }
  } catch (error: any) {
    const processingTime = Date.now() - startTime
    
    logger.error({
      event: LogEvents.EVIDENCE_SUBMIT_FAILED,
      disputeId,
      stripeDisputeId,
      error: error.message,
      errorType: error.type,
      processingTimeMs: processingTime,
    })
    
    return {
      success: false,
      message: `Failed to submit evidence: ${error.message}`,
    }
  }
}

/**
 * Auto-submit evidence for auto-win eligible disputes
 */
export async function autoSubmitEligibleDisputes(): Promise<{
  submitted: number
  failed: number
}> {
  const { supabaseAdmin } = await import('./supabase')

  // Get all auto-win eligible open disputes
  const { data: disputes } = await supabaseAdmin
    .from('disputes')
    .select('id, stripe_dispute_id')
    .eq('auto_win_eligible', true)
    .eq('status', 'open')

  if (!disputes || disputes.length === 0) {
    return { submitted: 0, failed: 0 }
  }

  let submitted = 0
  let failed = 0

  for (const dispute of disputes) {
    try {
      const result = await submitEvidenceToStripe(
        dispute.id,
        dispute.stripe_dispute_id
      )

      if (result.success) {
        submitted++
        // Update dispute status
        await supabaseAdmin
          .from('disputes')
          .update({ status: 'warning_needs_response' })
          .eq('id', dispute.id)
      } else {
        failed++
        // Mark as needs_attention if submission failed
        await supabaseAdmin
          .from('disputes')
          .update({ status: 'needs_attention' })
          .eq('id', dispute.id)
      }
    } catch (error: any) {
      logger.error({
        event: LogEvents.EVIDENCE_SUBMIT_FAILED,
        disputeId: dispute.id,
        stripeDisputeId: dispute.stripe_dispute_id,
        error: error.message,
      })
      failed++
    }
  }

  return { submitted, failed }
}

/**
 * Submit regular (non-CE3) 10.4 evidence to Stripe.
 * Builds evidence from charge metadata, customer data, activity logs,
 * AVS/3DS checks, and a narrative — then submits via the Stripe Disputes API.
 *
 * Optionally also attaches the forensic PDF if it exists.
 */
export async function submitRegularEvidenceToStripe(
  disputeId: string,
  stripeDisputeId: string,
  merchantId?: string,
): Promise<{ success: boolean; message: string; strength?: string }> {
  const startTime = Date.now()

  try {
    logger.info({
      event: LogEvents.SUBMISSION_STATUS,
      disputeId,
      stripeDisputeId,
      status: 'regular_evidence_started',
    })

    const { data: disputeRecord } = await supabaseAdmin
      .from('disputes')
      .select('card_network, merchant_id, charge_id')
      .eq('id', disputeId)
      .single()

    let stripeInstance = stripe
    const merchantIdToUse = merchantId || disputeRecord?.merchant_id
    if (merchantIdToUse) {
      stripeInstance = await getMerchantStripe(merchantIdToUse)
    }

    const evidenceResult = await buildRegular104Evidence(disputeId, stripeInstance, merchantIdToUse)

    if (!evidenceResult.eligible) {
      return {
        success: false,
        message: 'Could not build evidence: dispute not found.',
        strength: 'weak',
      }
    }

    // Also try to generate + attach the forensic PDF (even for non-CE3 it adds value)
    let fileId: string | undefined
    try {
      const pdfBuffer = await generateCompliancePack(disputeId, false, stripeInstance)
      if (pdfBuffer && pdfBuffer.length > 0) {
        const file = await stripeInstance.files.create({
          purpose: 'dispute_evidence',
          file: {
            data: pdfBuffer,
            name: `evidence-pack-${disputeId}.pdf`,
            type: 'application/pdf',
          },
        })
        fileId = file.id
      }
    } catch {
      // PDF generation is optional for regular evidence
    }

    const evidence: Stripe.DisputeUpdateParams.Evidence = {
      ...evidenceResult.evidenceFields,
    }

    if (fileId) {
      evidence.uncategorized_file = fileId
    }

    await withRetry(
      () => stripeInstance.disputes.update(stripeDisputeId, { evidence }),
      'regular_disputes_update'
    )

    const processingTime = Date.now() - startTime

    logger.info({
      event: LogEvents.EVIDENCE_SUBMITTED,
      disputeId,
      stripeDisputeId,
      status: 'regular_evidence_submitted',
      strength: evidenceResult.evidenceStrength,
      fieldsPopulated: evidenceResult.fieldsPopulated.length,
      processingTimeMs: processingTime,
    })

    await supabaseAdmin
      .from('disputes')
      .update({
        evidence_type: 'regular_10_4',
        evidence_submitted_at: new Date().toISOString(),
        evidence_submission_type: 'regular_auto',
      })
      .eq('id', disputeId)

    return {
      success: true,
      message: `Regular evidence submitted (${evidenceResult.evidenceStrength} strength, ${evidenceResult.fieldsPopulated.length} fields). ${evidenceResult.recommendations.length > 0 ? 'Tip: ' + evidenceResult.recommendations[0] : ''}`,
      strength: evidenceResult.evidenceStrength,
    }
  } catch (error: any) {
    logger.error({
      event: LogEvents.EVIDENCE_SUBMIT_FAILED,
      disputeId,
      stripeDisputeId,
      error: error.message,
      type: 'regular_evidence',
    })
    return {
      success: false,
      message: `Failed to submit regular evidence: ${error.message}`,
    }
  }
}

/**
 * Submit consumer dispute evidence (product not received / not as described).
 */
export async function submitConsumerEvidenceToStripe(
  disputeId: string,
  stripeDisputeId: string,
  merchantId?: string,
): Promise<{ success: boolean; message: string; strength?: string }> {
  const startTime = Date.now()
  try {
    const { data: disputeRecord } = await supabaseAdmin
      .from('disputes')
      .select('merchant_id')
      .eq('id', disputeId)
      .single()

    let stripeInstance = stripe
    const mid = merchantId || disputeRecord?.merchant_id
    if (mid) stripeInstance = await getMerchantStripe(mid)

    const result = await buildConsumerEvidence(disputeId, stripeInstance, mid)
    if (!result.eligible) {
      return { success: false, message: 'Could not build consumer evidence.', strength: 'weak' }
    }

    await withRetry(
      () => stripeInstance.disputes.update(stripeDisputeId, { evidence: result.evidenceFields }),
      'consumer_disputes_update',
    )

    await supabaseAdmin.from('disputes').update({
      evidence_type: 'consumer_evidence',
      evidence_submitted_at: new Date().toISOString(),
      evidence_submission_type: 'consumer_auto',
    }).eq('id', disputeId)

    logger.info({
      event: LogEvents.EVIDENCE_SUBMITTED,
      disputeId, stripeDisputeId,
      type: 'consumer_evidence',
      strength: result.evidenceStrength,
      processingTimeMs: Date.now() - startTime,
    })

    return {
      success: true,
      message: `Consumer evidence submitted (${result.evidenceStrength}, ${result.fieldsPopulated.length} fields).${result.recommendations[0] ? ' Tip: ' + result.recommendations[0] : ''}`,
      strength: result.evidenceStrength,
    }
  } catch (error: any) {
    logger.error({ event: LogEvents.EVIDENCE_SUBMIT_FAILED, disputeId, stripeDisputeId, error: error.message, type: 'consumer_evidence' })
    return { success: false, message: `Failed: ${error.message}` }
  }
}

/**
 * Submit authorization dispute evidence (unrecognized / unauthorized).
 */
export async function submitAuthorizationEvidenceToStripe(
  disputeId: string,
  stripeDisputeId: string,
  merchantId?: string,
): Promise<{ success: boolean; message: string; strength?: string }> {
  const startTime = Date.now()
  try {
    const { data: disputeRecord } = await supabaseAdmin
      .from('disputes')
      .select('merchant_id')
      .eq('id', disputeId)
      .single()

    let stripeInstance = stripe
    const mid = merchantId || disputeRecord?.merchant_id
    if (mid) stripeInstance = await getMerchantStripe(mid)

    const result = await buildAuthorizationEvidence(disputeId, stripeInstance, mid)
    if (!result.eligible) {
      return { success: false, message: 'Could not build authorization evidence.', strength: 'weak' }
    }

    await withRetry(
      () => stripeInstance.disputes.update(stripeDisputeId, { evidence: result.evidenceFields }),
      'auth_disputes_update',
    )

    await supabaseAdmin.from('disputes').update({
      evidence_type: 'auth_evidence',
      evidence_submitted_at: new Date().toISOString(),
      evidence_submission_type: 'auth_auto',
    }).eq('id', disputeId)

    logger.info({
      event: LogEvents.EVIDENCE_SUBMITTED,
      disputeId, stripeDisputeId,
      type: 'auth_evidence',
      strength: result.evidenceStrength,
      processingTimeMs: Date.now() - startTime,
    })

    return {
      success: true,
      message: `Authorization evidence submitted (${result.evidenceStrength}, ${result.fieldsPopulated.length} fields).${result.recommendations[0] ? ' Tip: ' + result.recommendations[0] : ''}`,
      strength: result.evidenceStrength,
    }
  } catch (error: any) {
    logger.error({ event: LogEvents.EVIDENCE_SUBMIT_FAILED, disputeId, stripeDisputeId, error: error.message, type: 'auth_evidence' })
    return { success: false, message: `Failed: ${error.message}` }
  }
}

/**
 * Submit processing error evidence (duplicate / subscription canceled / incorrect amount).
 */
export async function submitProcessingEvidenceToStripe(
  disputeId: string,
  stripeDisputeId: string,
  merchantId?: string,
): Promise<{ success: boolean; message: string; strength?: string }> {
  const startTime = Date.now()
  try {
    const { data: disputeRecord } = await supabaseAdmin
      .from('disputes')
      .select('merchant_id')
      .eq('id', disputeId)
      .single()

    let stripeInstance = stripe
    const mid = merchantId || disputeRecord?.merchant_id
    if (mid) stripeInstance = await getMerchantStripe(mid)

    const result = await buildProcessingErrorEvidence(disputeId, stripeInstance, mid)
    if (!result.eligible) {
      return { success: false, message: 'Could not build processing evidence.', strength: 'weak' }
    }

    await withRetry(
      () => stripeInstance.disputes.update(stripeDisputeId, { evidence: result.evidenceFields }),
      'processing_disputes_update',
    )

    await supabaseAdmin.from('disputes').update({
      evidence_type: 'processing_evidence',
      evidence_submitted_at: new Date().toISOString(),
      evidence_submission_type: 'processing_auto',
    }).eq('id', disputeId)

    logger.info({
      event: LogEvents.EVIDENCE_SUBMITTED,
      disputeId, stripeDisputeId,
      type: 'processing_evidence',
      strength: result.evidenceStrength,
      processingTimeMs: Date.now() - startTime,
    })

    return {
      success: true,
      message: `Processing evidence submitted (${result.evidenceStrength}, ${result.fieldsPopulated.length} fields).${result.recommendations[0] ? ' Tip: ' + result.recommendations[0] : ''}`,
      strength: result.evidenceStrength,
    }
  } catch (error: any) {
    logger.error({ event: LogEvents.EVIDENCE_SUBMIT_FAILED, disputeId, stripeDisputeId, error: error.message, type: 'processing_evidence' })
    return { success: false, message: `Failed: ${error.message}` }
  }
}

