/**
 * Plan Limits and Feature Definitions
 * Defines what each subscription tier can do
 */

export type Plan = 'free' | 'starter' | 'professional' | 'enterprise'

export interface PlanLimits {
  disputesLimit: number | 'unlimited'
  disputesPeriod: 'lifetime' | 'monthly'
  autoSubmission: boolean
  vampMonitoring: boolean
  shadowPilot: boolean
  advancedAnalytics: boolean
  priorityProcessing: boolean
  pdfWatermark: boolean
  readOnly: boolean
  sla: boolean
  whiteLabel: boolean
  price: number | 'custom' // Monthly price in USD
  name: string
  description: string
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    disputesLimit: 2,
    disputesPeriod: 'lifetime',
    autoSubmission: false,
    vampMonitoring: false,
    shadowPilot: false,
    advancedAnalytics: false,
    priorityProcessing: false,
    pdfWatermark: true,
    readOnly: true,
    sla: false,
    whiteLabel: false,
    price: 0,
    name: 'FREE (Demo)',
    description: 'Perfect for testing Vantirs with limited disputes',
  },
  starter: {
    disputesLimit: 25,
    disputesPeriod: 'monthly',
    autoSubmission: true,
    vampMonitoring: true,
    shadowPilot: false,
    advancedAnalytics: false,
    priorityProcessing: false,
    pdfWatermark: false,
    readOnly: false,
    sla: false,
    whiteLabel: false,
    price: 99,
    name: 'STARTER',
    description: 'For small SaaS businesses with moderate dispute volume',
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
    sla: false,
    whiteLabel: false,
    price: 249,
    name: 'PROFESSIONAL',
    description: 'For growing businesses with high dispute volume',
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
    price: 'custom',
    name: 'ENTERPRISE',
    description: 'For large organizations with custom requirements',
  },
}

export interface DisputeLimitCheck {
  allowed: boolean
  reason?: string
  remaining?: number
  limit?: number | 'unlimited'
}

/**
 * Check if merchant can process another dispute
 */
export function checkDisputeLimit(merchant: any): DisputeLimitCheck {
  const plan = (merchant.plan || 'free') as Plan
  const limits = PLAN_LIMITS[plan]
  
  // Enterprise has unlimited disputes
  if (limits.disputesLimit === 'unlimited') {
    return { 
      allowed: true, 
      remaining: Infinity,
      limit: 'unlimited'
    }
  }
  
  // Free tier: lifetime limit
  if (limits.disputesPeriod === 'lifetime') {
    const used = merchant.disputes_used || 0
    const limit = limits.disputesLimit as number
    
    if (used >= limit) {
      return { 
        allowed: false, 
        reason: `Free tier limit reached (${limit} disputes lifetime). Upgrade to continue processing disputes.`,
        remaining: 0,
        limit
      }
    }
    
    return { 
      allowed: true, 
      remaining: limit - used,
      limit
    }
  }
  
  // Paid tiers: monthly limit
  const used = merchant.disputes_used_this_month || 0
  const limit = limits.disputesLimit as number
  
  // Check if billing cycle needs reset (should be done by cron, but check here too)
  const now = new Date()
  const cycleStart = merchant.billing_cycle_start 
    ? new Date(merchant.billing_cycle_start) 
    : new Date(merchant.created_at)
  
  // If new month, reset would happen via cron, but we check anyway
  const isNewMonth = now.getMonth() !== cycleStart.getMonth() || 
                     now.getFullYear() !== cycleStart.getFullYear()
  
  if (isNewMonth) {
    // Should be reset by cron, but if not, allow it (cron will fix it)
    return { 
      allowed: true, 
      remaining: limit,
      limit
    }
  }
  
  if (used >= limit) {
    return { 
      allowed: false, 
      reason: `Monthly limit reached (${limit} disputes). Upgrade to Professional for 100 disputes/month, or wait for next billing cycle.`,
      remaining: 0,
      limit
    }
  }
  
  return { 
    allowed: true, 
    remaining: limit - used,
    limit
  }
}

/**
 * Check if feature is available for merchant's plan
 */
export function hasFeature(merchant: any, feature: keyof PlanLimits): boolean {
  const plan = (merchant.plan || 'free') as Plan
  const limits = PLAN_LIMITS[plan]
  return limits[feature] === true
}

/**
 * Get plan limits for a merchant
 */
export function getPlanLimits(merchant: any): PlanLimits {
  const plan = (merchant.plan || 'free') as Plan
  return PLAN_LIMITS[plan]
}

/**
 * Increment dispute counter for merchant
 */
export async function incrementDisputeCounter(merchantId: string, supabase: any): Promise<void> {
  const { data: merchant } = await supabase
    .from('merchants')
    .select('plan, disputes_used, disputes_used_this_month')
    .eq('id', merchantId)
    .single()
  
  if (!merchant) return
  
  const plan = (merchant.plan || 'free') as Plan
  const limits = PLAN_LIMITS[plan]
  
  const updates: any = {}
  
  if (limits.disputesPeriod === 'lifetime') {
    updates.disputes_used = (merchant.disputes_used || 0) + 1
  } else {
    updates.disputes_used_this_month = (merchant.disputes_used_this_month || 0) + 1
  }
  
  await supabase
    .from('merchants')
    .update(updates)
    .eq('id', merchantId)
}






