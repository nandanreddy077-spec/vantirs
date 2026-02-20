import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { decrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

/**
 * Get Audit Results by Token
 * Secure endpoint that requires token to access results
 * Results expire after 24 hours
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get('token')
    const auditId = searchParams.get('id') // Fallback for old URLs

    if (!token && !auditId) {
      return NextResponse.json(
        { error: 'Token or audit ID is required' },
        { status: 400 }
      )
    }

    // Try to fetch from database using token (preferred) or audit ID (fallback)
    const { data, error } = await supabaseAdmin
      .from('audit_results')
      .select('*')
      .or(token ? `token.eq.${token}` : `id.eq.${auditId}`)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Audit results not found or expired' },
        { status: 404 }
      )
    }

    // Check expiration
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        // Delete expired result
        await supabaseAdmin
          .from('audit_results')
          .delete()
          .eq('id', data.id)
          .catch(() => {})

        return NextResponse.json(
          { error: 'Audit results have expired' },
          { status: 410 } // Gone
        )
      }
    }

    // Decrypt email if stored encrypted
    let email = data.email
    if (data.email_encrypted) {
      try {
        email = decrypt(data.email_encrypted)
      } catch (error) {
        // If decryption fails, use stored email or skip
        email = data.email || 'unknown'
      }
    }

    logger.info({
      event: 'AUDIT_RESULTS_ACCESSED',
      auditId: data.id,
      hasToken: !!token,
    })

    return NextResponse.json({
      success: true,
      result: data.result,
      email: email.substring(0, 3) + '***', // Partial email for security
      created_at: data.created_at,
      expires_at: data.expires_at,
    }, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error: any) {
    logger.error({
      event: 'AUDIT_RESULTS_ERROR',
      error: error.message,
    })
    return NextResponse.json(
      { error: 'Failed to fetch audit results' },
      { status: 500 }
    )
  }
}
