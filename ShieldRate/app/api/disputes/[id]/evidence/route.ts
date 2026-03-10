import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = [
  'shipping_tracking_number',
  'shipping_carrier',
  'shipping_date',
  'product_description',
  'refund_policy',
  'refund_policy_disclosure',
  'service_documentation',
  'receipt',
  'duplicate_charge_explanation',
  'duplicate_charge_id',
  'cancellation_policy',
  'cancellation_policy_disclosure',
  'cancellation_rebuttal',
  'customer_communication',
] as const

/**
 * GET /api/disputes/[id]/evidence
 * Fetch merchant-provided evidence for a dispute.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('dispute_evidence')
      .select('*')
      .eq('dispute_id', params.id)
      .eq('merchant_id', merchant.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ evidence: data || null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PUT /api/disputes/[id]/evidence
 * Upsert merchant-provided evidence for a dispute (shipping, policies, etc.).
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: dispute } = await supabaseAdmin
      .from('disputes')
      .select('id, merchant_id, evidence_submitted_at')
      .eq('id', params.id)
      .eq('merchant_id', merchant.id)
      .single()

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    if (dispute.evidence_submitted_at) {
      return NextResponse.json(
        { error: 'Evidence already submitted to Stripe. Cannot modify.' },
        { status: 409 },
      )
    }

    const body = await req.json()

    const fields: Record<string, string | null> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in body) {
        fields[key] = typeof body[key] === 'string' ? body[key].trim() || null : null
      }
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('dispute_evidence')
      .select('id')
      .eq('dispute_id', params.id)
      .single()

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('dispute_evidence')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('dispute_id', params.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ evidence: data })
    }

    const { data, error } = await supabaseAdmin
      .from('dispute_evidence')
      .insert({
        dispute_id: params.id,
        merchant_id: merchant.id,
        ...fields,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ evidence: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
