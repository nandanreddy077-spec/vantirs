import { NextRequest, NextResponse } from 'next/server'
import { submitEvidenceToStripe } from '@/lib/stripe-submission'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering (uses request headers for auth)
export const dynamic = 'force-dynamic'

/**
 * Submit Evidence API
 * Manually submit evidence for a dispute to Stripe
 * 
 * Requires: API key authentication
 * Verifies: Dispute belongs to authenticated merchant
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid API key.' },
        { status: 401 }
      )
    }

    const disputeId = params.id

    if (!disputeId) {
      return NextResponse.json(
        { error: 'Dispute ID is required' },
        { status: 400 }
      )
    }

    // Get dispute details and verify merchant ownership
    const { data: dispute, error } = await supabaseAdmin
      .from('disputes')
      .select('stripe_dispute_id, merchant_id')
      .eq('id', disputeId)
      .eq('merchant_id', merchant.id)
      .single()

    if (error || !dispute) {
      return NextResponse.json(
        { error: 'Dispute not found or access denied' },
        { status: 404 }
      )
    }

    // Submit evidence (submitEvidenceToStripe will use merchant's Stripe client)
    const result = await submitEvidenceToStripe(
      disputeId,
      dispute.stripe_dispute_id,
      merchant.id
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error submitting evidence:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


