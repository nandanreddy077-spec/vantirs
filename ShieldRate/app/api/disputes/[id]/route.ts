import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/auth'
import { addSecurityHeaders, addCorsHeaders } from '@/lib/security-headers'

export const dynamic = 'force-dynamic'

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

    const { data: dispute, error } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .eq('id', params.id)
      .eq('merchant_id', merchant.id)
      .single()

    if (error || !dispute) {
      return addSecurityHeaders(addCorsHeaders(
        NextResponse.json({ error: 'Dispute not found' }, { status: 404 }),
        req
      ))
    }

    return addSecurityHeaders(addCorsHeaders(NextResponse.json(dispute), req))
  } catch (error: any) {
    return addSecurityHeaders(addCorsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
      req
    ))
  }
}
