import { supabaseAdmin } from './supabase'
import { stripe } from './stripe'
import type Stripe from 'stripe'
import { logger } from './logger'

/**
 * CE 3.0 Historical Footprint Matcher (Visa CE 3.0 Rulebook-Aligned)
 *
 * Visa CE 3.0 eligibility requires ALL of:
 *  - Visa card-not-present transaction
 *  - Reason code 10.4 (Fraud – Card Absent Environment)
 *  - 2 historical transactions from 120–365 days before the DISPUTED CHARGE date
 *  - Same payment method (PAN / card fingerprint)
 *  - Fully paid, never disputed, no fraud reports
 *  - At least 1 identifier (IP, device fingerprint, device ID) matching consistently
 *    across all three transactions (disputed + both historical)
 *  - First 6 characters of billing descriptor identical across all three
 *  - Each historical transaction has a unique ARN
 *
 * Also supports Mastercard First-Party Trust logic.
 */

export interface ComplianceChecklist {
  liabilityShiftEligible: boolean
  historicalMatchFound: boolean
  usageAuditAttached: boolean
  network: 'VISA' | 'MASTERCARD' | 'UNKNOWN'
  matchCount: number
  reasonCodeEligible: boolean
  billingDescriptorMatch: boolean
  identifierConsistent: boolean
  ineligibilityReasons: string[]
}

export interface CE3Match {
  matched: boolean
  matches: Array<{
    charge_id: string
    created_at: Date
    ip_address: string | null
    device_fingerprint: string | null
  }>
  complianceChecklist: ComplianceChecklist
}

const VISA_CE3_REASON_CODE = 'fraudulent'

function makeIneligibleResult(
  network: 'VISA' | 'MASTERCARD' | 'UNKNOWN',
  reasons: string[],
  partialMatches: any[] = [],
  usageAuditAttached = false,
): CE3Match {
  return {
    matched: false,
    matches: partialMatches.slice(0, 1).map(mapTxToMatch),
    complianceChecklist: {
      liabilityShiftEligible: false,
      historicalMatchFound: partialMatches.length > 0,
      usageAuditAttached,
      network,
      matchCount: partialMatches.length,
      reasonCodeEligible: !reasons.includes('reason_code_not_10.4'),
      billingDescriptorMatch: !reasons.includes('billing_descriptor_mismatch'),
      identifierConsistent: !reasons.includes('no_consistent_identifier'),
      ineligibilityReasons: reasons,
    },
  }
}

function mapTxToMatch(tx: any) {
  return {
    charge_id: tx.stripe_charge_id,
    created_at: new Date(tx.created_at),
    ip_address: tx.ip_address,
    device_fingerprint: tx.device_fingerprint,
  }
}

/**
 * Check Mastercard First-Party Trust (FPT) eligibility
 *
 * Stricter than Visa CE 3.0:
 *  - Device fingerprint required on all three
 *  - Additionally: customer ID or IP must also match
 */
function checkMastercardFPT(
  customerId: string,
  disputeIpAddress: string | null,
  disputeDeviceFingerprint: string | null,
  transactions: any[]
): { eligible: boolean; matchCount: number; matches: any[] } {
  if (!disputeDeviceFingerprint) {
    return { eligible: false, matchCount: 0, matches: [] }
  }

  const matches = transactions.filter((tx: any) => {
    const deviceMatch = tx.device_fingerprint === disputeDeviceFingerprint
    if (!deviceMatch) return false
    const customerMatch = tx.customer_id === customerId
    const ipMatch = disputeIpAddress && tx.ip_address === disputeIpAddress
    return customerMatch || Boolean(ipMatch)
  })

  return {
    eligible: matches.length >= 2,
    matchCount: matches.length,
    matches: matches.slice(0, 2),
  }
}

/**
 * Visa CE 3.0: Find 2 historical transactions where the SAME identifier type
 * (IP or device fingerprint) matches consistently across the disputed charge
 * AND both historical charges.
 *
 * Returns separate groups per identifier type so we can pick the best pair
 * that satisfies the three-way consistency rule.
 */
function findConsistentVisaMatches(
  disputeIpAddress: string | null,
  disputeDeviceFingerprint: string | null,
  transactions: any[]
): { matches: any[]; identifierUsed: 'ip' | 'device' | null } {
  // Try IP-based consistency first (all 3 share same IP)
  if (disputeIpAddress) {
    const ipMatches = transactions.filter(
      (tx: any) => tx.ip_address === disputeIpAddress
    )
    if (ipMatches.length >= 2) {
      return { matches: ipMatches.slice(0, 2), identifierUsed: 'ip' }
    }
  }

  // Try device-fingerprint-based consistency (all 3 share same device FP)
  if (disputeDeviceFingerprint) {
    const deviceMatches = transactions.filter(
      (tx: any) => tx.device_fingerprint === disputeDeviceFingerprint
    )
    if (deviceMatches.length >= 2) {
      return { matches: deviceMatches.slice(0, 2), identifierUsed: 'device' }
    }
  }

  // No consistent identifier across all 3
  const anyMatches = transactions.filter((tx: any) => {
    const ipMatch = disputeIpAddress && tx.ip_address === disputeIpAddress
    const deviceMatch = disputeDeviceFingerprint && tx.device_fingerprint === disputeDeviceFingerprint
    return ipMatch || deviceMatch
  })
  return { matches: anyMatches.slice(0, 2), identifierUsed: null }
}

/**
 * Enforce the billing-descriptor "first 6" rule.
 * Returns true only when the first 6 chars of all three descriptors are identical.
 */
function checkBillingDescriptorFirst6(
  disputeDescriptor: string | null,
  match1Descriptor: string | null,
  match2Descriptor: string | null,
): boolean {
  if (!disputeDescriptor) return false
  const d = disputeDescriptor.substring(0, 6).toUpperCase()
  const m1 = (match1Descriptor || '').substring(0, 6).toUpperCase()
  const m2 = (match2Descriptor || '').substring(0, 6).toUpperCase()
  return d.length >= 1 && d === m1 && d === m2
}

export async function findCE3Matches(
  customerId: string,
  disputeIpAddress: string | null,
  disputeDeviceFingerprint: string | null,
  disputeChargeId: string,
  merchantId?: string,
  stripeClient?: Stripe,
  disputeReasonCode?: string | null,
): Promise<CE3Match> {
  const { getCache, CacheKeys, CacheTTL } = await import('./cache')
  const cacheKey = CacheKeys.ce3Match(customerId, merchantId)
  const cached = await getCache<CE3Match>(cacheKey, { ttl: CacheTTL.ce3Match })
  if (cached) return cached

  const stripeInstance = stripeClient || stripe

  // Retrieve disputed charge for card fingerprint, brand, descriptor, and date
  const disputeCharge = await stripeInstance.charges.retrieve(disputeChargeId)
  const paymentMethodFingerprint = disputeCharge.payment_method_details?.card?.fingerprint || null
  const cardBrand = disputeCharge.payment_method_details?.card?.brand?.toUpperCase() || 'UNKNOWN'
  const network: 'VISA' | 'MASTERCARD' | 'UNKNOWN' =
    cardBrand === 'MASTERCARD' ? 'MASTERCARD' : cardBrand === 'VISA' ? 'VISA' : 'UNKNOWN'
  const disputeDescriptor = disputeCharge.description || disputeCharge.statement_descriptor || null

  // Date of the disputed charge (Visa calculates window from dispute date, which is
  // practically the charge date; Stripe provides charge.created)
  const chargeDate = new Date(disputeCharge.created * 1000)

  if (!paymentMethodFingerprint) {
    return makeIneligibleResult(network, ['no_payment_method_fingerprint'])
  }

  // --- Visa-specific pre-checks ---
  if (network === 'VISA') {
    // CE 3.0 only applies to reason code 10.4 (Stripe maps this to "fraudulent")
    const reasonCode = disputeReasonCode ?? null
    if (reasonCode && reasonCode !== VISA_CE3_REASON_CODE) {
      logger.info({
        event: 'CE3_REASON_CODE_INELIGIBLE',
        disputeChargeId,
        reasonCode,
        expected: VISA_CE3_REASON_CODE,
      })
      return makeIneligibleResult(network, ['reason_code_not_10.4'])
    }
  }

  // Calculate 120–365 day window relative to the disputed CHARGE date
  const daysAgo365 = new Date(chargeDate.getTime() - 365 * 24 * 60 * 60 * 1000)
  const daysAgo120 = new Date(chargeDate.getTime() - 120 * 24 * 60 * 60 * 1000)

  let query = supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('customer_id', customerId)
    .eq('payment_method_fingerprint', paymentMethodFingerprint)
    .eq('status', 'succeeded')
    .eq('disputed', false)
    .gt('amount', 0) // exclude validation / zero-dollar charges
    .gte('created_at', daysAgo365.toISOString())
    .lte('created_at', daysAgo120.toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  if (merchantId) {
    query = query.eq('merchant_id', merchantId)
  }

  const { data: transactions, error } = await query

  if (error || !transactions || transactions.length < 2) {
    return makeIneligibleResult(network, ['insufficient_historical_transactions'])
  }

  // --- Network-specific matching ---
  let eligible = false
  let matchCount = 0
  let matchedTransactions: any[] = []
  const ineligibilityReasons: string[] = []
  let identifierConsistent = false
  let billingDescriptorMatch = false

  if (network === 'MASTERCARD') {
    const result = checkMastercardFPT(customerId, disputeIpAddress, disputeDeviceFingerprint, transactions)
    eligible = result.eligible
    matchCount = result.matchCount
    matchedTransactions = result.matches
    identifierConsistent = eligible
    // Mastercard doesn't enforce billing descriptor first-6 in the same way
    billingDescriptorMatch = true
  } else {
    // Visa CE 3.0: three-way identifier consistency
    const { matches, identifierUsed } = findConsistentVisaMatches(
      disputeIpAddress, disputeDeviceFingerprint, transactions
    )
    matchCount = matches.length
    matchedTransactions = matches
    identifierConsistent = identifierUsed !== null && matches.length >= 2

    if (!identifierConsistent) {
      ineligibilityReasons.push('no_consistent_identifier')
    }

    // Billing descriptor first-6 rule
    if (matchedTransactions.length >= 2) {
      billingDescriptorMatch = checkBillingDescriptorFirst6(
        disputeDescriptor,
        matchedTransactions[0]?.description || null,
        matchedTransactions[1]?.description || null,
      )
      if (!billingDescriptorMatch) {
        ineligibilityReasons.push('billing_descriptor_mismatch')
      }
    }

    // Only eligible when BOTH checks pass
    eligible = identifierConsistent && billingDescriptorMatch && matchedTransactions.length >= 2
  }

  // --- Usage audit (48h activity logs) ---
  let disputeQuery = supabaseAdmin
    .from('disputes')
    .select('created_at')
    .eq('charge_id', disputeChargeId)
  if (merchantId) {
    disputeQuery = disputeQuery.eq('merchant_id', merchantId)
  }
  const { data: dispute } = await disputeQuery.single()

  let usageAuditAttached = false
  if (dispute) {
    const disputeDate = new Date(dispute.created_at)
    const hours48Ago = new Date(disputeDate.getTime() - 48 * 60 * 60 * 1000)

    const { data: recentActivity } = await supabaseAdmin
      .from('user_activity_logs')
      .select('action_type, action_description, timestamp')
      .eq('customer_id', customerId)
      .gte('timestamp', hours48Ago.toISOString())
      .order('timestamp', { ascending: false })
      .limit(20)

    if (network === 'MASTERCARD' && recentActivity) {
      const serviceDeliveryActions = recentActivity.filter((log: any) => {
        const actionType = log.action_type?.toLowerCase() || ''
        return ['login', 'export_data', 'api_call', 'feature_usage', 'subscription_upgrade', 'seat_added'].includes(actionType)
      })
      usageAuditAttached = serviceDeliveryActions.length > 0
    } else {
      usageAuditAttached = (recentActivity && recentActivity.length > 0) || false
    }
  }

  // --- Build result ---
  if (eligible && matchedTransactions.length >= 2) {
    const topMatches = matchedTransactions.slice(0, 2).map(mapTxToMatch)
    return {
      matched: true,
      matches: topMatches,
      complianceChecklist: {
        liabilityShiftEligible: true,
        historicalMatchFound: true,
        usageAuditAttached,
        network,
        matchCount: matchedTransactions.length,
        reasonCodeEligible: true,
        billingDescriptorMatch,
        identifierConsistent,
        ineligibilityReasons: [],
      },
    }
  }

  return makeIneligibleResult(network, ineligibilityReasons, matchedTransactions, usageAuditAttached)
}

/**
 * Get compliance checklist (binary YES/NO)
 */
export async function getComplianceChecklist(
  customerId: string,
  merchantId: string,
  stripeClient: Stripe,
  disputeChargeId?: string,
  disputeIpAddress?: string | null,
  disputeDeviceFingerprint?: string | null,
  disputeReasonCode?: string | null,
): Promise<ComplianceChecklist> {
  if (disputeChargeId) {
    const ce3Match = await findCE3Matches(
      customerId,
      disputeIpAddress || null,
      disputeDeviceFingerprint || null,
      disputeChargeId,
      merchantId,
      stripeClient,
      disputeReasonCode,
    )
    return ce3Match.complianceChecklist
  }

  return {
    liabilityShiftEligible: false,
    historicalMatchFound: false,
    usageAuditAttached: false,
    network: 'UNKNOWN',
    matchCount: 0,
    reasonCodeEligible: false,
    billingDescriptorMatch: false,
    identifierConsistent: false,
    ineligibilityReasons: ['no_dispute_charge_provided'],
  }
}

