import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { createRazorpayPaymentLink } from '@/lib/razorpay-billing'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Create Razorpay Payment Link for Subscription
 * POST /api/billing/checkout
 * 
 * Body: { plan: 'starter' | 'professional' }
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

    const body = await req.json()
    const { plan } = body

    if (!plan || !['starter', 'professional'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "starter" or "professional".' },
        { status: 400 }
      )
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantirs.com'
    const successUrl = `${baseUrl}/billing/success?plan=${plan}`
    const cancelUrl = `${baseUrl}/pricing?canceled=true`

    // Create Razorpay payment link
    const checkoutUrl = await createRazorpayPaymentLink(
      merchant.id,
      plan,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
    })
  } catch (error: any) {
    logger.error({
      event: 'RAZORPAY_CHECKOUT_FAILED',
      error: error.message,
    })
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error.message}` },
      { status: 500 }
    )
  }
}



