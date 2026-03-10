/**
 * Processing Error Dispute Evidence Engine
 *
 * Handles Visa 12.x disputes:
 *  - 12.5  Incorrect amount
 *  - 12.6  Duplicate processing
 *  - subscription_canceled (Stripe catch-all for "I canceled but was still charged")
 *
 * Stripe reason codes: 'duplicate', 'incorrect_amount', 'subscription_canceled'
 *
 * Key evidence fields:
 *  - duplicate_charge_documentation, duplicate_charge_explanation
 *  - duplicate_charge_id (Stripe charge ID of the "other" charge)
 *  - cancellation_policy, cancellation_policy_disclosure, cancellation_rebuttal
 *  - refund_policy, refund_policy_disclosure
 *  - product_description, service_documentation
 *  - customer_communication
 *  - uncategorized_text
 */

import { supabaseAdmin } from './supabase'
import type Stripe from 'stripe'
import type { RegularEvidenceResult } from './regular-evidence'

export async function buildProcessingErrorEvidence(
  disputeId: string,
  stripeClient: Stripe,
  merchantId?: string,
): Promise<RegularEvidenceResult> {
  const { data: dispute } = await supabaseAdmin
    .from('disputes')
    .select('*')
    .eq('id', disputeId)
    .single()

  if (!dispute) {
    return {
      eligible: false,
      evidenceFields: {},
      evidenceStrength: 'weak',
      fieldsPopulated: [],
      fieldsMissing: ['dispute_not_found'],
      recommendations: ['Dispute not found in database.'],
    }
  }

  const charge = await stripeClient.charges.retrieve(dispute.charge_id)
  const customer = charge.customer
    ? await stripeClient.customers.retrieve(charge.customer as string)
    : null

  const evidence: Stripe.DisputeUpdateParams.Evidence = {}
  const populated: string[] = []
  const missing: string[] = []
  const recommendations: string[] = []

  const { data: merchantEvidence } = await supabaseAdmin
    .from('dispute_evidence')
    .select('*')
    .eq('dispute_id', disputeId)
    .single()

  // --- Customer identity ---
  if (customer && 'email' in customer && customer.email) {
    evidence.customer_email_address = customer.email
    populated.push('customer_email_address')
  } else if (charge.billing_details?.email || charge.receipt_email) {
    evidence.customer_email_address = charge.billing_details?.email || charge.receipt_email || undefined
    if (evidence.customer_email_address) populated.push('customer_email_address')
  }

  if (customer && 'name' in customer && customer.name) {
    evidence.customer_name = customer.name
    populated.push('customer_name')
  } else if (charge.billing_details?.name) {
    evidence.customer_name = charge.billing_details.name
    populated.push('customer_name')
  }

  const isDuplicate = dispute.reason_code === 'duplicate'
  const isCancellation = dispute.reason_code === 'subscription_canceled'
  const isIncorrectAmount = dispute.reason_code === 'incorrect_amount'

  // --- Duplicate charge evidence ---
  if (isDuplicate) {
    const explanation = merchantEvidence?.duplicate_charge_explanation || null
    if (explanation) {
      evidence.duplicate_charge_explanation = explanation
      populated.push('duplicate_charge_explanation')
    } else {
      missing.push('duplicate_charge_explanation')
      recommendations.push('Explain why this is NOT a duplicate (e.g. different product, period, invoice).')
    }

    const otherChargeId = merchantEvidence?.duplicate_charge_id || null
    if (otherChargeId) {
      evidence.duplicate_charge_id = otherChargeId
      populated.push('duplicate_charge_id')
    }
  }

  // --- Cancellation evidence ---
  if (isCancellation) {
    const cancelPolicy = merchantEvidence?.cancellation_policy || null
    if (cancelPolicy) {
      evidence.cancellation_policy = cancelPolicy
      populated.push('cancellation_policy')
    } else {
      missing.push('cancellation_policy')
      recommendations.push('Add your cancellation policy to prove the charge was within terms.')
    }

    const cancelDisclosure = merchantEvidence?.cancellation_policy_disclosure || null
    if (cancelDisclosure) {
      evidence.cancellation_policy_disclosure = cancelDisclosure
      populated.push('cancellation_policy_disclosure')
    }

    const cancelRebuttal = merchantEvidence?.cancellation_rebuttal || null
    if (cancelRebuttal) {
      evidence.cancellation_rebuttal = cancelRebuttal
      populated.push('cancellation_rebuttal')
    } else {
      missing.push('cancellation_rebuttal')
      recommendations.push('Explain why the charge was valid (e.g. cancellation was after billing date, customer used service).')
    }
  }

  // --- Incorrect amount ---
  if (isIncorrectAmount) {
    const refundPolicy = merchantEvidence?.refund_policy || null
    if (refundPolicy) {
      evidence.refund_policy = refundPolicy
      populated.push('refund_policy')
    }
  }

  // --- Product / service description ---
  const productDesc = merchantEvidence?.product_description || charge.description || charge.statement_descriptor || null
  if (productDesc) {
    evidence.product_description = productDesc
    populated.push('product_description')
  }

  // --- Service documentation ---
  const serviceDocs = merchantEvidence?.service_documentation || null
  if (serviceDocs) {
    evidence.service_documentation = serviceDocs
    populated.push('service_documentation')
  }

  // --- Customer communication ---
  const customerComm = merchantEvidence?.customer_communication || null
  if (customerComm) {
    evidence.customer_communication = customerComm
    populated.push('customer_communication')
  }

  // --- Build narrative ---
  const narrativeParts: string[] = []
  narrativeParts.push(`Processing dispute for charge ${dispute.charge_id} ($${(dispute.amount / 100).toFixed(2)}).`)
  narrativeParts.push(`Dispute reason: ${dispute.reason_code}.`)

  if (isDuplicate) {
    narrativeParts.push('This charge is NOT a duplicate.')
    if (merchantEvidence?.duplicate_charge_explanation) {
      narrativeParts.push(merchantEvidence.duplicate_charge_explanation)
    }
  }

  if (isCancellation) {
    narrativeParts.push('The charge was processed within the terms of the subscription agreement.')
    if (merchantEvidence?.cancellation_rebuttal) {
      narrativeParts.push(merchantEvidence.cancellation_rebuttal)
    }
  }

  if (isIncorrectAmount) {
    narrativeParts.push('The charged amount matches the agreed-upon price for the product/service.')
    if (productDesc) {
      narrativeParts.push(`Product/service: ${productDesc}.`)
    }
  }

  if (customer && 'created' in customer) {
    const accountAge = Math.floor((Date.now() - (customer.created as number) * 1000) / (1000 * 60 * 60 * 24))
    if (accountAge > 14) {
      narrativeParts.push(`Customer account age: ${accountAge} days.`)
    }
  }

  narrativeParts.push('The above evidence demonstrates the transaction was processed correctly.')

  evidence.uncategorized_text = narrativeParts.join(' ')
  populated.push('uncategorized_text')

  let strength: 'strong' | 'moderate' | 'weak' = 'weak'
  if (populated.length >= 6) strength = 'strong'
  else if (populated.length >= 3) strength = 'moderate'

  return {
    eligible: true,
    evidenceFields: evidence,
    evidenceStrength: strength,
    fieldsPopulated: populated,
    fieldsMissing: missing,
    recommendations,
  }
}
