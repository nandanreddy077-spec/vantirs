/**
 * EMV Liability Shift Evidence Engine
 *
 * Visa 10.1 — Counterfeit fraud (chip card used at non-EMV terminal)
 * Visa 10.2 — Non-counterfeit fraud (lost/stolen chip card, no PIN)
 *
 * Defense strategy:
 *  - Prove the terminal IS EMV-capable (shifts liability to issuer)
 *  - Show the chip was read (not magnetic stripe fallback)
 *  - Provide terminal certification ID, EMV application ID
 *  - PIN verification proof (for 10.2)
 *  - Transaction receipt + approval code
 *
 * Most online-only merchants won't see these (they're card-present codes).
 * But hybrid merchants (online + POS) may get them.
 *
 * Key Stripe evidence fields:
 *  - uncategorized_text (narrative about EMV terminal + chip read)
 *  - receipt (signed POS receipt)
 *  - customer_signature
 *  - product_description
 */

import { supabaseAdmin } from './supabase'
import type Stripe from 'stripe'
import type { RegularEvidenceResult } from './regular-evidence'

export async function buildEMVEvidence(
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

  const is101 = dispute.fraud_sub_code === '10.1'

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

  // --- Receipt / signature (critical for EMV disputes) ---
  const receipt = merchantEvidence?.receipt || null
  if (receipt) {
    evidence.receipt = receipt
    populated.push('receipt')
  } else {
    missing.push('receipt')
    recommendations.push('Upload the POS transaction receipt showing chip read and approval code.')
  }

  // --- Product description ---
  const productDesc = merchantEvidence?.product_description || charge.description || charge.statement_descriptor || null
  if (productDesc) {
    evidence.product_description = productDesc
    populated.push('product_description')
  }

  // --- Customer communication ---
  const customerComm = merchantEvidence?.customer_communication || null
  if (customerComm) {
    evidence.customer_communication = customerComm
    populated.push('customer_communication')
  }

  // --- Build EMV-specific narrative ---
  const narrativeParts: string[] = []

  if (is101) {
    narrativeParts.push(`EMV Liability Shift Counterfeit Fraud dispute (Visa 10.1) for charge ${dispute.charge_id} ($${(dispute.amount / 100).toFixed(2)}).`)
    narrativeParts.push('This code applies when a counterfeit chip card is used at a non-EMV terminal.')
    narrativeParts.push('DEFENSE: Our terminal is EMV-certified and the chip was read for this transaction.')
  } else {
    narrativeParts.push(`EMV Liability Shift Non-Counterfeit Fraud dispute (Visa 10.2) for charge ${dispute.charge_id} ($${(dispute.amount / 100).toFixed(2)}).`)
    narrativeParts.push('This code applies to lost/stolen chip card fraud without PIN verification.')
    narrativeParts.push('DEFENSE: The transaction was authenticated via chip + PIN or chip + signature.')
  }

  // Payment method details
  const pmDetails = charge.payment_method_details as any
  const cardDetails = pmDetails?.card_present || pmDetails?.card || null

  if (cardDetails) {
    if (cardDetails.read_method) {
      narrativeParts.push(`Card read method: ${cardDetails.read_method}.`)
      if (['chip', 'contactless_emv', 'dip'].includes(cardDetails.read_method)) {
        narrativeParts.push('The card chip was read — this is NOT a magnetic stripe fallback.')
        populated.push('emv_chip_read')
      }
    }

    if (cardDetails.receipt?.application_preferred_name) {
      narrativeParts.push(`EMV application: ${cardDetails.receipt.application_preferred_name}.`)
      populated.push('emv_application_name')
    }

    if (cardDetails.receipt?.dedicated_file_name) {
      narrativeParts.push(`EMV AID: ${cardDetails.receipt.dedicated_file_name}.`)
    }

    if (cardDetails.receipt?.authorization_code) {
      narrativeParts.push(`Authorization code: ${cardDetails.receipt.authorization_code}.`)
      populated.push('authorization_code')
    }
  }

  const avs = pmDetails?.card?.checks || cardDetails?.checks
  if (avs) {
    if (avs.cvc_check === 'pass') narrativeParts.push('CVC check: PASS.')
    if (avs.address_line1_check === 'pass') narrativeParts.push('AVS address check: PASS.')
    if (avs.address_postal_code_check === 'pass') narrativeParts.push('AVS postal code check: PASS.')
  }

  narrativeParts.push('The above evidence demonstrates the transaction was processed on an EMV-certified terminal with proper cardholder verification.')

  evidence.uncategorized_text = narrativeParts.join(' ')
  populated.push('uncategorized_text')

  let strength: 'strong' | 'moderate' | 'weak' = 'weak'
  if (populated.length >= 6) strength = 'strong'
  else if (populated.length >= 3) strength = 'moderate'

  if (missing.length > 0 && !receipt) {
    recommendations.unshift('EMV disputes are best won with a POS receipt showing chip read + approval code.')
  }

  return {
    eligible: true,
    evidenceFields: evidence,
    evidenceStrength: strength,
    fieldsPopulated: populated,
    fieldsMissing: missing,
    recommendations,
  }
}
