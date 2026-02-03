/**
 * PII Scrubbing Utilities
 * Ensures GDPR/SOC2 compliance by removing sensitive data
 */

/**
 * Sensitive fields that should never be stored
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
  'ssn',
  'social_security',
  'credit_card',
  'card_number',
  'cvv',
  'cvc',
  'pin',
  'bank_account',
  'routing_number',
]

/**
 * Scrub sensitive data from metadata object
 */
export function scrubMetadata(metadata: Record<string, any>): Record<string, any> {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }

  const scrubbed: Record<string, any> = {}

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase()

    // Skip sensitive fields
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      continue
    }

    // Recursively scrub nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      scrubbed[key] = scrubMetadata(value)
    } else if (Array.isArray(value)) {
      scrubbed[key] = value.map(item =>
        typeof item === 'object' ? scrubMetadata(item) : item
      )
    } else {
      scrubbed[key] = value
    }
  }

  return scrubbed
}

/**
 * Validate that activity log doesn't contain PII
 */
export function validateActivityLog(data: {
  action_type: string
  action_description?: string | null
  metadata?: Record<string, any> | null
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check action description for PII patterns
  if (data.action_description) {
    const description = data.action_description.toLowerCase()
    
    // Email pattern
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(description)) {
      errors.push('Action description contains email address')
    }
    
    // Phone pattern
    if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(description)) {
      errors.push('Action description contains phone number')
    }
  }

  // Check metadata for sensitive fields
  if (data.metadata) {
    const scrubbed = scrubMetadata(data.metadata)
    const originalKeys = Object.keys(data.metadata)
    const scrubbedKeys = Object.keys(scrubbed)
    
    if (originalKeys.length !== scrubbedKeys.length) {
      errors.push('Metadata contains sensitive fields')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitize IP address (remove last octet for privacy)
 */
export function sanitizeIP(ip: string | null): string | null {
  if (!ip) return null
  
  // IPv4: 192.168.1.1 -> 192.168.1.0
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`
    }
  }
  
  // IPv6: Keep first 64 bits, zero out last 64 bits
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length > 4) {
      return parts.slice(0, 4).join(':') + '::0'
    }
  }
  
  return ip
}
