import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger, LogEvents } from '@/lib/logger'
import { encrypt } from '@/lib/encryption'
import { generateApiKey } from '@/lib/auth'
import { hashApiKey } from '@/lib/api-key-hash'
import Stripe from 'stripe'

// Force dynamic rendering (uses request body)
export const dynamic = 'force-dynamic'

// Route segment config for Vercel
export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Onboarding API: Connect Stripe Account
 * 
 * Customers provide their Stripe restricted keys to connect their account
 * 
 * POST /api/onboarding/connect-stripe
 * Body: {
 *   name: string,
 *   email: string,
 *   stripe_secret_key: string (rk_live_... or rk_test_...),
 *   stripe_webhook_secret: string (whsec_...),
 *   stripe_publishable_key: string (pk_live_... or pk_test_...)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body with error handling
    let body
    try {
      const bodyText = await req.text()
      if (!bodyText || bodyText.trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'Request body is empty',
            message: 'Please provide all required fields.',
          },
          { status: 400 }
        )
      }
      body = JSON.parse(bodyText)
    } catch (parseError: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          message: parseError.message || 'Please check your input and try again.',
        },
        { status: 400 }
      )
    }
    const {
      name,
      email,
      stripe_secret_key,
      stripe_webhook_secret,
      stripe_publishable_key,
    } = body

    // Validate required fields
    if (!name || !email || !stripe_secret_key || !stripe_webhook_secret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, email, stripe_secret_key, stripe_webhook_secret',
          message: 'Please fill in all required fields.',
        },
        { status: 400 }
      )
    }

    // Validate Stripe key format
    if (!stripe_secret_key.startsWith('rk_')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Stripe secret key. Must be a restricted key (starts with rk_)',
          message: 'Please use a restricted API key (rk_test_... or rk_live_...), not a secret key (sk_...).',
        },
        { status: 400 }
      )
    }

    if (!stripe_webhook_secret.startsWith('whsec_')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook secret. Must start with whsec_',
          message: 'Please provide a valid webhook signing secret from Stripe Dashboard.',
        },
        { status: 400 }
      )
    }

    // Test Stripe connection
    try {
      const testStripe = new Stripe(stripe_secret_key, {
        apiVersion: '2023-10-16',
      })
      // Test with a simple API call
      await testStripe.charges.list({ limit: 1 })
    } catch (error: any) {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        type: 'stripe_connection_test',
        error: error.message,
      })
      return NextResponse.json(
        {
          success: false,
          error: `Stripe connection failed: ${error.message}`,
          message: 'Please check your restricted key permissions. Ensure it has charges:read, disputes:read, and disputes:write permissions.',
        },
        { status: 400 }
      )
    }

    // Check if encryption key is configured
    if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        type: 'encryption_key_missing',
        error: 'ENCRYPTION_KEY not configured in production',
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
          message: 'Encryption key not configured. Please contact support.',
        },
        { status: 500 }
      )
    }

    // Encrypt Stripe keys before storing
    let encryptedSecretKey: string
    let encryptedWebhookSecret: string
    
    try {
      encryptedSecretKey = encrypt(stripe_secret_key)
      encryptedWebhookSecret = encrypt(stripe_webhook_secret)
    } catch (encryptError: any) {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        type: 'encryption_error',
        error: encryptError.message,
        stack: encryptError.stack,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Encryption failed',
          message: encryptError.message?.includes('ENCRYPTION_KEY')
            ? 'Server configuration error. Please contact support.'
            : 'Failed to encrypt your Stripe keys. Please try again.',
        },
        { status: 500 }
      )
    }

    // Check if merchant already exists (by encrypted Stripe key)
    // We need to check all merchants and decrypt to compare
    const { decrypt: decryptKey } = await import('@/lib/encryption')
    const { data: allMerchants } = await supabaseAdmin
      .from('merchants')
      .select('id, name, email, stripe_secret_key')

    if (allMerchants) {
      // Check if any merchant has this Stripe key (decrypt and compare)
      for (const existing of allMerchants) {
        try {
          const decrypted = decryptKey(existing.stripe_secret_key)
          if (decrypted === stripe_secret_key) {
            return NextResponse.json(
              {
                success: true,
                message: 'Merchant already connected',
                merchant: {
                  id: existing.id,
                  name: existing.name,
                  email: existing.email,
                },
              },
              { status: 200 }
            )
          }
        } catch {
          // If decryption fails, compare plaintext (backward compatibility)
          if (existing.stripe_secret_key === stripe_secret_key) {
            return NextResponse.json(
              {
                success: true,
                message: 'Merchant already connected',
                merchant: {
                  id: existing.id,
                  name: existing.name,
                  email: existing.email,
                },
              },
              { status: 200 }
            )
          }
        }
      }
    }

    // Generate API key for authentication
    const apiKey = generateApiKey()
    
    // SECURITY: Hash API key before storing
    const hashedApiKey = await hashApiKey(apiKey)

    // Generate webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantirs.com'
    const merchantId = crypto.randomUUID()
    const webhookUrl = `${baseUrl}/api/webhooks/stripe/${merchantId}`

    // Create merchant with encrypted keys and hashed API key
    // Default to FREE plan with 2 disputes lifetime limit
    const { data: merchant, error: insertError } = await supabaseAdmin
      .from('merchants')
      .insert({
        id: merchantId,
        name,
        email,
        stripe_secret_key: encryptedSecretKey,
        stripe_webhook_secret: encryptedWebhookSecret,
        stripe_publishable_key: stripe_publishable_key || null,
        webhook_url: webhookUrl,
        api_key: hashedApiKey, // SECURITY: Store hashed API key
        is_active: true,
        plan: 'free', // Default to free plan
        disputes_used: 0,
        disputes_limit: 2, // Free tier: 2 disputes lifetime
        disputes_used_this_month: 0,
        subscription_status: 'active',
        billing_cycle_start: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError || !merchant) {
      logger.error({
        event: LogEvents.SYNC_FAILED,
        type: 'merchant_creation',
        error: insertError?.message,
      })
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create merchant: ${insertError?.message || 'Unknown error'}`,
          message: 'Failed to save your account. Please try again or contact support.',
        },
        { status: 500 }
      )
    }

    logger.info({
      event: 'MERCHANT_CONNECTED',
      merchantId: merchant.id,
      name: merchant.name,
      email: merchant.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Stripe account connected successfully',
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        webhook_url: merchant.webhook_url,
        api_key: apiKey, // Return API key only once (on creation)
      },
      next_steps: [
        'Save your API key securely - you will need it to access the dashboard',
        `API Key: ${apiKey}`,
        'Configure webhook in Stripe Dashboard',
        `Webhook URL: ${merchant.webhook_url}`,
        'Event: charge.dispute.created',
        'Run 12-month backfill: POST /api/onboarding/sync-transactions?merchant_id=' + merchant.id,
      ],
    })
  } catch (error: any) {
    // Log detailed error for debugging
    const errorMessage = error?.message || 'Unknown error'
    const errorStack = error?.stack || 'No stack trace'
    
    logger.error({
      event: LogEvents.SYNC_FAILED,
      type: 'stripe_connection',
      error: errorMessage,
      stack: errorStack,
      name: error?.name,
    })

    // Always return valid JSON, even on unexpected errors
    try {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          message: errorMessage.includes('ENCRYPTION_KEY') 
            ? 'Server configuration error. Please contact support.'
            : 'Failed to connect Stripe account. Please try again.',
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    } catch (jsonError: any) {
      // Fallback if even JSON creation fails
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          message: 'An unexpected error occurred. Please try again.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
  }
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const { handleCorsPreflight } = await import('@/lib/security-headers')
  return handleCorsPreflight(req) || new NextResponse(null, { status: 204 })
}
