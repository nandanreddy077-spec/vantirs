/**
 * Supabase Connection Pooling Configuration
 * 
 * Optimizes database connection management for scalability
 * Supabase handles connection pooling automatically, but we can configure it
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Create optimized Supabase client with connection pooling settings
 * 
 * Supabase uses PgBouncer for connection pooling, which handles:
 * - Transaction pooling (default)
 * - Session pooling (for migrations)
 * - Statement pooling (for read-only queries)
 */
export function createPooledSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      // Connection pool settings
      schema: 'public',
    },
    global: {
      // Headers for connection pooling
      headers: {
        'x-client-info': 'vantirs@1.0.0',
        'connection': 'keep-alive', // Reuse connections
      },
    },
  })
}

/**
 * Connection pool statistics (for monitoring)
 * 
 * Note: Supabase doesn't expose pool stats directly
 * Monitor via Supabase dashboard or PostgreSQL queries
 */
export interface PoolStats {
  activeConnections?: number
  idleConnections?: number
  totalConnections?: number
}

/**
 * Get connection pool statistics
 * 
 * Requires: PostgreSQL connection with pg_stat_activity access
 */
export async function getPoolStats(): Promise<PoolStats> {
  // This would require direct PostgreSQL access
  // For now, return empty stats
  // In production, monitor via Supabase dashboard
  return {}
}

/**
 * Best practices for connection pooling:
 * 
 * 1. Use transaction pooling for most queries (Supabase default)
 * 2. Reuse Supabase client instances (don't create new ones per request)
 * 3. Use connection string with ?pgbouncer=true for direct connections
 * 4. Monitor connection usage in Supabase dashboard
 * 5. Set appropriate pool sizes based on traffic
 * 
 * Supabase automatically handles:
 * - Connection pooling via PgBouncer
 * - Connection limits per project tier
 * - Automatic connection cleanup
 * - Load balancing across read replicas (if configured)
 */










