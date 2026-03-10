import { getClientIP } from '../lib/rate-limit'

describe('Rate Limiting', () => {
  describe('getClientIP', () => {
    it('should extract IP from cf-connecting-ip (highest priority)', () => {
      const headers = new Headers({
        'cf-connecting-ip': '1.2.3.4',
        'x-forwarded-for': '5.6.7.8',
        'x-real-ip': '9.10.11.12',
      })
      expect(getClientIP({ headers })).toBe('1.2.3.4')
    })

    it('should extract IP from x-forwarded-for (first entry)', () => {
      const headers = new Headers({
        'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12',
      })
      expect(getClientIP({ headers })).toBe('1.2.3.4')
    })

    it('should extract IP from x-real-ip', () => {
      const headers = new Headers({
        'x-real-ip': '1.2.3.4',
      })
      expect(getClientIP({ headers })).toBe('1.2.3.4')
    })

    it('should return "unknown" when no IP headers are present', () => {
      const headers = new Headers()
      expect(getClientIP({ headers })).toBe('unknown')
    })

    it('should trim whitespace from x-forwarded-for', () => {
      const headers = new Headers({
        'x-forwarded-for': '  1.2.3.4  , 5.6.7.8',
      })
      expect(getClientIP({ headers })).toBe('1.2.3.4')
    })
  })
})
