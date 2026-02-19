/**
 * Encryption Utility for Stripe Keys
 * 
 * Uses AES-256-GCM for authenticated encryption
 * Encryption key must be set in ENCRYPTION_KEY environment variable
 * 
 * Security:
 * - AES-256-GCM provides authenticated encryption (prevents tampering)
 * - Each encryption uses a unique IV (initialization vector)
 * - IV is prepended to ciphertext for decryption
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 16 bytes for AES
const SALT_LENGTH = 64 // 64 bytes for key derivation
const TAG_LENGTH = 16 // 16 bytes for GCM authentication tag
const KEY_LENGTH = 32 // 32 bytes for AES-256
const ITERATIONS = 100000 // PBKDF2 iterations

/**
 * Get encryption key from environment variable
 * Falls back to a default key in development (NOT SECURE FOR PRODUCTION)
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY

  if (!envKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required in production. ' +
        'Generate a secure key with: openssl rand -base64 32'
      )
    }
    // Development fallback (NOT SECURE - only for local dev)
    console.warn('⚠️  WARNING: Using default encryption key. Set ENCRYPTION_KEY in production!')
    return crypto.scryptSync('default-dev-key-change-in-production', 'salt', KEY_LENGTH)
  }

  // Convert base64 key to buffer
  try {
    return Buffer.from(envKey, 'base64')
  } catch (error) {
    throw new Error('ENCRYPTION_KEY must be a valid base64 string')
  }
}

/**
 * Derive a key from the master key using PBKDF2
 * This allows us to use different keys for different purposes if needed
 */
function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256')
}

/**
 * Encrypt a string value
 * 
 * Format: salt (64 bytes) + iv (16 bytes) + encrypted data + auth tag (16 bytes)
 * 
 * @param plaintext - The value to encrypt
 * @returns Base64-encoded encrypted string
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string')
  }

  const masterKey = getEncryptionKey()
  
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  
  // Derive key from master key
  const key = deriveKey(masterKey, salt)
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  // Encrypt
  let encrypted = cipher.update(plaintext, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])
  
  // Get authentication tag
  const tag = cipher.getAuthTag()
  
  // Combine: salt + iv + encrypted + tag
  const combined = Buffer.concat([salt, iv, encrypted, tag])
  
  // Return as base64
  return combined.toString('base64')
}

/**
 * Decrypt a string value
 * 
 * @param encryptedBase64 - Base64-encoded encrypted string
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedBase64: string): string {
  if (!encryptedBase64) {
    throw new Error('Cannot decrypt empty string')
  }

  const masterKey = getEncryptionKey()
  
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedBase64, 'base64')
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = combined.subarray(combined.length - TAG_LENGTH)
    const encrypted = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      combined.length - TAG_LENGTH
    )
    
    // Derive key
    const key = deriveKey(masterKey, salt)
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    // Decrypt
    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    
    return decrypted.toString('utf8')
  } catch (error: any) {
    // If decryption fails, it might be plaintext (for backward compatibility)
    // Check if it looks like a Stripe key (starts with rk_, sk_, whsec_, pk_)
    if (encryptedBase64.match(/^(rk_|sk_|whsec_|pk_)/)) {
      console.warn('⚠️  Decryption failed, but value looks like plaintext Stripe key. Returning as-is.')
      return encryptedBase64
    }
    throw new Error(`Decryption failed: ${error.message}`)
  }
}

/**
 * Check if a string is encrypted (starts with base64 pattern, not Stripe key pattern)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false
  // Encrypted values are base64, not Stripe keys
  return !value.match(/^(rk_|sk_|whsec_|pk_)/) && /^[A-Za-z0-9+/=]+$/.test(value)
}









