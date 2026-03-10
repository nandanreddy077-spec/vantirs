import { generateCorrelationId, createRequestLogger, LogEvents } from '../lib/logger'

describe('Logger', () => {
  describe('generateCorrelationId', () => {
    it('should generate a correlation ID with vnt_ prefix', () => {
      const id = generateCorrelationId()
      expect(id).toMatch(/^vnt_[a-f0-9]+_[a-f0-9]+$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateCorrelationId()))
      expect(ids.size).toBe(100)
    })
  })

  describe('createRequestLogger', () => {
    it('should create a child logger with correlation ID', () => {
      const { logger, correlationId } = createRequestLogger()
      expect(correlationId).toMatch(/^vnt_/)
      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.error).toBe('function')
    })

    it('should use provided correlation ID', () => {
      const customId = 'vnt_custom_123'
      const { correlationId } = createRequestLogger(customId)
      expect(correlationId).toBe(customId)
    })
  })

  describe('LogEvents', () => {
    it('should have all required event types', () => {
      expect(LogEvents.DISPUTE_RECEIVED).toBe('DISPUTE_RECEIVED')
      expect(LogEvents.EVIDENCE_SUBMITTED).toBe('EVIDENCE_SUBMITTED')
      expect(LogEvents.WEBHOOK_VERIFIED).toBe('WEBHOOK_VERIFIED')
      expect(LogEvents.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED')
      expect(LogEvents.CE3_MATCH_FOUND).toBe('CE3_MATCH_FOUND')
    })
  })
})
