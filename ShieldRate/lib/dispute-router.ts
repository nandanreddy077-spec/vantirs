/**
 * Dispute Router
 *
 * Classifies incoming disputes and decides which evidence strategy to use.
 * Now with full Visa fraud sub-code awareness (10.1–10.5):
 *
 *  10.1  EMV counterfeit   → emv_evidence (terminal/chip proof)
 *  10.2  EMV non-counterfeit → emv_evidence (PIN + auth proof)
 *  10.3  Card present fraud → card_present_evidence (receipt + signature)
 *  10.4  CNP fraud          → CE 3.0 (add-on) or regular_10_4
 *  10.5  VFMP               → skip (Visa accepts no evidence)
 *
 * Non-fraud categories handled by dedicated engines:
 *  authorization, consumer, processing_error
 */

import { findCE3Matches, CE3Match } from './ce3-matcher'
import { supabaseAdmin } from './supabase'
import { logger } from './logger'
import type Stripe from 'stripe'

export type DisputeCategory =
  | 'fraud_10_4'        // Visa 10.4 CNP fraud
  | 'fraud_10_1'        // EMV liability shift – counterfeit
  | 'fraud_10_2'        // EMV liability shift – non-counterfeit
  | 'fraud_10_3'        // Card present fraud
  | 'fraud_10_5'        // Visa Fraud Monitoring Program (no recourse)
  | 'fraud_other'       // Generic fraud (no network code)
  | 'authorization'     // Unrecognized / unauthorized
  | 'processing_error'  // Duplicate, incorrect amount, etc.
  | 'consumer'          // Product not received, not as described
  | 'unknown'

export type FraudSubCode = '10.1' | '10.2' | '10.3' | '10.4' | '10.5' | null

/**
 * Mastercard reason codes mapped to Vantirs dispute categories.
 * MC uses 4-digit codes vs Visa's dotted notation.
 */
export type MastercardCategory = 'mc_fraud' | 'mc_cardholder' | 'mc_processing' | 'mc_authorization' | null

const MC_FRAUD_CODES = ['4837', '4840', '4849', '4863', '4870', '4871']
const MC_CARDHOLDER_CODES = ['4853', '4854', '4855', '4857', '4858', '4859', '4860']
const MC_PROCESSING_CODES = ['4831', '4834', '4842', '4846']
const MC_AUTHORIZATION_CODES = ['4807', '4808', '4812']

export type EvidenceRoute =
  | 'ce3_auto'            // Full CE 3.0 forensic PDF
  | 'regular_10_4'        // Template evidence for 10.4 CNP fraud
  | 'emv_evidence'        // EMV liability shift proof (10.1/10.2)
  | 'card_present_evidence' // Card-present fraud proof (10.3)
  | 'consumer_evidence'   // Shipping/delivery/product evidence
  | 'auth_evidence'       // Authorization/unrecognized evidence
  | 'processing_evidence' // Duplicate/cancellation/amount evidence
  | 'manual'              // Queued for manual merchant action
  | 'skip'                // Not worth fighting (10.5, etc.)

export interface RoutingDecision {
  category: DisputeCategory
  route: EvidenceRoute
  fraudSubCode: FraudSubCode
  ce3Match?: CE3Match
  reason: string
}

const STRIPE_FRAUD_REASON = 'fraudulent'

const STRIPE_PRODUCT_REASONS = ['product_not_received', 'product_unacceptable']
const STRIPE_AUTH_REASONS = ['unrecognized', 'unauthorized']
const STRIPE_PROCESSING_REASONS = ['duplicate', 'incorrect_amount', 'subscription_canceled']

/**
 * Extract the Visa network reason code from a Stripe Dispute object.
 * Returns values like "10.1", "10.4", "13.1" or null.
 */
export function getNetworkReasonCode(dispute: Stripe.Dispute): string | null {
  return (dispute as any).payment_method_details?.card?.network_reason_code ?? null
}

/**
 * Derive the fraud sub-code from the network reason code (Visa dotted format).
 */
export function deriveFraudSubCode(networkReasonCode: string | null): FraudSubCode {
  if (!networkReasonCode) return null
  const code = networkReasonCode.trim()
  if (code === '10.1') return '10.1'
  if (code === '10.2') return '10.2'
  if (code === '10.3') return '10.3'
  if (code === '10.4') return '10.4'
  if (code === '10.5') return '10.5'
  return null
}

/**
 * Classify Mastercard reason code into a dispute category.
 * MC codes are 4 digits (e.g. "4837", "4853").
 */
export function classifyMastercardCode(networkReasonCode: string | null): MastercardCategory {
  if (!networkReasonCode) return null
  const code = networkReasonCode.trim()
  if (MC_FRAUD_CODES.includes(code)) return 'mc_fraud'
  if (MC_CARDHOLDER_CODES.includes(code)) return 'mc_cardholder'
  if (MC_PROCESSING_CODES.includes(code)) return 'mc_processing'
  if (MC_AUTHORIZATION_CODES.includes(code)) return 'mc_authorization'
  return null
}

/**
 * Detect if a network reason code is Mastercard (4-digit) vs Visa (dotted).
 */
export function detectNetwork(networkReasonCode: string | null): 'visa' | 'mastercard' | 'unknown' {
  if (!networkReasonCode) return 'unknown'
  const code = networkReasonCode.trim()
  if (code.includes('.')) return 'visa'
  if (/^\d{4}$/.test(code)) return 'mastercard'
  return 'unknown'
}

/**
 * Classify a dispute into a category using Stripe's high-level reason,
 * Visa fraud sub-codes, AND Mastercard 4-digit reason codes.
 */
export function classifyDispute(
  stripeReason: string,
  fraudSubCode: FraudSubCode = null,
  networkReasonCode: string | null = null,
): DisputeCategory {
  // First check Mastercard codes — they map directly to categories
  if (networkReasonCode) {
    const mcCategory = classifyMastercardCode(networkReasonCode)
    if (mcCategory) {
      switch (mcCategory) {
        case 'mc_fraud': return 'fraud_10_4'  // MC fraud → CNP fraud evidence (most MC fraud is CNP)
        case 'mc_cardholder': return 'consumer'
        case 'mc_processing': return 'processing_error'
        case 'mc_authorization': return 'authorization'
      }
    }
  }

  if (stripeReason !== STRIPE_FRAUD_REASON) {
    if (STRIPE_AUTH_REASONS.includes(stripeReason)) return 'authorization'
    if (STRIPE_PROCESSING_REASONS.includes(stripeReason)) return 'processing_error'
    if (STRIPE_PRODUCT_REASONS.includes(stripeReason)) return 'consumer'
    return 'unknown'
  }

  // It's a fraud dispute — use Visa sub-code when available
  switch (fraudSubCode) {
    case '10.1': return 'fraud_10_1'
    case '10.2': return 'fraud_10_2'
    case '10.3': return 'fraud_10_3'
    case '10.4': return 'fraud_10_4'
    case '10.5': return 'fraud_10_5'
    default:     return 'fraud_10_4' // default to 10.4 (most common CNP)
  }
}

/**
 * Route a dispute to the appropriate evidence engine.
 */
export async function routeDispute(
  dispute: Stripe.Dispute,
  merchantId: string,
  charge: Stripe.Charge,
  stripeClient: Stripe,
): Promise<RoutingDecision> {
  const networkCode = getNetworkReasonCode(dispute)
  const fraudSubCode = deriveFraudSubCode(networkCode)
  const network = detectNetwork(networkCode)
  const category = classifyDispute(dispute.reason || 'fraudulent', fraudSubCode, networkCode)

  // All features are free — CE 3.0 is always enabled
  const hasCE3 = true

  // --- 10.5: Visa Fraud Monitoring Program — no recourse, Visa rejects all evidence ---
  if (category === 'fraud_10_5') {
    return {
      category,
      fraudSubCode,
      route: 'skip',
      reason: 'Visa Fraud Monitoring Program (10.5) — Visa does not accept evidence for these disputes. Auto-skipped.',
    }
  }

  // --- 10.1 / 10.2: EMV liability shift (chip terminal disputes) ---
  if (category === 'fraud_10_1' || category === 'fraud_10_2') {
    return {
      category,
      fraudSubCode,
      route: 'emv_evidence',
      reason: `EMV liability shift dispute (${fraudSubCode}) — using terminal certification + chip transaction proof.`,
    }
  }

  // --- 10.3: Card-present fraud ---
  if (category === 'fraud_10_3') {
    return {
      category,
      fraudSubCode,
      route: 'card_present_evidence',
      reason: 'Card-present fraud (10.3) — using signed receipt + in-person verification evidence.',
    }
  }

  // --- 10.4: CNP fraud (our core product) ---
  if (category === 'fraud_10_4') {
    if (hasCE3) {
      try {
        const customerId = charge.customer as string
        if (!customerId) {
          return {
            category,
            fraudSubCode,
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
            fraudSubCode,
            route: 'ce3_auto',
            ce3Match: ce3Result,
            reason: `CE 3.0 eligible: ${ce3Result.matches.length} historical matches.`,
          }
        }
        return {
          category,
          fraudSubCode,
          route: 'regular_10_4',
          ce3Match: ce3Result,
          reason: `CE 3.0 ineligible (${ce3Result.complianceChecklist.ineligibilityReasons?.join(', ') || 'insufficient matches'}). Using regular 10.4 evidence.`,
        }
      } catch (err: any) {
        logger.error({ event: 'CE3_MATCHING_FAILED', error: err?.message, disputeId: dispute.id })
        return {
          category,
          fraudSubCode,
          route: 'regular_10_4',
          reason: 'CE 3.0 matching error — using regular 10.4 evidence.',
        }
      }
    }

    return {
      category,
      fraudSubCode,
      route: 'regular_10_4',
      reason: 'Fraud 10.4 dispute — using regular evidence.',
    }
  }

  // --- Non-fraud categories ---
  if (category === 'authorization') {
    return { category, fraudSubCode, route: 'auth_evidence', reason: 'Authorization/unrecognized dispute.' }
  }
  if (category === 'consumer') {
    return { category, fraudSubCode, route: 'consumer_evidence', reason: 'Consumer dispute — shipping/delivery/product evidence.' }
  }
  if (category === 'processing_error') {
    return { category, fraudSubCode, route: 'processing_evidence', reason: 'Processing error dispute.' }
  }

  // fraud_other / unknown fallback
  return {
    category,
    fraudSubCode,
    route: 'regular_10_4',
    reason: `${category} dispute — using regular fraud evidence.`,
  }
}
