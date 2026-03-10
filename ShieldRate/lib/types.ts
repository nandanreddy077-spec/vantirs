/**
 * Vantirs Type Definitions
 */

export type EvidenceCategory = 'Identity' | 'Value' | 'Consent' | 'Continuity'

export interface ActionTaxonomy {
  id: string
  action_key: string
  evidence_category: EvidenceCategory
  evidence_description: string
  weight: number
  created_at: string
}

export interface Dispute {
  id: string
  stripe_dispute_id: string
  amount: number
  status: 'open' | 'won' | 'lost' | 'warning_needs_response' | 'warning_closed' | 'warning_under_review' | 'needs_attention'
  reason_code: string | null
  evidence_due_by: string
  customer_id: string
  charge_id: string
  ip_address: string | null
  device_fingerprint: string | null
  v_compliance_score: number
  auto_win_eligible: boolean
  liability_shift_eligible: boolean
  historical_match_found: boolean
  usage_audit_attached: boolean
  card_network: string
  match_count: number
  reason_code_eligible: boolean
  billing_descriptor_match: boolean
  identifier_consistent: boolean
  ineligibility_reasons: string[]
  dispute_category: string
  evidence_type: string
  evidence_submitted_at: string | null
  evidence_submission_type: string | null
  requires_manual_review: boolean
  network_reason_code: string | null
  fraud_sub_code: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  stripe_charge_id: string
  customer_id: string
  amount: number
  status: 'succeeded' | 'failed' | 'pending' | 'refunded'
  ip_address: string | null
  device_fingerprint: string | null
  payment_method_fingerprint: string | null
  disputed: boolean
  created_at: string
  updated_at: string
}

export interface UserActivityLog {
  id: string
  customer_id: string
  action_type: string
  action_description: string | null
  ip_address: string | null
  device_fingerprint: string | null
  timestamp: string
  metadata: Record<string, any> | null
  created_at: string
}

export interface VantirsEvent {
  event_type: EvidenceCategory
  user_id: string
  timestamp: number
  metadata: {
    ip_address?: string
    device_fingerprint?: string
    action?: string
    tos_version?: string
    [key: string]: any
  }
}



