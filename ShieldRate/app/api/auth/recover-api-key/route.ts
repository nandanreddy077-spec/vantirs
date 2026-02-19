import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateApiKey } from '@/lib/auth'
import { hashApiKey } from '@/lib/api-key-hash'
import { logger, LogEvents } from '@/lib/logger'

/**
 * Recover API Key
 * 
 * Allows users to recover their API key by providing their email address.
 * This will generate a NEW API key and update their account.
 * 
 * SECURITY: We cannot retrieve the original API key (it's hashed),
 * so we generate a new one and update the account.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Find merchant by email
    const { data: merchant, error: findError } = await supabaseAdmin
      .from('merchants')
      .select('id, name, email, is_active')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (findError || !merchant) {
      // Don't reveal if email exists (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a new API key has been generated. Please check your email.',
      })
    }

    if (!merchant.is_active) {
      return NextResponse.json(
        { success: false, message: 'Account is inactive. Please contact support.' },
        { status: 403 }
      )
    }

    // Generate new API key
    const newApiKey = generateApiKey()
    const hashedApiKey = await hashApiKey(newApiKey)

    // Update merchant with new API key
    const { error: updateError } = await supabaseAdmin
      .from('merchants')
      .update({
        api_key: hashedApiKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', merchant.id)

    if (updateError) {
      logger.error({
        event: LogEvents.DATABASE_ERROR,
        error: updateError.message,
        merchantId: merchant.id,
      })
      return NextResponse.json(
        { success: false, message: 'Failed to generate new API key. Please try again or contact support.' },
        { status: 500 }
      )
    }

    logger.info({
      event: 'API_KEY_RECOVERED',
      merchantId: merchant.id,
      email: merchant.email,
    })

    // TODO: Send email with new API key
    // For now, return it directly (in production, send via email)
    return NextResponse.json({
      success: true,
      message: 'New API key generated successfully',
      api_key: newApiKey, // In production, send via email instead
      merchant: {
        id: merchant.id,
        name: merchant.name,
      },
      note: 'Please save this API key securely. It will not be shown again.',
    })
  } catch (error: any) {
    logger.error({
      event: LogEvents.SYNC_FAILED,
      type: 'api_key_recovery',
      error: error.message,
    })
    return NextResponse.json(
      { success: false, message: 'Failed to process request. Please try again.' },
      { status: 500 }
    )
  }
}

