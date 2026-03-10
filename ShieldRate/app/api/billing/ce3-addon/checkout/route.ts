import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * CE 3.0 Add-on Checkout — No longer needed (CE 3.0 is free)
 */
export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'CE 3.0 forensic matching is already included for free. No payment required.',
  })
}
