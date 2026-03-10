import { NextRequest, NextResponse } from 'next/server'
import { logger, LogEvents } from '@/lib/logger'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Stripe Connect OAuth Initiation
 * 
 * Redirects merchant to Stripe OAuth authorization page
 * 
 * GET /api/onboarding/stripe-connect
 */
export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.STRIPE_CONNECT_CLIENT_ID
    
    if (!clientId) {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        type: 'stripe_connect_config',
        error: 'STRIPE_CONNECT_CLIENT_ID not configured',
      })
      return NextResponse.redirect(
        new URL('/onboarding?error=stripe_connect_not_configured', req.url)
      )
    }

    // Use env in production; fall back to request origin (e.g. localhost) for dev
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
    const redirectUri = `${baseUrl}/api/onboarding/stripe-connect/callback`
    
    // Generate state for CSRF protection
    const state = crypto.randomUUID()
    
    // Request read_write scope (needed for webhook creation)
    // You can also use 'read_only' if you only need read access
    const scope = 'read_write'
    
    // Build OAuth URL
    const authUrl = new URL('https://connect.stripe.com/oauth/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('state', state)
    
    // Store state in cookie for verification (optional, but recommended)
    const response = NextResponse.redirect(authUrl.toString())
    response.cookies.set('stripe_connect_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })
    
    logger.info({
      event: 'STRIPE_CONNECT_INITIATED',
      redirectUri,
    })
    
    return response
  } catch (error: any) {
    logger.error({
      event: LogEvents.SYNC_FAILED,
      type: 'stripe_connect_initiation',
      error: error.message,
      stack: error.stack,
    })
    
    return NextResponse.redirect(
      new URL('/onboarding?error=oauth_initiation_failed', req.url)
    )
  }
}










