import { NextRequest, NextResponse } from 'next/server'
import { getSystemMetrics } from '@/lib/metrics'
import { addSecurityHeaders, addCorsHeaders } from '@/lib/security-headers'
import { authenticateRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Metrics API
 * Returns system health metrics
 * 
 * Requires: API key authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate request
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      const response = NextResponse.json(
        { error: 'Unauthorized. Please provide a valid API key.' },
        { status: 401 }
      )
      return addSecurityHeaders(addCorsHeaders(response, req))
    }

    const metrics = await getSystemMetrics()

    const response = NextResponse.json(metrics)
    return addSecurityHeaders(addCorsHeaders(response, req))
  } catch (error: any) {
    const response = NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
    return addSecurityHeaders(addCorsHeaders(response, req))
  }
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const { handleCorsPreflight } = await import('@/lib/security-headers')
  return handleCorsPreflight(req) || new NextResponse(null, { status: 204 })
}








