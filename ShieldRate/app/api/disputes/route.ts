import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/auth'
import { getCache, setCache, CacheKeys, CacheTTL } from '@/lib/cache'
import { addSecurityHeaders, addCorsHeaders, validateRequestBodySize } from '@/lib/security-headers'

// Force dynamic rendering (uses request headers for auth)
export const dynamic = 'force-dynamic'

/**
 * Disputes API
 * Returns all disputes with compliance scores for the authenticated merchant
 * 
 * Requires: API key authentication
 */
export async function GET(req: NextRequest) {
  try {
    // SECURITY: Validate request body size
    const sizeCheck = validateRequestBodySize(req, 1024 * 1024) // 1MB
    if (!sizeCheck.valid) {
      const response = NextResponse.json(
        { error: sizeCheck.error },
        { status: 413 }
      )
      return addSecurityHeaders(addCorsHeaders(response, req))
    }

    // Authenticate request
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      const response = NextResponse.json(
        { error: 'Unauthorized. Please provide a valid API key.' },
        { status: 401 }
      )
      return addSecurityHeaders(addCorsHeaders(response, req))
    }

    // SCALABILITY: Check cache first (cache key includes query params for filtering)
    const searchParams = req.nextUrl.searchParams.toString()
    const cacheKey = CacheKeys.disputes(merchant.id, searchParams || undefined)
    const cached = await getCache<any[]>(cacheKey, { ttl: CacheTTL.disputes })
    
    if (cached) {
      const response = NextResponse.json(cached)
      return addSecurityHeaders(addCorsHeaders(response, req))
    }

    const { data: disputes, error } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching disputes:', error)
      const response = NextResponse.json(
        { error: 'Failed to fetch disputes' },
        { status: 500 }
      )
      return addSecurityHeaders(addCorsHeaders(response, req))
    }

    // SCALABILITY: Cache the result
    await setCache(cacheKey, disputes || [], { ttl: CacheTTL.disputes })

    const response = NextResponse.json(disputes || [])
    return addSecurityHeaders(addCorsHeaders(response, req))
  } catch (error: any) {
    console.error('Error in disputes API:', error)
    const response = NextResponse.json(
      { error: 'Internal server error' },
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


