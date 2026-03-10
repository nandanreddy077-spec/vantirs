import { encrypt, decrypt, isEncrypted } from '../lib/encryption'

describe('Encryption', () => {
  // Use dev fallback key for tests (NODE_ENV is not 'production')

  it('should encrypt and decrypt a string', () => {
    const plaintext = 'sk_test_abc123'
    const encrypted = encrypt(plaintext)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertext for same plaintext (unique IV)', () => {
    const plaintext = 'sk_test_abc123'
    const encrypted1 = encrypt(plaintext)
    const encrypted2 = encrypt(plaintext)
    expect(encrypted1).not.toBe(encrypted2)
  })

  it('should throw on empty string encryption', () => {
    expect(() => encrypt('')).toThrow('Cannot encrypt empty string')
  })

  it('should throw on empty string decryption', () => {
    expect(() => decrypt('')).toThrow('Cannot decrypt empty string')
  })

  it('should detect encrypted vs plaintext values', () => {
    const encrypted = encrypt('test-value')
    expect(isEncrypted(encrypted)).toBe(true)
    expect(isEncrypted('sk_test_abc123')).toBe(false)
    expect(isEncrypted('pk_live_xyz')).toBe(false)
    expect(isEncrypted('whsec_abc')).toBe(false)
    expect(isEncrypted('')).toBe(false)
  })

  it('should handle Stripe key patterns as plaintext in decrypt', () => {
    // Stripe keys should pass through if decryption fails
    const stripeKey = 'sk_test_abc123'
    const result = decrypt(stripeKey)
    expect(result).toBe(stripeKey)
  })

  it('should throw on invalid encrypted data', () => {
    expect(() => decrypt('not-valid-base64-encrypted-data!@#')).toThrow()
  })

  it('should handle long values', () => {
    const longValue = 'x'.repeat(10000)
    const encrypted = encrypt(longValue)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(longValue)
  })

  it('should handle special characters', () => {
    const special = '🔑 key with spëcial chars & <html> "quotes"'
    const encrypted = encrypt(special)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(special)
  })
})

describe('Encryption - production mode', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('should throw in production if ENCRYPTION_KEY is not set', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.ENCRYPTION_KEY
    expect(() => encrypt('test')).toThrow('CRITICAL')
  })
})
