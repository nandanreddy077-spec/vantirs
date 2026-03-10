describe('Environment Validation', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Reset modules to re-import validateEnv fresh each test
    jest.resetModules()
    // Set minimum required env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.vantirs.com'
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should pass with all required vars set', async () => {
    const { validateEnv } = await import('../lib/env')
    expect(() => validateEnv()).not.toThrow()
  })

  it('should throw when required vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const { validateEnv } = await import('../lib/env')
    expect(() => validateEnv()).toThrow('NEXT_PUBLIC_SUPABASE_URL')
  })

  it('should throw multiple missing vars', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const { validateEnv } = await import('../lib/env')
    expect(() => validateEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL.*SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY.*NEXT_PUBLIC_SUPABASE_URL/)
  })

  it('should require ENCRYPTION_KEY in production', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.ENCRYPTION_KEY
    const { validateEnv } = await import('../lib/env')
    expect(() => validateEnv()).toThrow('ENCRYPTION_KEY')
  })

  it('should require CRON_SECRET in production', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64')
    delete process.env.CRON_SECRET
    const { validateEnv } = await import('../lib/env')
    expect(() => validateEnv()).toThrow('CRON_SECRET')
  })

  it('should validate ENCRYPTION_KEY length', async () => {
    process.env.ENCRYPTION_KEY = Buffer.from('tooshort').toString('base64')
    const { validateEnv } = await import('../lib/env')
    expect(() => validateEnv()).toThrow('too short')
  })

  it('should accept valid ENCRYPTION_KEY', async () => {
    process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64')
    const { validateEnv } = await import('../lib/env')
    expect(() => validateEnv()).not.toThrow()
  })
})
