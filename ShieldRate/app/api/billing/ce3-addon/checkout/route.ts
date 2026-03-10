import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { getPlanLimits } from '@/lib/plan-limits'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

/**
 * Create Stripe Checkout Session for CE 3.0 add-on.
 * Requires STRIPE_CE3_ADDON_PRICE_ID in env (Stripe Price ID for the add-on).
 * On success, Stripe billing webhook sets merchants.ce3_addon = true.
 */
export async function POST(req: NextRequest) {
  try {
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const planLimits = getPlanLimits(merchant)
    if (!planLimits.ce3AddonAvailable) {
      return NextResponse.json(
        { error: 'CE 3.0 add-on not available on your plan. Upgrade to Starter or higher.' },
        { status: 403 }
      )
    }

    const priceId = process.env.STRIPE_CE3_ADDON_PRICE_ID
    if (!priceId) {
      return NextResponse.json(
        {
          error: 'CE 3.0 add-on checkout not configured.',
          hint: 'Set STRIPE_CE3_ADDON_PRICE_ID to a Stripe Price ID to enable billing.',
        },
        { status: 503 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantirs.com'
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?ce3_addon=success`,
      cancel_url: `${baseUrl}/pricing?ce3_addon=canceled`,
      client_reference_id: merchant.id,
      metadata: {
        type: 'ce3_addon',
        vantirs_merchant_id: merchant.id,
      },
      subscription_data: {
        metadata: {
          type: 'ce3_addon',
          vantirs_merchant_id: merchant.id,
        },
      },
    })

    return NextResponse.json({
      success: true,
      url: session.url,
      session_id: session.id,
    })
  } catch (error: any) {
    console.error('CE3 add-on checkout error:', error)
    return NextResponse.json(
      { error: error?.message || 'Checkout failed' },
      { status: 500 }
    )
  }
}
