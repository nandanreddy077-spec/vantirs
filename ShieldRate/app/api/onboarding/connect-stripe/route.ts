import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger, LogEvents } from '@/lib/logger'
import { encrypt } from '@/lib/encryption'
import { generateApiKey } from '@/lib/auth'
import Stripe from 'stripe'

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
    const body = await req.json()
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
        { error: 'Missing required fields: name, email, stripe_secret_key, stripe_webhook_secret' },
        { status: 400 }
      )
    }

    // Validate Stripe key format
    if (!stripe_secret_key.startsWith('rk_')) {
      return NextResponse.json(
        { error: 'Invalid Stripe secret key. Must be a restricted key (starts with rk_)' },
        { status: 400 }
      )
    }

    if (!stripe_webhook_secret.startsWith('whsec_')) {
      return NextResponse.json(
        { error: 'Invalid webhook secret. Must start with whsec_' },
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
        { error: `Stripe connection failed: ${error.message}. Please check your restricted key permissions.` },
        { status: 400 }
      )
    }

    // Encrypt Stripe keys before storing
    const encryptedSecretKey = encrypt(stripe_secret_key)
    const encryptedWebhookSecret = encrypt(stripe_webhook_secret)

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

    // Generate webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantirs.com'
    const merchantId = crypto.randomUUID()
    const webhookUrl = `${baseUrl}/api/webhooks/stripe/${merchantId}`

    // Create merchant with encrypted keys
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
        api_key: apiKey,
        is_active: true,
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
        { error: `Failed to create merchant: ${insertError?.message || 'Unknown error'}` },
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
    logger.error({
      event: LogEvents.SYNC_FAILED,
      type: 'stripe_connection',
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to connect Stripe account. Please try again.',
      },
      { status: 500 }
    )
  }
}


