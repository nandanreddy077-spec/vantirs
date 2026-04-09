import { captureException, captureMessage, flushErrorTracking } from '../lib/error-tracking'

describe('Error Tracking', () => {
  it('should capture exception without Sentry (graceful fallback)', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const error = new Error('Test error')

    expect(() => captureException(error)).not.toThrow()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('should capture exception with context', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const error = new Error('Test error')

    expect(() =>
      captureException(error, {
        tags: { disputeId: 'disp_123' },
        extra: { amount: 150 },
        user: { id: 'merchant_456' },
      })
    ).not.toThrow()

    consoleSpy.mockRestore()
  })

  it('should capture message at different levels', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation()
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
    const errorSpy = jest.spyOn(console, 'error').mockImplementation()

    captureMessage('Info message', 'info')
    captureMessage('Warning message', 'warning')
    captureMessage('Error message', 'error')

    expect(logSpy).toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()

    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('should flush without error when Sentry not initialized', async () => {
    await expect(flushErrorTracking()).resolves.not.toThrow()
  })
})
