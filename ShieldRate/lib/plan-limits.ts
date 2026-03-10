/**
 * Plan Limits and Feature Definitions
 *
 * Vantirs is completely free — all features are unlocked for every merchant.
 */

export type Plan = 'free'

export interface PlanLimits {
  disputesLimit: 'unlimited'
  disputesPeriod: 'monthly'
  autoSubmission: boolean
  vampMonitoring: boolean
  shadowPilot: boolean
  advancedAnalytics: boolean
  priorityProcessing: boolean
  pdfWatermark: boolean
  readOnly: boolean
  sla: boolean
  whiteLabel: boolean
  ce3AddonAvailable: boolean
  ce3AddonPrice: number
  regularEvidence: boolean
  price: number
  name: string
  description: string
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    disputesLimit: 'unlimited',
    disputesPeriod: 'monthly',
    autoSubmission: true,
    vampMonitoring: true,
    shadowPilot: true,
    advancedAnalytics: true,
    priorityProcessing: true,
    pdfWatermark: false,
    readOnly: false,
    sla: false,
    whiteLabel: false,
    ce3AddonAvailable: true,
    ce3AddonPrice: 0,
    regularEvidence: true,
    price: 0,
    name: 'FREE',
    description: 'All features included — completely free',
  },
}

export interface DisputeLimitCheck {
  allowed: boolean
  reason?: string
  remaining?: number
  limit?: number | 'unlimited'
}

/**
 * Check if merchant can process another dispute.
 * Always allowed — no limits.
 */
export function checkDisputeLimit(_merchant: any): DisputeLimitCheck {
  return {
    allowed: true,
    remaining: Infinity,
    limit: 'unlimited',
  }
}

/**
 * Check if feature is available for merchant's plan.
 * All features are always available.
 */
export function hasFeature(_merchant: any, feature: keyof PlanLimits): boolean {
  return PLAN_LIMITS.free[feature] === true
}

/**
 * Get plan limits for a merchant.
 * Always returns the free (all-inclusive) plan.
 */
export function getPlanLimits(_merchant: any): PlanLimits {
  return PLAN_LIMITS.free
}

/**
 * Increment dispute counter for merchant (no-op — no limits)
 */
export async function incrementDisputeCounter(_merchantId: string, _supabase: any): Promise<void> {
  // No-op: disputes are unlimited
}
