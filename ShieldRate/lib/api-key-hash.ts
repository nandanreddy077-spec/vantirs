/**
 * API Key Hashing Utilities
 *
 * Uses bcryptjs for secure API key hashing (pure JS, no native bindings).
 * Timing-safe comparison for plaintext keys to prevent timing attacks.
 */

import * as bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SALT_ROUNDS = 12

/**
 * Hash an API key using bcryptjs
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, SALT_ROUNDS)
}

/**
 * Verify an API key against a stored hash/key
 * Uses timing-safe comparison for plaintext keys to prevent timing attacks
 */
export async function verifyApiKey(apiKey: string, storedKey: string): Promise<boolean> {
  if (isApiKeyHashed(storedKey)) {
    return bcrypt.compare(apiKey, storedKey)
  }

  // Timing-safe comparison for plaintext keys (legacy migration period)
  if (apiKey.length !== storedKey.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(apiKey, 'utf8'), Buffer.from(storedKey, 'utf8'))
  } catch {
    return false
  }
}

/**
 * Check if a stored key is bcrypt-hashed (not plaintext)
 */
export function isApiKeyHashed(storedKey: string): boolean {
  return storedKey.startsWith('$2')
}
