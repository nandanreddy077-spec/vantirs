import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * CE 3.0 Add-on — Always enabled (all features are free)
 */
export async function GET() {
  return NextResponse.json({
    enabled: true,
    available: true,
    price: 0,
    plan: 'free',
    message: 'CE 3.0 forensic matching is included for free.',
  })
}

export async function POST() {
  return NextResponse.json({
    success: true,
    ce3_addon: true,
    message: 'CE 3.0 forensic matching is always enabled — included for free.',
  })
}
