import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger, LogEvents } from '@/lib/logger'
import { encrypt } from '@/lib/encryption'
import { generateApiKey } from '@/lib/auth'
import { hashApiKey } from '@/lib/api-key-hash'
import Stripe from 'stripe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Stripe Connect OAuth Callback
 * 
 * Handles OAuth callback from Stripe, exchanges code for tokens,
 * creates merchant account, and sets up webhook automatically
 * 
 * GET /api/onboarding/stripe-connect/callback
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    // Handle OAuth errors
    if (error) {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        type: 'stripe_connect_oauth_error',
        error,
        errorDescription,
      })
      
      return NextResponse.redirect(
        new URL(`/onboarding?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || 'OAuth authorization failed')}`, req.url)
      )
    }
    
    if (!code) {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        type: 'stripe_connect_no_code',
      })
      
      return NextResponse.redirect(
        new URL('/onboarding?error=no_code&message=Authorization code not received', req.url)
      )
    }
    
    // Verify state (CSRF protection)
    const storedState = req.cookies.get('stripe_connect_state')?.value
    if (state && storedState && state !== storedState) {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        type: 'stripe_connect_state_mismatch',
      })
      
      return NextResponse.redirect(
        new URL('/onboarding?error=state_mismatch&message=Security verification failed', req.url)
      )
    }
    
    // Get Stripe secret key for OAuth token exchange
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        type: 'stripe_connect_config',
        error: 'STRIPE_SECRET_KEY not configured',
      })
      
      return NextResponse.redirect(
        new URL('/onboarding?error=stripe_not_configured', req.url)
      )
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })
    
    // Exchange authorization code for access token
    logger.info({
      event: 'STRIPE_CONNECT_TOKEN_EXCHANGE',
      code: code.substring(0, 10) + '...', // Log partial code
    })
    
    const tokenResponse = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    })
    
    // tokenResponse contains:
    // - access_token: Use this to make API calls on behalf of the connected account
    // - refresh_token: Use this to refresh the access_token when it expires
    // - stripe_user_id: The connected account ID
    // - stripe_publishable_key: Their publishable key
    // - scope: The scope granted
    
    const { access_token, refresh_token, stripe_user_id, stripe_publishable_key } = tokenResponse
    
    if (!access_token || !stripe_user_id) {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        type: 'stripe_connect_token_missing',
      })
      
      return NextResponse.redirect(
        new URL('/onboarding?error=token_exchange_failed', req.url)
      )
    }
    
    // Create Stripe client with connected account's access token
    const connectedStripe = new Stripe(access_token, {
      apiVersion: '2023-10-16',
    })
    
    // Get account information
    const account = await connectedStripe.accounts.retrieve()
    
    // Check if merchant already exists (by Stripe account ID)
    const { data: existingMerchant } = await supabaseAdmin
      .from('merchants')
      .select('id, name, email')
      .eq('stripe_account_id', stripe_user_id)
      .single()
    
    if (existingMerchant) {
      // Update existing merchant with new tokens
      const encryptedAccessToken = encrypt(access_token)
      const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null
      
      await supabaseAdmin
        .from('merchants')
        .update({
          stripe_access_token: encryptedAccessToken,
          stripe_refresh_token: encryptedRefreshToken,
          oauth_connected_at: new Date().toISOString(),
          connection_method: 'oauth',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMerchant.id)
      
      logger.info({
        event: 'STRIPE_CONNECT_RECONNECTED',
        merchantId: existingMerchant.id,
        stripeAccountId: stripe_user_id,
      })
      
      return NextResponse.redirect(
        new URL(`/onboarding?success=true&merchant_id=${existingMerchant.id}&reconnected=true`, req.url)
      )
    }
    
    // Generate API key for authentication
    const apiKey = generateApiKey()
    const hashedApiKey = await hashApiKey(apiKey)
    
    // Generate webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantirs.com'
    const merchantId = crypto.randomUUID()
    const webhookUrl = `${baseUrl}/api/webhooks/stripe/${merchantId}`
    
    // Automatically create webhook endpoint
    let webhookSecret: string | null = null
    try {
      const webhook = await connectedStripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: ['charge.dispute.created', 'charge.dispute.updated'],
      })
      
      webhookSecret = webhook.secret || null
      
      logger.info({
        event: 'STRIPE_WEBHOOK_CREATED',
        merchantId,
        webhookId: webhook.id,
        webhookUrl,
      })
    } catch (webhookError: any) {
      logger.warn({
        event: 'STRIPE_WEBHOOK_CREATION_FAILED',
        merchantId,
        error: webhookError.message,
        note: 'Merchant can create webhook manually',
      })
      // Continue without webhook - merchant can set it up manually
    }
    
    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(access_token)
    const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null
    const encryptedWebhookSecret = webhookSecret ? encrypt(webhookSecret) : null
    
    // Get merchant name and email from account
    const merchantName = account.business_profile?.name || 
                        account.settings?.dashboard?.display_name || 
                        account.email || 
                        'Stripe Account'
    const merchantEmail = account.email || account.business_profile?.support_email || ''
    
    // Create merchant record with default FREE plan
    const { data: merchant, error: insertError } = await supabaseAdmin
      .from('merchants')
      .insert({
        id: merchantId,
        name: merchantName,
        email: merchantEmail,
        stripe_account_id: stripe_user_id,
        stripe_access_token: encryptedAccessToken,
        stripe_refresh_token: encryptedRefreshToken,
        stripe_publishable_key: stripe_publishable_key || null,
        stripe_webhook_secret: encryptedWebhookSecret,
        webhook_url: webhookUrl,
        api_key: hashedApiKey,
        oauth_connected_at: new Date().toISOString(),
        connection_method: 'oauth',
        is_active: true,
        plan: 'free', // Default to free plan
        disputes_used: 0,
        disputes_limit: 5, // Early user: 5 free disputes lifetime
        disputes_used_this_month: 0,
        subscription_status: 'active',
        billing_cycle_start: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (insertError || !merchant) {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        type: 'merchant_creation_oauth',
        error: insertError?.message,
      })
      
      return NextResponse.redirect(
        new URL(`/onboarding?error=merchant_creation_failed&message=${encodeURIComponent(insertError?.message || 'Unknown error')}`, req.url)
      )
    }
    
    logger.info({
      event: 'MERCHANT_CONNECTED_OAUTH',
      merchantId: merchant.id,
      name: merchant.name,
      email: merchant.email,
      stripeAccountId: stripe_user_id,
      duration: Date.now() - startTime,
    })
    
    // Clear state cookie
    const response = NextResponse.redirect(
      new URL(`/onboarding?success=true&merchant_id=${merchant.id}&api_key=${apiKey}`, req.url)
    )
    response.cookies.delete('stripe_connect_state')
    
    return response
  } catch (error: any) {
    logger.error({
      event: LogEvents.SYNC_FAILED,
      type: 'stripe_connect_callback',
      error: error.message,
      stack: error.stack,
    })
    
    return NextResponse.redirect(
      new URL(`/onboarding?error=callback_failed&message=${encodeURIComponent(error.message)}`, req.url)
    )
  }
}



