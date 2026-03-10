/**
 * Authorization Dispute Evidence Engine
 *
 * Handles Visa 11.x disputes:
 *  - 11.3  No authorization
 *  - 11.6  Unrecognized transaction
 *
 * Stripe reason codes: 'unrecognized', 'unauthorized'
 *
 * The cardholder says "I didn't authorize this" or "I don't recognize this."
 * Best evidence: prove the cardholder did authorize and can recognize the charge.
 *
 * Key evidence fields:
 *  - customer_name, customer_email_address, customer_purchase_ip
 *  - billing_address (AVS match)
 *  - product_description (helps cardholder recognize)
 *  - receipt (shows what was purchased)
 *  - customer_communication
 *  - access_activity_log
 *  - uncategorized_text (narrative about AVS, 3DS, descriptor)
 */

import { supabaseAdmin } from './supabase'
import type Stripe from 'stripe'
import type { RegularEvidenceResult } from './regular-evidence'

export async function buildAuthorizationEvidence(
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
  } else {
    missing.push('customer_email_address')
  }

  if (customer && 'name' in customer && customer.name) {
    evidence.customer_name = customer.name
    populated.push('customer_name')
  } else if (charge.billing_details?.name) {
    evidence.customer_name = charge.billing_details.name
    populated.push('customer_name')
  }

  // --- IP ---
  const ip = charge.metadata?.ip_address || null
  if (ip) {
    evidence.customer_purchase_ip = ip
    populated.push('customer_purchase_ip')
  } else {
    missing.push('customer_purchase_ip')
    recommendations.push('Pass customer IP in charge.metadata.ip_address to prove cardholder session.')
  }

  // --- Billing address (AVS proof) ---
  const billing = charge.billing_details?.address
  if (billing && (billing.line1 || billing.city)) {
    const parts = [billing.line1, billing.line2, billing.city, billing.state, billing.postal_code, billing.country].filter(Boolean)
    evidence.billing_address = parts.join(', ')
    populated.push('billing_address')
  }

  // --- Product description (helps cardholder recognize the charge) ---
  const description = merchantEvidence?.product_description || charge.description || charge.statement_descriptor || null
  if (description) {
    evidence.product_description = description
    populated.push('product_description')
  } else {
    missing.push('product_description')
    recommendations.push('Add product description so the cardholder can recognize the charge.')
  }

  // --- Receipt ---
  const receipt = merchantEvidence?.receipt || null
  if (receipt) {
    evidence.receipt = receipt
    populated.push('receipt')
  }

  // --- Customer communication ---
  const customerComm = merchantEvidence?.customer_communication || null
  if (customerComm) {
    evidence.customer_communication = customerComm
    populated.push('customer_communication')
  }

  // --- Activity logs ---
  const { data: activityLogs } = await supabaseAdmin
    .from('user_activity_logs')
    .select('action_type, timestamp, ip_address')
    .eq('customer_id', dispute.customer_id)
    .order('timestamp', { ascending: false })
    .limit(30)

  if (activityLogs && activityLogs.length > 0) {
    const logLines = activityLogs.map((log: any) =>
      `${new Date(log.timestamp).toISOString()} | ${log.action_type} | IP: ${log.ip_address || 'N/A'}`
    )
    evidence.access_activity_log = logLines.join('\n')
    populated.push('access_activity_log')
  }

  // --- Build narrative (focus on "cardholder authorized this") ---
  const narrativeParts: string[] = []
  narrativeParts.push(`Authorization dispute for charge ${dispute.charge_id} ($${(dispute.amount / 100).toFixed(2)}).`)
  narrativeParts.push(`Dispute reason: ${dispute.reason_code}.`)

  // Statement descriptor — key for "unrecognized"
  const descriptor = charge.statement_descriptor || charge.calculated_statement_descriptor || null
  if (descriptor) {
    narrativeParts.push(`Statement descriptor: "${descriptor}" — this is what appears on the cardholder's bank statement.`)
  }

  const avs = (charge.payment_method_details as any)?.card?.checks
  if (avs) {
    if (avs.address_line1_check === 'pass') narrativeParts.push('AVS address check: PASS.')
    if (avs.address_postal_code_check === 'pass') narrativeParts.push('AVS postal code check: PASS.')
    if (avs.cvc_check === 'pass') narrativeParts.push('CVC check: PASS — cardholder had physical card.')
  }

  const threeDSecure = (charge.payment_method_details as any)?.card?.three_d_secure
  if (threeDSecure) {
    narrativeParts.push(`3D Secure: ${threeDSecure.result || 'attempted'} (v${threeDSecure.version || '?'}) — cardholder passed bank authentication.`)
  }

  if (ip) narrativeParts.push(`Purchase originated from IP: ${ip}.`)

  if (customer && 'created' in customer) {
    const accountAge = Math.floor((Date.now() - (customer.created as number) * 1000) / (1000 * 60 * 60 * 24))
    if (accountAge > 14) {
      narrativeParts.push(`Customer account is ${accountAge} days old with an established history.`)
    }
  }

  if (activityLogs && activityLogs.length > 0) {
    narrativeParts.push(`${activityLogs.length} activity events confirm active usage by this customer.`)
  }

  narrativeParts.push('The above evidence demonstrates that the cardholder authorized this transaction.')

  evidence.uncategorized_text = narrativeParts.join(' ')
  populated.push('uncategorized_text')

  let strength: 'strong' | 'moderate' | 'weak' = 'weak'
  if (populated.length >= 7) strength = 'strong'
  else if (populated.length >= 4) strength = 'moderate'

  return {
    eligible: true,
    evidenceFields: evidence,
    evidenceStrength: strength,
    fieldsPopulated: populated,
    fieldsMissing: missing,
    recommendations,
  }
}
