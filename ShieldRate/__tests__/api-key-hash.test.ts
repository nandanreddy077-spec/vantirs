import { hashApiKey, verifyApiKey, isApiKeyHashed } from '../lib/api-key-hash'

describe('API Key Hashing', () => {
  it('should hash an API key', async () => {
    const apiKey = 'vant_abc123def456'
    const hash = await hashApiKey(apiKey)
    expect(hash).toMatch(/^\$2[aby]\$/)
    expect(hash).not.toBe(apiKey)
  })

  it('should verify a hashed API key', async () => {
    const apiKey = 'vant_abc123def456'
    const hash = await hashApiKey(apiKey)
    const isValid = await verifyApiKey(apiKey, hash)
    expect(isValid).toBe(true)
  })

  it('should reject wrong API key against hash', async () => {
    const apiKey = 'vant_abc123def456'
    const hash = await hashApiKey(apiKey)
    const isValid = await verifyApiKey('vant_wrong_key', hash)
    expect(isValid).toBe(false)
  })

  it('should verify plaintext API key with timing-safe comparison', async () => {
    const apiKey = 'vant_abc123def456'
    const isValid = await verifyApiKey(apiKey, apiKey)
    expect(isValid).toBe(true)
  })

  it('should reject wrong plaintext API key', async () => {
    const isValid = await verifyApiKey('vant_wrong', 'vant_correct')
    expect(isValid).toBe(false)
  })

  it('should reject different-length plaintext keys', async () => {
    const isValid = await verifyApiKey('vant_short', 'vant_much_longer_key')
    expect(isValid).toBe(false)
  })

  it('should detect hashed vs plaintext keys', () => {
    expect(isApiKeyHashed('$2b$12$abc123')).toBe(true)
    expect(isApiKeyHashed('$2a$12$xyz')).toBe(true)
    expect(isApiKeyHashed('vant_abc123')).toBe(false)
    expect(isApiKeyHashed('plaintext')).toBe(false)
  })
})
