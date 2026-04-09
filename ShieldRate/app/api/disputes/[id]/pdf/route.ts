import { NextRequest, NextResponse } from 'next/server'
import { generateCompliancePack } from '@/lib/pdf-generator'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getMerchantStripe } from '@/lib/merchant-stripe'

// Force dynamic rendering (uses request headers for auth)
export const dynamic = 'force-dynamic'

/**
 * PDF Download API
 * Generates and returns the compliance pack PDF for a dispute
 * 
 * Requires: API key authentication
 * Verifies: Dispute belongs to authenticated merchant
 */
export async function GET(
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

    // Verify dispute belongs to merchant
    const { data: dispute, error } = await supabaseAdmin
      .from('disputes')
      .select('id, merchant_id')
      .eq('id', disputeId)
      .eq('merchant_id', merchant.id)
      .single()

    if (error || !dispute) {
      return NextResponse.json(
        { error: 'Dispute not found or access denied' },
        { status: 404 }
      )
    }

    // Use merchant's Stripe client so PDF uses correct account data (multi-tenant)
    // No watermark — all features are free
    const stripeInstance = await getMerchantStripe(merchant.id)
    const pdfBuffer = await generateCompliancePack(disputeId, false, stripeInstance)

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compliance-pack-${disputeId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: `Failed to generate PDF: ${error.message}` },
      { status: 500 }
    )
  }
}

