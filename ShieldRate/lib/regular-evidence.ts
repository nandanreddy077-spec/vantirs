/**
 * Regular 10.4 Evidence Engine
 *
 * For 10.4 (fraud – card absent) disputes that do NOT qualify for CE 3.0,
 * build the strongest possible evidence using available data:
 *  - Customer account history (login, profile, activity)
 *  - Transaction metadata (IP, device, billing, shipping)
 *  - Delivery / service proof
 *  - AVS / 3DS results from the charge
 *  - Communication history
 *
 * This is the "base product" — every 10.4 gets this. CE 3.0 is the add-on
 * that layers forensic matching on top when eligible.
 */

import { supabaseAdmin } from './supabase'
import type Stripe from 'stripe'

export interface RegularEvidenceResult {
  eligible: boolean
  evidenceFields: Stripe.DisputeUpdateParams.Evidence
  evidenceStrength: 'strong' | 'moderate' | 'weak'
  fieldsPopulated: string[]
  fieldsMissing: string[]
  recommendations: string[]
}

/**
 * Visa reason code 10.4 maps to Stripe reason "fraudulent".
 * For 10.4, the key Stripe evidence fields are:
 *  - customer_name, customer_email_address, customer_purchase_ip
 *  - customer_signature (or equivalent proof)
 *  - uncategorized_text (narrative)
 *  - uncategorized_file (PDF)
 *  - billing_address, shipping_address, shipping_date, shipping_tracking_number
 *  - access_activity_log, product_description
 */
export async function buildRegular104Evidence(
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

  // --- Customer identity ---
  if (customer && 'email' in customer && customer.email) {
    evidence.customer_email_address = customer.email
    populated.push('customer_email_address')
  } else if (charge.billing_details?.email || charge.receipt_email) {
    evidence.customer_email_address = charge.billing_details?.email || charge.receipt_email || undefined
    if (evidence.customer_email_address) populated.push('customer_email_address')
  } else {
    missing.push('customer_email_address')
    recommendations.push('Collect customer email on charges for stronger evidence.')
  }

  if (customer && 'name' in customer && customer.name) {
    evidence.customer_name = customer.name
    populated.push('customer_name')
  } else if (charge.billing_details?.name) {
    evidence.customer_name = charge.billing_details.name
    populated.push('customer_name')
  } else {
    missing.push('customer_name')
  }

  // --- IP address ---
  const ip = charge.metadata?.ip_address || null
  if (ip) {
    evidence.customer_purchase_ip = ip
    populated.push('customer_purchase_ip')
  } else {
    missing.push('customer_purchase_ip')
    recommendations.push('Pass customer IP in charge.metadata.ip_address for stronger fraud evidence.')
  }

  // --- Billing address ---
  const billing = charge.billing_details?.address
  if (billing && (billing.line1 || billing.city)) {
    const parts = [billing.line1, billing.line2, billing.city, billing.state, billing.postal_code, billing.country].filter(Boolean)
    evidence.billing_address = parts.join(', ')
    populated.push('billing_address')
  } else {
    missing.push('billing_address')
  }

  // --- Shipping (if available from charge metadata) ---
  const shippingAddress = charge.shipping?.address
  if (shippingAddress && (shippingAddress.line1 || shippingAddress.city)) {
    const parts = [shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.state, shippingAddress.postal_code, shippingAddress.country].filter(Boolean)
    evidence.shipping_address = parts.join(', ')
    populated.push('shipping_address')
  }

  if (charge.shipping?.tracking_number) {
    evidence.shipping_tracking_number = charge.shipping.tracking_number
    populated.push('shipping_tracking_number')
  }

  // --- Product / service description ---
  const description = charge.description || charge.statement_descriptor || null
  if (description) {
    evidence.product_description = description
    populated.push('product_description')
  }

  // --- Activity logs (access_activity_log) ---
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
  } else {
    missing.push('access_activity_log')
    recommendations.push('Track user activity via /api/track to build stronger usage evidence.')
  }

  // --- Build narrative (uncategorized_text) ---
  const narrativeParts: string[] = []

  narrativeParts.push(`Dispute for charge ${dispute.charge_id} (amount: $${(dispute.amount / 100).toFixed(2)}).`)

  if (customer && 'created' in customer) {
    const accountAge = Math.floor((Date.now() - (customer.created as number) * 1000) / (1000 * 60 * 60 * 24))
    narrativeParts.push(`Customer account age: ${accountAge} days.`)
    if (accountAge > 30) {
      narrativeParts.push('This is an established customer with a history on the platform.')
    }
  }

  if (ip) {
    narrativeParts.push(`Purchase IP: ${ip}.`)
  }

  if (activityLogs && activityLogs.length > 0) {
    narrativeParts.push(`${activityLogs.length} activity events recorded for this customer, demonstrating active product usage.`)
  }

  // Check for prior successful charges (repeat customer evidence)
  const { data: priorCharges } = await supabaseAdmin
    .from('transactions')
    .select('stripe_charge_id, amount, created_at')
    .eq('customer_id', dispute.customer_id)
    .eq('status', 'succeeded')
    .eq('disputed', false)
    .order('created_at', { ascending: false })
    .limit(10)

  if (priorCharges && priorCharges.length > 0) {
    narrativeParts.push(`Customer has ${priorCharges.length} prior successful, undisputed transactions with this merchant, indicating a legitimate, recurring relationship.`)
  }

  const avs = (charge.payment_method_details as any)?.card?.checks
  if (avs) {
    if (avs.address_line1_check === 'pass') narrativeParts.push('AVS address check: PASS.')
    if (avs.address_postal_code_check === 'pass') narrativeParts.push('AVS postal code check: PASS.')
    if (avs.cvc_check === 'pass') narrativeParts.push('CVC check: PASS.')
  }

  const threeDSecure = (charge.payment_method_details as any)?.card?.three_d_secure
  if (threeDSecure) {
    narrativeParts.push(`3D Secure: ${threeDSecure.result || 'attempted'} (version: ${threeDSecure.version || 'unknown'}).`)
  }

  narrativeParts.push('Based on the above evidence, this transaction was authorized by the cardholder.')

  evidence.uncategorized_text = narrativeParts.join(' ')
  populated.push('uncategorized_text')

  // --- Determine strength ---
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
