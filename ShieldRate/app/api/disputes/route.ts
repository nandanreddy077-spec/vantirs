import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/auth'

/**
 * Disputes API
 * Returns all disputes with compliance scores for the authenticated merchant
 * 
 * Requires: API key authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate request
    const merchant = await authenticateRequest(req)
    if (!merchant) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid API key.' },
        { status: 401 }
      )
    }

    const { data: disputes, error } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching disputes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch disputes' },
        { status: 500 }
      )
    }

    return NextResponse.json(disputes || [])
  } catch (error: any) {
    console.error('Error in disputes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


