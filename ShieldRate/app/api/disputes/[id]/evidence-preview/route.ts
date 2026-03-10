import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { buildRegular104Evidence } from '@/lib/regular-evidence'
import { getMerchantStripe } from '@/lib/merchant-stripe'
import { addSecurityHeaders, addCorsHeaders } from '@/lib/security-headers'

export const dynamic = 'force-dynamic'

/**
 * Evidence Preview API
 * Shows merchants what evidence will be submitted for a dispute
 * before actually submitting it.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      return addSecurityHeaders(addCorsHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        req
      ))
    }

    const { data: dispute } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .eq('id', params.id)
      .eq('merchant_id', merchant.id)
      .single()

    if (!dispute) {
      return addSecurityHeaders(addCorsHeaders(
        NextResponse.json({ error: 'Dispute not found' }, { status: 404 }),
        req
      ))
    }

    const stripeInstance = await getMerchantStripe(merchant.id)
    const evidenceResult = await buildRegular104Evidence(params.id, stripeInstance, merchant.id)

    const response = {
      dispute_id: params.id,
      evidence_type: dispute.evidence_type,
      dispute_category: dispute.dispute_category,
      evidence_strength: evidenceResult.evidenceStrength,
      fields_populated: evidenceResult.fieldsPopulated,
      fields_missing: evidenceResult.fieldsMissing,
      recommendations: evidenceResult.recommendations,
      preview: {
        customer_name: evidenceResult.evidenceFields.customer_name || null,
        customer_email: evidenceResult.evidenceFields.customer_email_address || null,
        customer_ip: evidenceResult.evidenceFields.customer_purchase_ip || null,
        billing_address: evidenceResult.evidenceFields.billing_address || null,
        shipping_address: evidenceResult.evidenceFields.shipping_address || null,
        product_description: evidenceResult.evidenceFields.product_description || null,
        has_activity_log: !!evidenceResult.evidenceFields.access_activity_log,
        narrative_length: evidenceResult.evidenceFields.uncategorized_text?.length || 0,
      },
    }

    return addSecurityHeaders(addCorsHeaders(NextResponse.json(response), req))
  } catch (error: any) {
    return addSecurityHeaders(addCorsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
      req
    ))
  }
}
