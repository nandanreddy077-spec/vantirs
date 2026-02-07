/**
 * API Key Hashing Utilities
 * 
 * Uses bcrypt for secure API key hashing
 * Provides backward compatibility for plaintext keys during migration
 */

// Import bcrypt (server-only, native module)
// Using require for CommonJS compatibility
import * as bcrypt from 'bcrypt'

const SALT_ROUNDS = 12 // Industry standard for API keys

/**
 * Hash an API key using bcrypt
 * 
 * @param apiKey - Plaintext API key
 * @returns Hashed API key
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, SALT_ROUNDS)
}

/**
 * Verify an API key against a hash
 * 
 * @param apiKey - Plaintext API key to verify
 * @param hash - Hashed API key from database
 * @returns True if API key matches hash
 */
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  // If hash looks like a plaintext API key (starts with vant_), do direct comparison
  // This provides backward compatibility during migration
  if (hash.startsWith('vant_')) {
    return apiKey === hash
  }
  
  // Otherwise, verify using bcrypt
  return bcrypt.compare(apiKey, hash)
}

/**
 * Check if an API key is hashed (not plaintext)
 */
export function isApiKeyHashed(apiKey: string): boolean {
  // Bcrypt hashes start with $2a$, $2b$, or $2y$
  return apiKey.startsWith('$2')
}

