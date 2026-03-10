/**
 * Dispute Router
 *
 * Classifies incoming disputes and decides which evidence strategy to use:
 *
 *  1. CE 3.0 auto-path  — merchant has CE 3.0 add-on AND dispute qualifies
 *  2. Regular 10.4 path — any fraud/10.4 dispute (all merchants)
 *  3. Manual path       — non-fraud disputes, or fallback
 *
 * The router never submits evidence; it only returns the routing decision.
 */

import { findCE3Matches, CE3Match } from './ce3-matcher'
import { supabaseAdmin } from './supabase'
import { logger } from './logger'
import type Stripe from 'stripe'

export type DisputeCategory =
  | 'fraud_10_4'        // Visa 10.4 / Mastercard fraud — core target
  | 'fraud_other'       // Other fraud reason codes
  | 'authorization'     // Unrecognized / unauthorized
  | 'processing_error'  // Duplicate, incorrect amount, etc.
  | 'consumer'          // Product not received, not as described
  | 'unknown'

export type EvidenceRoute =
  | 'ce3_auto'           // Full CE 3.0 forensic PDF + auto-submit
  | 'regular_10_4'       // Template evidence for fraud disputes
  | 'consumer_evidence'  // Shipping/delivery/product evidence
  | 'auth_evidence'      // Authorization/unrecognized evidence
  | 'processing_evidence'// Duplicate/cancellation/amount evidence
  | 'manual'             // Queued for manual merchant action
  | 'skip'               // Not worth fighting

export interface RoutingDecision {
  category: DisputeCategory
  route: EvidenceRoute
  ce3Match?: CE3Match
  reason: string
}

const STRIPE_FRAUD_REASON = 'fraudulent'
const STRIPE_UNRECOGNIZED_REASON = 'unrecognized'

const STRIPE_PRODUCT_REASONS = ['product_not_received', 'product_unacceptable']
const STRIPE_AUTH_REASONS = ['unrecognized', 'unauthorized']
const STRIPE_PROCESSING_REASONS = ['duplicate', 'incorrect_amount', 'subscription_canceled']

export function classifyDispute(stripeReason: string): DisputeCategory {
  if (stripeReason === STRIPE_FRAUD_REASON) return 'fraud_10_4'
  if (STRIPE_AUTH_REASONS.includes(stripeReason)) return 'authorization'
  if (STRIPE_PROCESSING_REASONS.includes(stripeReason)) return 'processing_error'
  if (STRIPE_PRODUCT_REASONS.includes(stripeReason)) return 'consumer'
  return 'fraud_other'
}

/**
 * Route a dispute to the appropriate evidence path.
 * @param dispute - Stripe Dispute object (dispute.charge is the charge id)
 * @param merchantId - Merchant ID
 * @param charge - Stripe Charge object (for customer, metadata.ip_address, metadata.device_fingerprint)
 * @param stripeClient - Stripe client (for CE 3.0 matching)
 */
export async function routeDispute(
  dispute: Stripe.Dispute,
  merchantId: string,
  charge: Stripe.Charge,
  stripeClient: Stripe,
): Promise<RoutingDecision> {
  const category = classifyDispute(dispute.reason || 'fraudulent')

  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('ce3_addon, plan')
    .eq('id', merchantId)
    .single()

  const hasCE3 = merchant?.ce3_addon === true

  if (category === 'fraud_10_4') {
    if (hasCE3) {
      try {
        const customerId = charge.customer as string
        if (!customerId) {
          return {
            category,
            route: 'regular_10_4',
            reason: 'No customer on charge — using regular 10.4 evidence.',
          }
        }
        const ce3Result = await findCE3Matches(
          customerId,
          charge.metadata?.ip_address || null,
          charge.metadata?.device_fingerprint || null,
          dispute.charge as string,
          merchantId,
          stripeClient,
          dispute.reason || 'fraudulent',
        )
        if (ce3Result.matched && ce3Result.complianceChecklist.liabilityShiftEligible) {
          return {
            category,
            route: 'ce3_auto',
            ce3Match: ce3Result,
            reason: `CE 3.0 eligible: ${ce3Result.matches.length} historical matches with consistent identifiers.`,
          }
        }
        return {
          category,
          route: 'regular_10_4',
          ce3Match: ce3Result,
          reason: `CE 3.0 ineligible (${ce3Result.complianceChecklist.ineligibilityReasons?.join(', ') || 'insufficient matches'}). Using regular 10.4 evidence.`,
        }
      } catch (err: any) {
        logger.error({ event: 'CE3_MATCHING_FAILED', error: err?.message, disputeId: dispute.id })
        return {
          category,
          route: 'regular_10_4',
          reason: 'CE 3.0 matching error — using regular 10.4 evidence.',
        }
      }
    }

    // No CE 3.0 add-on → regular 10.4 path
    return {
      category,
      route: 'regular_10_4',
      reason: 'Fraud 10.4 dispute. CE 3.0 add-on not enabled — using regular evidence.',
    }
  }

  if (category === 'authorization') {
    return {
      category,
      route: 'auth_evidence',
      reason: 'Authorization/unrecognized dispute — using AVS/3DS/descriptor evidence.',
    }
  }

  if (category === 'consumer') {
    return {
      category,
      route: 'consumer_evidence',
      reason: 'Consumer dispute — using shipping/delivery/product evidence.',
    }
  }

  if (category === 'processing_error') {
    return {
      category,
      route: 'processing_evidence',
      reason: 'Processing error dispute — using duplicate/cancellation/amount evidence.',
    }
  }

  // fraud_other, unknown — best effort with regular fraud evidence
  return {
    category,
    route: 'regular_10_4',
    reason: `${category} dispute — using regular fraud evidence.`,
  }
}
