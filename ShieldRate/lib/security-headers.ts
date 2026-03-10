/**
 * Security Headers Middleware
 * 
 * Provides security headers for API responses
 * Implements defense-in-depth security measures
 */

import { NextResponse } from 'next/server'

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com;"
  )

  // X-Content-Type-Options: Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // X-Frame-Options: Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // X-XSS-Protection: Enable XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer-Policy: Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy: Restrict browser features
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  )

  // Strict-Transport-Security: Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  return response
}

/**
 * CORS configuration
 */
export interface CorsConfig {
  allowedOrigins?: string[]
  allowedMethods?: string[]
  allowedHeaders?: string[]
  maxAge?: number
}

const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400, // 24 hours
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflight(
  request: Request,
  config: CorsConfig = DEFAULT_CORS_CONFIG
): NextResponse | null {
  const origin = request.headers.get('origin')
  const method = request.headers.get('access-control-request-method')

  // Check if origin is allowed
  const isOriginAllowed =
    config.allowedOrigins?.includes('*') ||
    (origin && config.allowedOrigins?.includes(origin))

  if (!isOriginAllowed && origin) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403 }
    )
  }

  // Create CORS response
  const response = new NextResponse(null, { status: 204 })
  
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  if (config.allowedMethods) {
    response.headers.set(
      'Access-Control-Allow-Methods',
      config.allowedMethods.join(', ')
    )
  }
  
  if (config.allowedHeaders) {
    response.headers.set(
      'Access-Control-Allow-Headers',
      config.allowedHeaders.join(', ')
    )
  }
  
  if (config.maxAge) {
    response.headers.set('Access-Control-Max-Age', config.maxAge.toString())
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true')

  return addSecurityHeaders(response)
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  response: NextResponse,
  request: Request,
  config: CorsConfig = DEFAULT_CORS_CONFIG
): NextResponse {
  const origin = request.headers.get('origin')
  
  const isOriginAllowed =
    config.allowedOrigins?.includes('*') ||
    (origin && config.allowedOrigins?.includes(origin))

  if (isOriginAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

/**
 * Validate request body size
 */
export function validateRequestBodySize(
  request: Request,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): { valid: boolean; error?: string } {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (size > maxSizeBytes) {
      return {
        valid: false,
        error: `Request body too large. Maximum size: ${maxSizeBytes / 1024 / 1024}MB`,
      }
    }
  }

  return { valid: true }
}










