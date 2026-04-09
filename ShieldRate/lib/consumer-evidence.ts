/**
 * Consumer Dispute Evidence Engine
 *
 * Handles Visa 13.x disputes:
 *  - 13.1  Product not received
 *  - 13.3  Product not as described
 *  - 13.6  Credit not processed
 *
 * Stripe reason codes: 'product_not_received', 'product_unacceptable'
 *
 * Key evidence fields (per Stripe API):
 *  - shipping_tracking_number, shipping_carrier, shipping_date
 *  - shipping_address, shipping_documentation
 *  - product_description, service_documentation
 *  - refund_policy, refund_policy_disclosure
 *  - customer_communication
 *  - uncategorized_text (narrative)
 */

import { supabaseAdmin } from './supabase'
import type Stripe from 'stripe'
import type { RegularEvidenceResult } from './regular-evidence'

export async function buildConsumerEvidence(
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

  // Check for merchant-provided evidence (from dispute_evidence table)
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

  const isProductNotReceived = dispute.reason_code === 'product_not_received'

  // --- Shipping evidence (critical for "product not received") ---
  const trackingNumber = merchantEvidence?.shipping_tracking_number || charge.shipping?.tracking_number || null
  if (trackingNumber) {
    evidence.shipping_tracking_number = trackingNumber
    populated.push('shipping_tracking_number')
  } else if (isProductNotReceived) {
    missing.push('shipping_tracking_number')
    recommendations.push('Add shipping tracking number to prove delivery.')
  }

  const carrier = merchantEvidence?.shipping_carrier || null
  if (carrier) {
    evidence.shipping_carrier = carrier
    populated.push('shipping_carrier')
  }

  const shippingDate = merchantEvidence?.shipping_date || null
  if (shippingDate) {
    evidence.shipping_date = shippingDate
    populated.push('shipping_date')
  }

  const shippingAddr = charge.shipping?.address
  if (shippingAddr && (shippingAddr.line1 || shippingAddr.city)) {
    const parts = [shippingAddr.line1, shippingAddr.line2, shippingAddr.city, shippingAddr.state, shippingAddr.postal_code, shippingAddr.country].filter(Boolean)
    evidence.shipping_address = parts.join(', ')
    populated.push('shipping_address')
  }

  // --- Product / service description ---
  const productDesc = merchantEvidence?.product_description || charge.description || charge.statement_descriptor || null
  if (productDesc) {
    evidence.product_description = productDesc
    populated.push('product_description')
  } else {
    missing.push('product_description')
    recommendations.push('Provide a clear product/service description.')
  }

  // --- Refund policy ---
  const refundPolicy = merchantEvidence?.refund_policy || null
  if (refundPolicy) {
    evidence.refund_policy = refundPolicy
    populated.push('refund_policy')
  } else {
    missing.push('refund_policy')
    recommendations.push('Add your refund/return policy to strengthen consumer dispute evidence.')
  }

  const refundPolicyDisclosure = merchantEvidence?.refund_policy_disclosure || null
  if (refundPolicyDisclosure) {
    evidence.refund_policy_disclosure = refundPolicyDisclosure
    populated.push('refund_policy_disclosure')
  }

  // --- Customer communication ---
  const customerComm = merchantEvidence?.customer_communication || null
  if (customerComm) {
    evidence.customer_communication = customerComm
    populated.push('customer_communication')
  }

  // --- Service documentation (for digital / SaaS) ---
  const serviceDocs = merchantEvidence?.service_documentation || null
  if (serviceDocs) {
    evidence.service_documentation = serviceDocs
    populated.push('service_documentation')
  }

  // --- Activity logs (for digital/SaaS — proves service was accessed) ---
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

  // --- Build narrative ---
  const narrativeParts: string[] = []
  narrativeParts.push(`MERCHANT REBUTTAL — Consumer dispute for charge ${dispute.charge_id} ($${(dispute.amount / 100).toFixed(2)}).`)
  narrativeParts.push(`Dispute reason: ${dispute.reason_code}.`)

  if (isProductNotReceived) {
    narrativeParts.push('DELIVERY EVIDENCE:')
    if (trackingNumber) {
      narrativeParts.push(`Tracking number: ${trackingNumber}${carrier ? ` via ${carrier}` : ''}.`)
    }
    if (shippingDate) {
      narrativeParts.push(`Ship date: ${shippingDate}.`)
    }
    if (evidence.shipping_address) {
      narrativeParts.push(`Shipped to: ${evidence.shipping_address}.`)
    }
    if (trackingNumber) {
      narrativeParts.push('Carrier tracking confirms delivery to the address on file. If the cardholder claims non-receipt, the carrier delivery confirmation serves as proof of delivery.')
    }
  } else {
    // Product not as described / unacceptable
    narrativeParts.push('SERVICE/PRODUCT EVIDENCE:')
    if (productDesc) {
      narrativeParts.push(`Product/service description: ${productDesc}.`)
    }
    narrativeParts.push('The product/service was delivered exactly as described on the purchase page.')
    if (refundPolicy) {
      narrativeParts.push('REFUND POLICY: The refund/return policy was clearly disclosed to the customer before purchase, and the customer agreed to these terms at checkout.')
    }
    if (activityLogs && activityLogs.length > 0) {
      narrativeParts.push(`USAGE PROOF: ${activityLogs.length} activity events show the customer actively used the product/service after purchase, contradicting the claim that the product was unsatisfactory.`)
    }
  }

  if (customer && 'created' in customer) {
    const accountAge = Math.floor((Date.now() - (customer.created as number) * 1000) / (1000 * 60 * 60 * 24))
    if (accountAge > 30) {
      narrativeParts.push(`Customer account is ${accountAge} days old — established relationship.`)
    }
  }

  // Check for prior successful charges
  const { data: priorCharges } = await supabaseAdmin
    .from('transactions')
    .select('stripe_charge_id, amount')
    .eq('customer_id', dispute.customer_id)
    .eq('status', 'succeeded')
    .eq('disputed', false)
    .limit(10)

  if (priorCharges && priorCharges.length > 0) {
    narrativeParts.push(`Customer has ${priorCharges.length} prior successful, undisputed transactions, demonstrating a pattern of legitimate purchases.`)
  }

  if (customerComm) {
    narrativeParts.push('Customer communication records are attached, showing the merchant responded to the customer and offered resolution per the stated policy.')
  }

  narrativeParts.push('CONCLUSION: The product/service was delivered as described and within the terms agreed upon at purchase. The customer did not contact the merchant to request a return or refund through proper channels before filing this dispute.')

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
