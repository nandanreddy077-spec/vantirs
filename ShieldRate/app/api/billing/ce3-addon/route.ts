import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getPlanLimits } from '@/lib/plan-limits'

export const dynamic = 'force-dynamic'

/**
 * CE 3.0 Add-on Management
 *
 * GET  — check current ce3_addon status
 * POST — enable/disable (requires paid plan with ce3AddonAvailable)
 */
export async function GET(req: NextRequest) {
  try {
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: merchantData } = await supabaseAdmin
      .from('merchants')
      .select('ce3_addon')
      .eq('id', merchant.id)
      .single()

    const planLimits = getPlanLimits(merchant)

    const checkoutConfigured = Boolean(process.env.STRIPE_CE3_ADDON_PRICE_ID)
    return NextResponse.json({
      enabled: merchantData?.ce3_addon === true,
      available: planLimits.ce3AddonAvailable,
      price: planLimits.ce3AddonPrice,
      plan: merchant.plan || 'free',
      checkout_available: checkoutConfigured,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const enable = body.enable === true

    const planLimits = getPlanLimits(merchant)
    if (!planLimits.ce3AddonAvailable) {
      return NextResponse.json({
        error: `CE 3.0 add-on is not available on your current plan (${merchant.plan || 'free'}). Upgrade to Starter or higher.`,
        upgrade_required: true,
      }, { status: 403 })
    }

    await supabaseAdmin
      .from('merchants')
      .update({ ce3_addon: enable })
      .eq('id', merchant.id)

    return NextResponse.json({
      success: true,
      ce3_addon: enable,
      message: enable
        ? 'CE 3.0 forensic matching enabled. Qualifying disputes will now use liability shift evidence.'
        : 'CE 3.0 add-on disabled. Disputes will use regular 10.4 evidence.',
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
