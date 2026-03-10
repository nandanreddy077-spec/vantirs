/**
 * Card-Present Fraud Evidence Engine
 *
 * Visa 10.3 — Other Fraud, Card Present Environment
 * The cardholder denies making an in-person transaction.
 *
 * Defense strategy:
 *  - Signed receipt / customer signature
 *  - POS transaction log with timestamp
 *  - CCTV or surveillance reference (merchant-provided)
 *  - AVS / chip read proof
 *  - Product description, delivery confirmation
 *  - Customer communication
 *
 * Key Stripe evidence fields:
 *  - customer_signature (uploaded file ID)
 *  - receipt (POS receipt)
 *  - uncategorized_text (narrative)
 *  - product_description
 *  - billing_address
 */

import { supabaseAdmin } from './supabase'
import type Stripe from 'stripe'
import type { RegularEvidenceResult } from './regular-evidence'

export async function buildCardPresentEvidence(
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
  } else if (charge.billing_details?.email) {
    evidence.customer_email_address = charge.billing_details.email
    populated.push('customer_email_address')
  }

  if (customer && 'name' in customer && customer.name) {
    evidence.customer_name = customer.name
    populated.push('customer_name')
  } else if (charge.billing_details?.name) {
    evidence.customer_name = charge.billing_details.name
    populated.push('customer_name')
  }

  // --- Billing address ---
  const billing = charge.billing_details?.address
  if (billing && (billing.line1 || billing.city)) {
    const parts = [billing.line1, billing.line2, billing.city, billing.state, billing.postal_code, billing.country].filter(Boolean)
    evidence.billing_address = parts.join(', ')
    populated.push('billing_address')
  }

  // --- Receipt (critical for card-present) ---
  const receipt = merchantEvidence?.receipt || null
  if (receipt) {
    evidence.receipt = receipt
    populated.push('receipt')
  } else {
    missing.push('receipt')
    recommendations.push('Upload the signed POS receipt — this is the single most important piece of evidence for card-present fraud.')
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

  // --- Service documentation (CCTV reference, etc.) ---
  const serviceDocs = merchantEvidence?.service_documentation || null
  if (serviceDocs) {
    evidence.service_documentation = serviceDocs
    populated.push('service_documentation')
  }

  // --- Build narrative ---
  const narrativeParts: string[] = []
  narrativeParts.push(`Card-present fraud dispute (Visa 10.3) for charge ${dispute.charge_id} ($${(dispute.amount / 100).toFixed(2)}).`)
  narrativeParts.push('The cardholder denies making this in-person transaction.')

  const pmDetails = charge.payment_method_details as any
  const cardDetails = pmDetails?.card_present || pmDetails?.card || null

  if (cardDetails?.read_method) {
    narrativeParts.push(`Card read method: ${cardDetails.read_method}.`)
    if (['chip', 'contactless_emv', 'dip', 'contactless_magstripe_mode'].includes(cardDetails.read_method)) {
      narrativeParts.push('Card was physically presented at the terminal.')
    }
  }

  if (cardDetails?.receipt?.authorization_code) {
    narrativeParts.push(`Authorization code: ${cardDetails.receipt.authorization_code} — confirms real-time approval.`)
    populated.push('authorization_code')
  }

  const avs = pmDetails?.card?.checks || cardDetails?.checks
  if (avs) {
    if (avs.cvc_check === 'pass') narrativeParts.push('CVC check: PASS — cardholder had physical card.')
  }

  if (receipt) {
    narrativeParts.push('A signed POS receipt is attached as evidence.')
  }

  if (serviceDocs) {
    narrativeParts.push('Additional documentation (e.g. surveillance records) is attached.')
  }

  if (customer && 'created' in customer) {
    const accountAge = Math.floor((Date.now() - (customer.created as number) * 1000) / (1000 * 60 * 60 * 24))
    if (accountAge > 14) {
      narrativeParts.push(`Customer account age: ${accountAge} days — established relationship.`)
    }
  }

  narrativeParts.push('Based on the above evidence, the cardholder was physically present and completed this transaction at our location.')

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
