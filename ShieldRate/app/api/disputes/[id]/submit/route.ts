import { NextRequest, NextResponse } from 'next/server'
import { submitEvidenceToStripe } from '@/lib/stripe-submission'

/**
 * Submit Evidence API
 * Manually submit evidence for a dispute to Stripe
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disputeId = params.id

    if (!disputeId) {
      return NextResponse.json(
        { error: 'Dispute ID is required' },
        { status: 400 }
      )
    }

    // Get dispute details
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { data: dispute, error } = await supabaseAdmin
      .from('disputes')
      .select('stripe_dispute_id')
      .eq('id', disputeId)
      .single()

    if (error || !dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      )
    }

    // Submit evidence
    const result = await submitEvidenceToStripe(
      disputeId,
      dispute.stripe_dispute_id
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

