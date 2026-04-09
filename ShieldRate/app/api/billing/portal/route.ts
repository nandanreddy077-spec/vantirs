import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Billing Portal — No longer needed (all features are free)
 */
export async function POST() {
  return NextResponse.json({
    success: true,
    subscription: {
      plan: 'free',
      status: 'active',
      message: 'Vantirs is completely free. All features are included at no cost.',
    },
  })
}
