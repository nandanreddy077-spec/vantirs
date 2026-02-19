import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Get Razorpay Subscription Management Info
 * POST /api/billing/portal
 * 
 * Returns subscription details for merchants to manage their subscription
 * Note: Razorpay doesn't have a hosted portal like Stripe, so we return subscription details
 * and provide cancel/reactivate endpoints
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid API key.' },
        { status: 401 }
      )
    }

    // Get merchant subscription details
    const { data: merchantDetails } = await supabaseAdmin
      .from('merchants')
      .select('plan, subscription_status, razorpay_subscription_id, subscription_started_at, subscription_ends_at')
      .eq('id', merchant.id)
      .single()

    if (!merchantDetails) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      )
    }

    // Return subscription details
    // For Razorpay, merchants can manage subscriptions through the dashboard
    // or we can provide cancel/reactivate endpoints
    return NextResponse.json({
      success: true,
      subscription: {
        plan: merchantDetails.plan,
        status: merchantDetails.subscription_status,
        subscription_id: merchantDetails.razorpay_subscription_id,
        started_at: merchantDetails.subscription_started_at,
        ends_at: merchantDetails.subscription_ends_at,
        manage_url: `https://dashboard.razorpay.com/app/subscriptions/${merchantDetails.razorpay_subscription_id}`,
      },
      message: 'Use the manage_url to view subscription in Razorpay dashboard, or use /api/billing/cancel to cancel',
    })
  } catch (error: any) {
    logger.error({
      event: 'PORTAL_SESSION_FAILED',
      error: error.message,
    })
    return NextResponse.json(
      { error: `Failed to get subscription details: ${error.message}` },
      { status: 500 }
    )
  }
}



