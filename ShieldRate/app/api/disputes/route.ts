import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Disputes API
 * Returns all disputes with compliance scores
 */
export async function GET() {
  try {
    const { data: disputes, error } = await supabaseAdmin
      .from('disputes')
      .select('*')
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

