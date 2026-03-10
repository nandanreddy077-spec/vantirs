import { NextRequest, NextResponse } from 'next/server'
import {
  submitEvidenceToStripe,
  submitRegularEvidenceToStripe,
  submitConsumerEvidenceToStripe,
  submitAuthorizationEvidenceToStripe,
  submitProcessingEvidenceToStripe,
  submitEMVEvidenceToStripe,
  submitCardPresentEvidenceToStripe,
} from '@/lib/stripe-submission'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Submit Evidence API
 * Routes to CE 3.0 or regular 10.4 evidence based on dispute's evidence_type.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const { data: dispute, error } = await supabaseAdmin
      .from('disputes')
      .select('stripe_dispute_id, merchant_id, evidence_type, liability_shift_eligible, evidence_submitted_at')
      .eq('id', disputeId)
      .eq('merchant_id', merchant.id)
      .single()

    if (error || !dispute) {
      return NextResponse.json(
        { error: 'Dispute not found or access denied' },
        { status: 404 }
      )
    }

    // Idempotency: do not submit again if evidence was already submitted
    if (dispute.evidence_submitted_at) {
      return NextResponse.json({
        success: true,
        message: 'Evidence was already submitted for this dispute.',
        already_submitted: true,
      })
    }

    if (dispute.evidence_type === 'skip') {
      return NextResponse.json(
        { success: false, error: 'This dispute was auto-skipped (Visa 10.5 — no evidence accepted by Visa).' },
        { status: 422 },
      )
    }

    let result: { success: boolean; message: string; strength?: string }

    switch (dispute.evidence_type) {
      case 'ce3_auto':
        result = await submitEvidenceToStripe(disputeId, dispute.stripe_dispute_id, merchant.id)
        break
      case 'emv_evidence':
        result = await submitEMVEvidenceToStripe(disputeId, dispute.stripe_dispute_id, merchant.id)
        break
      case 'card_present_evidence':
        result = await submitCardPresentEvidenceToStripe(disputeId, dispute.stripe_dispute_id, merchant.id)
        break
      case 'consumer_evidence':
        result = await submitConsumerEvidenceToStripe(disputeId, dispute.stripe_dispute_id, merchant.id)
        break
      case 'auth_evidence':
        result = await submitAuthorizationEvidenceToStripe(disputeId, dispute.stripe_dispute_id, merchant.id)
        break
      case 'processing_evidence':
        result = await submitProcessingEvidenceToStripe(disputeId, dispute.stripe_dispute_id, merchant.id)
        break
      default:
        result = await submitRegularEvidenceToStripe(disputeId, dispute.stripe_dispute_id, merchant.id)
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        evidence_type: dispute.evidence_type === 'ce3_auto' ? 'ce3' : 'regular',
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
