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
 * Check Mastercard First-Party Trust (FPT) eligibility
 * 
 * REQUIREMENTS:
 * - Must have 2+ historical transactions from 120-365 days ago
 * - Each transaction must match on TWO elements:
 *   1. Device ID/Fingerprint (required)
 *   2. User Account ID (customer_id) OR IP Address (either one)
 * 
 * This is stricter than Visa CE 3.0, which only requires IP OR Device match.
 * Mastercard FPT requires BOTH Device AND (Account OR IP) for each match.
 */
async function checkMastercardFPT(
  customerId: string,
  disputeIpAddress: string | null,
  disputeDeviceFingerprint: string | null,
  transactions: any[]
): Promise<{ eligible: boolean; matchCount: number; matches: any[] }> {
  if (!disputeDeviceFingerprint) {
    // Mastercard FPT requires device fingerprint - cannot proceed without it
    return {
      eligible: false,
      matchCount: 0,
      matches: [],
    }
  }

  // Filter transactions that match BOTH:
  // 1. Device fingerprint (required)
  // 2. Customer ID (always matches since we're querying by customer) OR IP Address
  const matches = transactions.filter((tx: {
    device_fingerprint: string | null
    ip_address: string | null
    customer_id: string
  }) => {
    // Device fingerprint MUST match
    const deviceMatch = tx.device_fingerprint === disputeDeviceFingerprint
    
    if (!deviceMatch) {
      return false
    }
    
    // Additionally, must match on either:
    // - Customer ID (always true since we filter by customer, but explicit for clarity)
    // - IP Address (if provided)
    const customerMatch = tx.customer_id === customerId
    const ipMatch = disputeIpAddress && tx.ip_address === disputeIpAddress
    
    // Return true if device matches AND (customer matches OR IP matches)
    return deviceMatch && (customerMatch || ipMatch)
  })
  
  const matchCount = matches.length
  
  // Mastercard FPT requires at least 2 matches with BOTH elements
  return {
    eligible: matchCount >= 2,
    matchCount,
    matches: matches.slice(0, 2), // Return top 2 for evidence
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
  // SCALABILITY: Check cache first (CE3 matches don't change frequently)
  // Note: Cache key includes customerId and merchantId, but not disputeChargeId
  // because we're matching historical transactions, not the dispute itself
  const { getCache, CacheKeys, CacheTTL } = await import('./cache')
  const cacheKey = CacheKeys.ce3Match(customerId, merchantId)
  const cached = await getCache<CE3Match>(cacheKey, { ttl: CacheTTL.ce3Match })
  
  if (cached) {
    return cached
  }

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
  let matchedTransactions: any[] = []

  if (network === 'MASTERCARD') {
    // Mastercard First-Party Trust: Requires Device ID AND (Account ID or IP)
    const mastercardResult = await checkMastercardFPT(
      customerId,
      disputeIpAddress,
      disputeDeviceFingerprint,
      transactions
    )
    eligible = mastercardResult.eligible
    matchCount = mastercardResult.matchCount
    matchedTransactions = mastercardResult.matches
  } else {
    // Visa CE 3.0: Requires 2+ matches with IP OR device fingerprint (either one)
    const matches = transactions.filter((tx: { ip_address: string | null; device_fingerprint: string | null }) => {
      const ipMatch = disputeIpAddress && tx.ip_address === disputeIpAddress
      const deviceMatch = disputeDeviceFingerprint && 
                         tx.device_fingerprint === disputeDeviceFingerprint
      return ipMatch || deviceMatch
    })
    matchCount = matches.length
    eligible = matches.length >= 2
    matchedTransactions = matches.slice(0, 2)
  }

  // Check for usage audit (activity logs within 48 hours)
  // For Mastercard, emphasize "Service Delivery" evidence
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
    
    // Get activity logs for "Service Delivery" evidence (critical for Mastercard)
    const { data: recentActivity } = await supabaseAdmin
      .from('user_activity_logs')
      .select('action_type, action_description, timestamp')
      .eq('customer_id', customerId)
      .gte('timestamp', hours48Ago.toISOString())
      .order('timestamp', { ascending: false })
      .limit(20) // Get more for Mastercard evidence
    
    // For Mastercard, prioritize "Service Delivery" actions:
    // - login, export_data, api_call, feature_usage, subscription_upgrade, seat_added
    if (network === 'MASTERCARD' && recentActivity) {
      const serviceDeliveryActions = recentActivity.filter((log: any) => {
        const actionType = log.action_type?.toLowerCase() || ''
        return ['login', 'export_data', 'api_call', 'feature_usage', 'subscription_upgrade', 'seat_added'].includes(actionType)
      })
      usageAuditAttached = serviceDeliveryActions.length > 0
    } else {
      // For Visa or unknown, any activity counts
      usageAuditAttached = (recentActivity && recentActivity.length > 0) || false
    }
  }

  if (eligible && matchedTransactions.length >= 2) {
    const topMatches = matchedTransactions.slice(0, 2).map((tx: { stripe_charge_id: string; created_at: string; ip_address: string | null; device_fingerprint: string | null }) => ({
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
        matchCount: matchedTransactions.length,
      },
    }
  }

  // Partial or no match
  return {
    matched: false,
    matches: matchedTransactions.slice(0, 1).map((tx: { stripe_charge_id: string; created_at: string; ip_address: string | null; device_fingerprint: string | null }) => ({
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

