/**
 * Vantirs Lightweight Event Tracking SDK
 * 
 * Usage:
 * 
 * import { vantirs } from '@/lib/vantirs-sdk'
 * 
 * vantirs.track({
 *   action: 'export_csv',
 *   userId: 'user_123',
 *   metadata: { ip: '1.2.3.4', deviceId: 'unique_fingerprint_here' }
 * })
 */

interface TrackOptions {
  action: string
  userId: string
  metadata?: {
    ip?: string
    deviceId?: string
    [key: string]: any
  }
}

class VantirsSDK {
  private apiUrl: string
  private enabled: boolean

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    this.enabled = typeof window !== 'undefined' && (!!process.env.NEXT_PUBLIC_VANTIRS_ENABLED || !!process.env.NEXT_PUBLIC_SHIELDRATE_ENABLED) // Backward compatibility
  }

  /**
   * Track a user action for evidence collection
   */
  async track(options: TrackOptions): Promise<void> {
    if (!this.enabled) {
      return // Silently fail if not enabled
    }

    try {
      // Get IP address if not provided
      const ip = options.metadata?.ip || await this.getClientIP()
      
      // Get device fingerprint if not provided
      const deviceFingerprint = options.metadata?.deviceId || this.getDeviceFingerprint()

      // Send to Vantirs API
      await fetch(`${this.apiUrl}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: options.action,
          user_id: options.userId,
          ip_address: ip,
          device_fingerprint: deviceFingerprint,
          timestamp: new Date().toISOString(),
          metadata: options.metadata || {},
        }),
      })
    } catch (error) {
      // Fail silently - don't break the app
      console.warn('Vantirs tracking failed:', error)
    }
  }

  /**
   * Get client IP address (fallback method)
   */
  private async getClientIP(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return undefined
    }
  }

  /**
   * Generate device fingerprint
   */
  private getDeviceFingerprint(): string {
    if (typeof window === 'undefined') {
      return 'server-side'
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('Vantirs', 2, 2)
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join('|')

    // Simple hash function
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36)
  }
}

export const vantirs = new VantirsSDK()
// Backward compatibility alias
export const shieldrate = vantirs

