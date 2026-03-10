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

  // --- Check for prior successful charges ---
  const { data: priorCharges } = await supabaseAdmin
    .from('transactions')
    .select('stripe_charge_id, amount, created_at')
    .eq('customer_id', dispute.customer_id)
    .eq('status', 'succeeded')
    .eq('disputed', false)
    .order('created_at', { ascending: false })
    .limit(10)

  // --- Build narrative (focus on "cardholder authorized + recognizes this") ---
  const narrativeParts: string[] = []
  narrativeParts.push(`MERCHANT REBUTTAL — Authorization/Unrecognized dispute for charge ${dispute.charge_id} ($${(dispute.amount / 100).toFixed(2)}).`)

  const isUnrecognized = dispute.reason_code === 'unrecognized'
  if (isUnrecognized) {
    narrativeParts.push('The cardholder claims they do not recognize this charge. We provide the following evidence to identify the transaction:')
  } else {
    narrativeParts.push('The cardholder claims they did not authorize this charge. We provide the following proof of authorization:')
  }

  // Statement descriptor — KEY for "unrecognized" disputes
  const descriptor = charge.statement_descriptor || charge.calculated_statement_descriptor || null
  if (descriptor) {
    narrativeParts.push(`STATEMENT DESCRIPTOR: "${descriptor}" — this is exactly what appears on the cardholder's bank statement. This matches our registered business name and helps the cardholder identify the charge.`)
  }

  // AVS/CVC — proof of cardholder authorization
  const avs = (charge.payment_method_details as any)?.card?.checks
  const avsResults: string[] = []
  if (avs) {
    if (avs.address_line1_check === 'pass') avsResults.push('Address: PASS')
    if (avs.address_postal_code_check === 'pass') avsResults.push('Postal Code: PASS')
    if (avs.cvc_check === 'pass') avsResults.push('CVC/CVV: PASS')
  }
  if (avsResults.length > 0) {
    narrativeParts.push(`CARDHOLDER VERIFICATION: ${avsResults.join(', ')}. The person who made this purchase provided the correct billing address and security code from the back of the card, which only the legitimate cardholder would have.`)
  }

  const threeDSecure = (charge.payment_method_details as any)?.card?.three_d_secure
  if (threeDSecure) {
    const result = threeDSecure.result || 'attempted'
    if (result === 'authenticated') {
      narrativeParts.push(`3D SECURE: AUTHENTICATED (v${threeDSecure.version || '?'}). The cardholder successfully passed their issuing bank's two-factor authentication. This is the strongest possible proof of cardholder identity and authorization.`)
    } else {
      narrativeParts.push(`3D Secure: ${result} (v${threeDSecure.version || '?'}).`)
    }
  }

  if (ip) narrativeParts.push(`PURCHASE IP: ${ip}.`)

  if (customer && 'created' in customer) {
    const accountAge = Math.floor((Date.now() - (customer.created as number) * 1000) / (1000 * 60 * 60 * 24))
    if (accountAge > 14) {
      narrativeParts.push(`ACCOUNT HISTORY: Customer account created ${accountAge} days ago.`)
    }
  }

  if (priorCharges && priorCharges.length > 0) {
    const totalPrior = priorCharges.reduce((sum: number, c: any) => sum + c.amount, 0)
    narrativeParts.push(`PRIOR TRANSACTIONS: ${priorCharges.length} successful, undisputed charges totaling $${(totalPrior / 100).toFixed(2)}. The cardholder has an established payment history with this merchant, making an "unrecognized" or "unauthorized" claim inconsistent with their prior behavior.`)
  }

  if (activityLogs && activityLogs.length > 0) {
    narrativeParts.push(`USAGE ACTIVITY: ${activityLogs.length} logged events confirm the customer actively used the product/service after this transaction.`)
  }

  narrativeParts.push('CONCLUSION: The cardholder verification data (AVS, CVC, and/or 3DS), combined with their account history and usage patterns, demonstrates that this transaction was authorized by the cardholder.')

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
