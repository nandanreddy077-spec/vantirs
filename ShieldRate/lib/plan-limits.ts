/**
 * Plan Limits and Feature Definitions
 *
 * - Early users: 5 free disputes (lifetime), then must upgrade.
 * - Paid tiers: Starter, Professional, Enterprise.
 */

export type Plan = 'free' | 'starter' | 'professional' | 'enterprise'

export const FREE_TIER_DISPUTE_LIMIT = 5

export interface PlanLimits {
  disputesLimit: number | 'unlimited'
  disputesPeriod: 'monthly' | 'lifetime'
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
    disputesLimit: FREE_TIER_DISPUTE_LIMIT,
    disputesPeriod: 'lifetime',
    autoSubmission: true,
    vampMonitoring: true,
    shadowPilot: false,
    advancedAnalytics: false,
    priorityProcessing: false,
    pdfWatermark: false,
    readOnly: false,
    sla: false,
    whiteLabel: false,
    ce3AddonAvailable: true,
    ce3AddonPrice: 0,
    regularEvidence: true,
    price: 0,
    name: 'Early User',
    description: '5 free disputes to try Vantirs — then upgrade for more',
  },
  starter: {
    disputesLimit: 25,
    disputesPeriod: 'monthly',
    autoSubmission: true,
    vampMonitoring: true,
    shadowPilot: true,
    advancedAnalytics: true,
    priorityProcessing: false,
    pdfWatermark: false,
    readOnly: false,
    sla: false,
    whiteLabel: false,
    ce3AddonAvailable: true,
    ce3AddonPrice: 29,
    regularEvidence: true,
    price: 49,
    name: 'Starter',
    description: '25 disputes/month — ideal for growing SaaS',
  },
  professional: {
    disputesLimit: 100,
    disputesPeriod: 'monthly',
    autoSubmission: true,
    vampMonitoring: true,
    shadowPilot: true,
    advancedAnalytics: true,
    priorityProcessing: true,
    pdfWatermark: false,
    readOnly: false,
    sla: true,
    whiteLabel: false,
    ce3AddonAvailable: true,
    ce3AddonPrice: 0, // included
    regularEvidence: true,
    price: 149,
    name: 'Professional',
    description: '100 disputes/month + CE 3.0 included',
  },
  enterprise: {
    disputesLimit: 'unlimited',
    disputesPeriod: 'monthly',
    autoSubmission: true,
    vampMonitoring: true,
    shadowPilot: true,
    advancedAnalytics: true,
    priorityProcessing: true,
    pdfWatermark: false,
    readOnly: false,
    sla: true,
    whiteLabel: true,
    ce3AddonAvailable: true,
    ce3AddonPrice: 0,
    regularEvidence: true,
    price: 0, // custom
    name: 'Enterprise',
    description: 'Unlimited disputes — custom SLA & white-label',
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
 * Free tier: lifetime cap of 5. Paid: monthly cap.
 */
export function checkDisputeLimit(merchant: {
  plan?: string | null
  disputes_used?: number | null
  disputes_used_this_month?: number | null
  disputes_limit?: number | null
}): DisputeLimitCheck {
  const plan = (merchant?.plan as Plan) || 'free'
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

  if (limits.disputesLimit === 'unlimited') {
    return { allowed: true, remaining: Infinity, limit: 'unlimited' }
  }

  const limit = limits.disputesLimit

  if (limits.disputesPeriod === 'lifetime') {
    const used = Number(merchant?.disputes_used ?? 0)
    const remaining = Math.max(0, limit - used)
    return {
      allowed: remaining > 0,
      remaining,
      limit,
      reason: remaining <= 0 ? 'free_tier_limit_reached' : undefined,
    }
  }

  // monthly
  const usedThisMonth = Number(merchant?.disputes_used_this_month ?? 0)
  const remaining = Math.max(0, limit - usedThisMonth)
  return {
    allowed: remaining > 0,
    remaining,
    limit,
    reason: remaining <= 0 ? 'monthly_limit_exceeded' : undefined,
  }
}

/**
 * Check if feature is available for merchant's plan.
 */
export function hasFeature(merchant: { plan?: string | null }, feature: keyof PlanLimits): boolean {
  const plan = (merchant?.plan as Plan) || 'free'
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
  const val = limits[feature]
  return val === true
}

/**
 * Get plan limits for a merchant.
 */
export function getPlanLimits(merchant: { plan?: string | null }): PlanLimits {
  const plan = (merchant?.plan as Plan) || 'free'
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

/**
 * Increment dispute counter after processing a dispute.
 * Free: increments disputes_used (lifetime). Paid: increments disputes_used_this_month.
 */
export async function incrementDisputeCounter(merchantId: string, supabase: any): Promise<void> {
  const { data: merchant } = await supabase
    .from('merchants')
    .select('plan, disputes_used, disputes_used_this_month')
    .eq('id', merchantId)
    .single()

  if (!merchant) return

  const plan = (merchant.plan as Plan) || 'free'
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

  if (limits.disputesPeriod === 'lifetime') {
    await supabase
      .from('merchants')
      .update({
        disputes_used: (Number(merchant.disputes_used ?? 0) + 1),
      })
      .eq('id', merchantId)
    return
  }

  // monthly
  await supabase
    .from('merchants')
    .update({
      disputes_used_this_month: (Number(merchant.disputes_used_this_month ?? 0) + 1),
      disputes_used: (Number(merchant.disputes_used ?? 0) + 1),
    })
    .eq('id', merchantId)
}
