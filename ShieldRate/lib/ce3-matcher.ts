import { supabaseAdmin } from './supabase'
import { stripe } from './stripe'
import type Stripe from 'stripe'

/**
 * CE 3.0 Historical Footprint Matcher
 * Finds 2 successful, undisputed charges from 120-365 days ago
 * with matching IP address or device fingerprint
 * 
 * Also supports Mastercard First-Party Trust logic
 */
export interface ComplianceChecklist {
  liabilityShiftEligible: boolean
  historicalMatchFound: boolean
  usageAuditAttached: boolean
  network: 'VISA' | 'MASTERCARD' | 'UNKNOWN'
  matchCount: number
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

/**
 * Check Mastercard First-Party Trust eligibility
 * Requires at least TWO of: Device ID, IP Address, or Shipping Address
 */
async function checkMastercardEligibility(
  disputeIpAddress: string | null,
  disputeDeviceFingerprint: string | null,
  transactions: any[]
): Promise<{ eligible: boolean; matchCount: number }> {
  let matchCount = 0
  
  // Count matching transactions
  const matches = transactions.filter((tx: { ip_address: string | null; device_fingerprint: string | null }) => {
    const ipMatch = disputeIpAddress && tx.ip_address === disputeIpAddress
    const deviceMatch = disputeDeviceFingerprint && tx.device_fingerprint === disputeDeviceFingerprint
    return ipMatch || deviceMatch
  })
  
  matchCount = matches.length
  
  // Mastercard requires at least 2 matches (Device ID OR IP Address)
  // For physical-digital hybrids, shipping address would be third factor
  return {
    eligible: matchCount >= 2,
    matchCount,
  }
}

export async function findCE3Matches(
  customerId: string,
  disputeIpAddress: string | null,
  disputeDeviceFingerprint: string | null,
  disputeChargeId: string,
  merchantId?: string,
  stripeClient?: Stripe
): Promise<CE3Match> {
  // Use provided Stripe client or fall back to global
  const stripeInstance = stripeClient || stripe
  
  // Get the disputed charge to find payment method fingerprint and card brand
  const disputeCharge = await stripeInstance.charges.retrieve(disputeChargeId)
  const paymentMethodFingerprint = disputeCharge.payment_method_details?.card?.fingerprint || null
  const cardBrand = disputeCharge.payment_method_details?.card?.brand?.toUpperCase() || 'UNKNOWN'
  const network = cardBrand === 'MASTERCARD' ? 'MASTERCARD' : cardBrand === 'VISA' ? 'VISA' : 'UNKNOWN'

  if (!paymentMethodFingerprint) {
    return { 
      matched: false, 
      matches: [], 
      complianceChecklist: {
        liabilityShiftEligible: false,
        historicalMatchFound: false,
        usageAuditAttached: false,
        network,
        matchCount: 0,
      }
    }
  }

  // Calculate date range: 120-365 days ago
  const now = new Date()
  const daysAgo365 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  const daysAgo120 = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)

  // Query for historical transactions with matching payment method fingerprint
  let query = supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('customer_id', customerId)
    .eq('payment_method_fingerprint', paymentMethodFingerprint)
    .eq('status', 'succeeded')
    .eq('disputed', false)
    .gte('created_at', daysAgo365.toISOString())
    .lte('created_at', daysAgo120.toISOString())
    .order('created_at', { ascending: false })
    .limit(10) // Get more candidates to filter
  
  // Filter by merchant_id if provided
  if (merchantId) {
    query = query.eq('merchant_id', merchantId)
  }
  
  const { data: transactions, error } = await query

  if (error || !transactions || transactions.length < 2) {
    return { 
      matched: false, 
      matches: [], 
      complianceChecklist: {
        liabilityShiftEligible: false,
        historicalMatchFound: false,
        usageAuditAttached: false,
        network,
        matchCount: 0,
      }
    }
  }

  // Apply network-specific matching logic
  let eligible = false
  let matchCount = 0

  if (network === 'MASTERCARD') {
    // Mastercard First-Party Trust: Requires at least 2 matches
    const mastercardResult = await checkMastercardEligibility(
      disputeIpAddress,
      disputeDeviceFingerprint,
      transactions
    )
    eligible = mastercardResult.eligible
    matchCount = mastercardResult.matchCount
  } else {
    // Visa CE 3.0: Requires 2+ matches with IP or device fingerprint
    const matches = transactions.filter((tx: { ip_address: string | null; device_fingerprint: string | null }) => {
      const ipMatch = disputeIpAddress && tx.ip_address === disputeIpAddress
      const deviceMatch = disputeDeviceFingerprint && 
                         tx.device_fingerprint === disputeDeviceFingerprint
      return ipMatch || deviceMatch
    })
    matchCount = matches.length
    eligible = matches.length >= 2
  }

  // Filter for IP or device fingerprint matches for return data
  const matches = transactions.filter((tx: { ip_address: string | null; device_fingerprint: string | null }) => {
    const ipMatch = disputeIpAddress && tx.ip_address === disputeIpAddress
    const deviceMatch = disputeDeviceFingerprint && 
                       tx.device_fingerprint === disputeDeviceFingerprint
    return ipMatch || deviceMatch
  })

  // Check for usage audit (activity logs within 48 hours)
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
      .select('id')
      .eq('customer_id', customerId)
      .gte('timestamp', hours48Ago.toISOString())
      .limit(1)
    
    usageAuditAttached = (recentActivity && recentActivity.length > 0) || false
  }

  if (eligible && matches.length >= 2) {
    const topMatches = matches.slice(0, 2).map((tx: { stripe_charge_id: string; created_at: string; ip_address: string | null; device_fingerprint: string | null }) => ({
      charge_id: tx.stripe_charge_id,
      created_at: new Date(tx.created_at),
      ip_address: tx.ip_address,
      device_fingerprint: tx.device_fingerprint,
    }))

    return {
      matched: true,
      matches: topMatches,
      complianceChecklist: {
        liabilityShiftEligible: true,
        historicalMatchFound: true,
        usageAuditAttached,
        network,
        matchCount: matches.length,
      },
    }
  }

  // Partial or no match
  return {
    matched: false,
    matches: matches.slice(0, 1).map((tx: { stripe_charge_id: string; created_at: string; ip_address: string | null; device_fingerprint: string | null }) => ({
      charge_id: tx.stripe_charge_id,
      created_at: new Date(tx.created_at),
      ip_address: tx.ip_address,
      device_fingerprint: tx.device_fingerprint,
    })),
    complianceChecklist: {
      liabilityShiftEligible: false,
      historicalMatchFound: matchCount > 0,
      usageAuditAttached,
      network,
      matchCount,
    },
  }
}

/**
 * Get compliance checklist (binary YES/NO instead of score)
 * Replaces the old calculateComplianceScore function
 * 
 * New signature: accepts customerId, merchantId, and Stripe client
 */
export async function getComplianceChecklist(
  customerId: string,
  merchantId: string,
  stripeClient: Stripe,
  disputeChargeId?: string,
  disputeIpAddress?: string | null,
  disputeDeviceFingerprint?: string | null
): Promise<ComplianceChecklist> {
  // If dispute details provided, use findCE3Matches
  if (disputeChargeId) {
    const ce3Match = await findCE3Matches(
      customerId,
      disputeIpAddress || null,
      disputeDeviceFingerprint || null,
      disputeChargeId,
      merchantId,
      stripeClient
    )
    return ce3Match.complianceChecklist
  }
  
  // Otherwise return default (no match)
  return {
    liabilityShiftEligible: false,
    historicalMatchFound: false,
    usageAuditAttached: false,
    network: 'UNKNOWN',
    matchCount: 0,
  }
}

