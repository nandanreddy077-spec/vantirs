import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Billing Checkout — No longer needed (all features are free)
 */
export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Vantirs is completely free. No payment required. All features are already unlocked.',
  })
}
