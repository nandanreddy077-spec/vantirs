import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { trackRateLimit, getClientIP } from '@/lib/rate-limit'
import { logger, LogEvents } from '@/lib/logger'
import { scrubMetadata, validateActivityLog } from '@/lib/pii-scrubber'

/**
 * Vantirs Event Tracking API
 * Receives events from the lightweight SDK and stores them
 * Hardened with rate limiting and PII scrubbing
 */
export async function POST(req: NextRequest) {
  const clientIP = getClientIP(req)

  // Rate limiting
  if (trackRateLimit) {
    const { success, limit, remaining } = await trackRateLimit.limit(`track:${clientIP}`)
    
    if (!success) {
      logger.warn({
        event: 'RATE_LIMIT_EXCEEDED',
        endpoint: '/api/track',
        ip: clientIP,
      })
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'Retry-After': '60',
          },
        }
      )
    }
  }

  try {
    const body = await req.json()
    const { action, user_id, ip_address, device_fingerprint, timestamp, metadata } = body

    if (!action || !user_id) {
      return NextResponse.json(
        { error: 'action and user_id are required' },
        { status: 400 }
      )
    }

    // Validate and scrub PII
    const validation = validateActivityLog({
      action_type: action,
      action_description: metadata?.description || null,
      metadata: metadata || null,
    })

    if (!validation.valid) {
      logger.warn({
        event: 'PII_DETECTED',
        action,
        userId: user_id,
        errors: validation.errors,
      })
    }

    // Scrub metadata of PII
    const scrubbedMetadata = metadata ? scrubMetadata(metadata) : {}

    // Map action to evidence category via taxonomy
    const { data: taxonomy } = await supabaseAdmin
      .from('action_taxonomy')
      .select('evidence_category')
      .eq('action_key', action)
      .single()

    const evidenceCategory = taxonomy?.evidence_category || 'Value'

    // Insert into user_activity_logs (with scrubbed metadata)
    const { error: insertError } = await supabaseAdmin
      .from('user_activity_logs')
      .insert({
        customer_id: user_id,
        action_type: action,
        action_description: scrubbedMetadata?.description || `${evidenceCategory} action: ${action}`,
        ip_address: ip_address || null,
        device_fingerprint: device_fingerprint || null,
        timestamp: timestamp || new Date().toISOString(),
        metadata: scrubbedMetadata,
      })

    if (insertError) {
      logger.error({
        event: 'DATABASE_ERROR',
        error: insertError.message,
        action,
        userId: user_id,
      })
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error({
      event: 'DATABASE_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: '/api/track',
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

