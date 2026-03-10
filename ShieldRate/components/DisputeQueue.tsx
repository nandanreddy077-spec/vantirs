'use client'

import { useState, useEffect } from 'react'
import { FileText, CheckCircle, XCircle, Clock, Download, AlertTriangle, Search, Filter, ChevronDown, ExternalLink, CheckCircle2, Info, Shield, Package, CreditCard, RotateCcw, X, Save } from 'lucide-react'
import DisputeQueueSkeleton from './DisputeQueueSkeleton'
import EmptyState from './EmptyState'

interface Dispute {
  id: string
  stripe_dispute_id: string
  amount: number
  status: string
  reason_code: string
  v_compliance_score: number
  auto_win_eligible: boolean
  liability_shift_eligible?: boolean
  historical_match_found?: boolean
  usage_audit_attached?: boolean
  card_network?: string
  match_count?: number
  evidence_due_by: string
  created_at: string
  requires_manual_review?: boolean
  dispute_category?: string
  evidence_type?: string
  evidence_submission_type?: string
  ineligibility_reasons?: string[]
}

interface EvidenceForm {
  shipping_tracking_number: string
  shipping_carrier: string
  shipping_date: string
  product_description: string
  refund_policy: string
  refund_policy_disclosure: string
  service_documentation: string
  receipt: string
  duplicate_charge_explanation: string
  duplicate_charge_id: string
  cancellation_policy: string
  cancellation_policy_disclosure: string
  cancellation_rebuttal: string
  customer_communication: string
}

const EMPTY_EVIDENCE_FORM: EvidenceForm = {
  shipping_tracking_number: '', shipping_carrier: '', shipping_date: '',
  product_description: '', refund_policy: '', refund_policy_disclosure: '',
  service_documentation: '', receipt: '',
  duplicate_charge_explanation: '', duplicate_charge_id: '',
  cancellation_policy: '', cancellation_policy_disclosure: '', cancellation_rebuttal: '',
  customer_communication: '',
}

export default function DisputeQueue() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [evidencePanel, setEvidencePanel] = useState<string | null>(null)
  const [evidenceForm, setEvidenceForm] = useState<EvidenceForm>({ ...EMPTY_EVIDENCE_FORM })
  const [savingEvidence, setSavingEvidence] = useState(false)

  useEffect(() => {
    fetchDisputes()
  }, [])

  function getApiKey(): string | null {
    return localStorage.getItem('vantirs_api_key')
  }

  async function fetchDisputes() {
    const apiKey = getApiKey()
    if (!apiKey) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/disputes', {
        headers: {
          'X-API-Key': apiKey,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setDisputes(data)
      }
    } catch (error) {
      console.error('Error fetching disputes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function downloadCompliancePack(disputeId: string) {
    const apiKey = getApiKey()
    if (!apiKey) {
      alert('API key required')
      return
    }

    try {
      const response = await fetch(`/api/disputes/${disputeId}/pdf`, {
        headers: {
          'X-API-Key': apiKey,
        },
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `compliance-pack-${disputeId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download compliance pack')
    }
  }

  async function submitEvidence(disputeId: string) {
    const apiKey = getApiKey()
    if (!apiKey) {
      alert('API key required')
      return
    }

    if (!confirm('Submit evidence to Stripe? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/disputes/${disputeId}/submit`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
      })
      if (response.ok) {
        alert('Evidence submitted to Stripe successfully!')
        fetchDisputes()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit evidence')
      }
    } catch (error) {
      console.error('Error submitting evidence:', error)
      alert('Error submitting evidence')
    }
  }

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
      open: { 
        color: 'text-yellow-700', 
        bgColor: 'bg-yellow-100', 
        icon: Clock, 
        label: 'Open' 
      },
      won: { 
        color: 'text-green-700', 
        bgColor: 'bg-green-100', 
        icon: CheckCircle, 
        label: 'Won' 
      },
      lost: { 
        color: 'text-red-700', 
        bgColor: 'bg-red-100', 
        icon: XCircle, 
        label: 'Lost' 
      },
      warning_needs_response: { 
        color: 'text-orange-700', 
        bgColor: 'bg-orange-100', 
        icon: FileText, 
        label: 'Needs Response' 
      },
      needs_attention: { 
        color: 'text-red-700', 
        bgColor: 'bg-red-100', 
        icon: AlertTriangle, 
        label: 'Needs Attention' 
      },
    }

    const statusInfo = statusMap[status] || { 
      color: 'text-gray-700', 
      bgColor: 'bg-gray-100', 
      icon: FileText, 
      label: status 
    }
    const Icon = statusInfo.icon

    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold ${statusInfo.bgColor} ${statusInfo.color} border border-current/20`}>
        <Icon className="h-4 w-4 mr-2" />
        {statusInfo.label}
      </span>
    )
  }

  function getComplianceStatus(dispute: Dispute) {
    const liabilityShift = dispute.liability_shift_eligible ?? dispute.auto_win_eligible
    const historicalMatch = dispute.historical_match_found ?? false
    const usageAudit = dispute.usage_audit_attached ?? false

    return {
      liabilityShift,
      historicalMatch,
      usageAudit,
      network: dispute.card_network || 'UNKNOWN',
      evidenceType: dispute.evidence_type || 'pending',
      category: dispute.dispute_category || 'unknown',
    }
  }

  function getEvidenceBadge(evidenceType: string) {
    switch (evidenceType) {
      case 'ce3_auto':
        return { label: 'CE 3.0', color: 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border-violet-200', icon: Shield }
      case 'regular_10_4':
        return { label: '10.4 Fraud', color: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200', icon: FileText }
      case 'consumer_evidence':
        return { label: 'Consumer', color: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200', icon: Package }
      case 'auth_evidence':
        return { label: 'Authorization', color: 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200', icon: CreditCard }
      case 'processing_evidence':
        return { label: 'Processing', color: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200', icon: RotateCcw }
      case 'manual':
        return { label: 'Manual', color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200', icon: AlertTriangle }
      default:
        return { label: 'Pending', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock }
    }
  }

  function getCategoryLabel(category: string) {
    const labels: Record<string, string> = {
      fraud_10_4: 'Fraud (10.4)',
      fraud_other: 'Fraud (Other)',
      consumer: 'Consumer',
      authorization: 'Authorization',
      processing_error: 'Processing',
    }
    return labels[category] || category
  }

  async function openEvidencePanel(disputeId: string) {
    setEvidencePanel(disputeId)
    setEvidenceForm({ ...EMPTY_EVIDENCE_FORM })
    const apiKey = getApiKey()
    if (!apiKey) return
    try {
      const res = await fetch(`/api/disputes/${disputeId}/evidence`, {
        headers: { 'X-API-Key': apiKey },
      })
      if (res.ok) {
        const { evidence } = await res.json()
        if (evidence) {
          setEvidenceForm(prev => {
            const updated = { ...prev }
            for (const key of Object.keys(updated) as (keyof EvidenceForm)[]) {
              if (evidence[key]) updated[key] = evidence[key]
            }
            return updated
          })
        }
      }
    } catch { /* leave defaults */ }
  }

  async function saveEvidence(disputeId: string) {
    const apiKey = getApiKey()
    if (!apiKey) return
    setSavingEvidence(true)
    try {
      const body: Record<string, string> = {}
      for (const [k, v] of Object.entries(evidenceForm)) {
        if (v.trim()) body[k] = v.trim()
      }
      await fetch(`/api/disputes/${disputeId}/evidence`, {
        method: 'PUT',
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setEvidencePanel(null)
    } catch (err) {
      console.error('Failed to save evidence:', err)
    } finally {
      setSavingEvidence(false)
    }
  }

  const INELIGIBILITY_LABELS: Record<string, string> = {
    'reason_code_not_10.4': 'Not 10.4 fraud',
    insufficient_historical_transactions: 'Need 12‑month backfill',
    no_consistent_identifier: 'Add IP or device on charges',
    billing_descriptor_mismatch: 'Keep billing descriptor stable',
    no_payment_method_fingerprint: 'Card fingerprint missing',
  }

  function getWhyNotCE3(reasons: string[] | undefined): string | null {
    if (!reasons?.length) return null
    return reasons.map((r) => INELIGIBILITY_LABELS[r] || r.replace(/_/g, ' ')).join(' · ')
  }

  const filteredDisputes = disputes
    .filter(dispute => {
      const matchesSearch = 
        dispute.stripe_dispute_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dispute.reason_code || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || dispute.dispute_category === categoryFilter
      
      return matchesSearch && matchesStatus && matchesCategory
    })
    .sort((a, b) => {
      let comparison = 0
      
      if (sortBy === 'amount') {
        comparison = a.amount - b.amount
      } else if (sortBy === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status)
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (loading) {
    return <DisputeQueueSkeleton />
  }

  const needsAttentionCount = disputes.filter(d => d.status === 'needs_attention').length

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-200/50 overflow-hidden animate-fade-in hover:shadow-hover transition-all duration-300">
      {/* Clean Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">
              {disputes.length} dispute{disputes.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search disputes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm w-full sm:w-72 font-medium transition-all hover:border-gray-300 shadow-soft"
              />
            </div>
            
            <div className="relative group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-5 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white font-medium transition-all min-w-[140px] hover:border-gray-300 shadow-soft cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="needs_attention">Needs Attention</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
            </div>

            <div className="relative group">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none pl-5 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white font-medium transition-all min-w-[140px] hover:border-gray-300 shadow-soft cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="fraud_10_4">Fraud (10.4)</option>
                <option value="authorization">Authorization</option>
                <option value="consumer">Consumer</option>
                <option value="processing_error">Processing</option>
                <option value="fraud_other">Other Fraud</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Premium Alert for disputes needing attention */}
      {needsAttentionCount > 0 && (
        <div className="mx-8 mt-6 mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-6 rounded-2xl animate-slide-up shadow-premium">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-base font-bold text-red-900 mb-2">
                {needsAttentionCount} Dispute{needsAttentionCount !== 1 ? 's' : ''} Need Attention
              </p>
              <p className="text-sm text-red-800 leading-relaxed">
                    These disputes failed PDF validation and require manual review before the evidence deadline.
                    Please review and submit evidence manually.
                  </p>
                </div>
              </div>
            </div>
          )}

      {/* ELITE FEATURE: Manual Review Alert for High-Value Disputes */}
      {disputes.filter(d => d.requires_manual_review && d.status === 'open').length > 0 && (
        <div className="mx-8 mt-6 mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 p-6 rounded-2xl animate-slide-up shadow-premium">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-base font-bold text-amber-900 mb-2">
                {disputes.filter(d => d.requires_manual_review && d.status === 'open').length} High-Value Dispute{disputes.filter(d => d.requires_manual_review && d.status === 'open').length !== 1 ? 's' : ''} Require Review
              </p>
              <p className="text-sm text-amber-800 leading-relaxed">
                These disputes are over $500 and require manual review before submission. 
                This allows you to add custom communication (e.g., customer complaint emails) that might override the forensic match.
                Review the PDF and click "Review & Submit" when ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {filteredDisputes.length === 0 ? (
        <div className="p-12">
          <EmptyState 
            title={disputes.length === 0 ? "No Disputes Found" : "No Disputes Match Your Filters"}
            description={disputes.length === 0 
              ? "Run the Shadow Pilot script to analyze your historical Stripe disputes and identify recoverable revenue."
              : "Try adjusting your search or filter criteria."
            }
          />
        </div>
      ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 via-white to-gray-50">
              <tr>
                <th 
                  className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-all duration-200 group whitespace-nowrap"
                  onClick={() => {
                    if (sortBy === 'date') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortBy('date')
                      setSortOrder('desc')
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="group-hover:text-gray-900 transition-colors">Dispute ID</span>
                    {sortBy === 'date' && (
                      <span className="text-blue-600 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
              </th>
                <th 
                  className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-all duration-200 group whitespace-nowrap"
                  onClick={() => {
                    if (sortBy === 'amount') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortBy('amount')
                      setSortOrder('desc')
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="group-hover:text-gray-900 transition-colors">Amount</span>
                    {sortBy === 'amount' && (
                      <span className="text-blue-600 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
              </th>
                <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
                <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span>Evidence</span>
                    <div className="group relative hidden sm:block">
                      <span className="text-gray-400 hover:text-gray-600 cursor-help">ℹ️</span>
                      <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <strong>CE 3.0:</strong> Forensic liability shift (highest win rate)<br/>
                        <strong>10.4 Evidence:</strong> Template evidence from charge data<br/>
                        <strong>Manual:</strong> Requires merchant-provided evidence
                      </div>
                    </div>
                  </div>
                </th>
                <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span>Network</span>
                    <div className="group relative hidden sm:block">
                      <span className="text-gray-400 hover:text-gray-600 cursor-help">ℹ️</span>
                      <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <strong>VISA CE 3.0:</strong> Requires 2+ historical matches (IP or Device)<br/>
                        <strong>Mastercard FPT:</strong> Requires 2+ matches with Device ID + (Account or IP)<br/>
                        <strong>Network:</strong> Automatically detected from card brand
                      </div>
                    </div>
                  </div>
                </th>
                <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Due Date
              </th>
                <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredDisputes.map((dispute) => {
                const compliance = getComplianceStatus(dispute)
                return (
                  <tr 
                    key={dispute.id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-indigo-50/40 transition-all duration-300 group border-b border-gray-100/50"
                  >
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"></div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-gray-900 font-mono group-hover:text-blue-600 transition-colors">
                            {dispute.stripe_dispute_id.slice(0, 12)}...
                          </div>
                          <div className="text-xs text-gray-500 mt-1 font-medium hidden sm:block">{dispute.reason_code}</div>
                        </div>
                      </div>
                  </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 whitespace-nowrap">
                      <div className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                        ${(dispute.amount / 100).toFixed(2)}
                      </div>
                  </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 whitespace-nowrap">
                    {getStatusBadge(dispute.status)}
                  </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5">
                      <div className="flex flex-col gap-1.5">
                        {(() => {
                          const badge = getEvidenceBadge(compliance.evidenceType)
                          const BadgeIcon = badge.icon
                          return (
                            <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border shadow-soft transition-all duration-200 hover:scale-105 ${badge.color}`}>
                              <BadgeIcon className="h-3 w-3 mr-1.5" />
                              {badge.label}
                            </div>
                          )
                        })()}
                        {compliance.category !== 'unknown' && (
                          <span className="text-[10px] text-gray-500 font-medium">
                            {getCategoryLabel(compliance.category)}
                          </span>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {compliance.liabilityShift && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-green-50 text-green-600 border border-green-200">
                              <CheckCircle className="h-2.5 w-2.5 mr-1" />
                              Liability Shift
                            </span>
                          )}
                          {compliance.historicalMatch && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-green-50 text-green-600 border border-green-200">
                              <CheckCircle className="h-2.5 w-2.5 mr-1" />
                              Match
                            </span>
                          )}
                        </div>
                        {compliance.evidenceType === 'regular_10_4' && getWhyNotCE3(dispute.ineligibility_reasons) && (
                          <div className="group/data relative mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                              <Info className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{getWhyNotCE3(dispute.ineligibility_reasons)}</span>
                            </span>
                          </div>
                        )}
                      </div>
                  </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold border ${
                        compliance.network === 'VISA' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : compliance.network === 'MASTERCARD'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {compliance.network === 'VISA' && '💳 '}
                        {compliance.network === 'MASTERCARD' && '🔴 '}
                        {compliance.network}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-bold text-gray-900">
                    {new Date(dispute.evidence_due_by).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 font-medium hidden sm:block">
                        {new Date(dispute.evidence_due_by).toLocaleTimeString()}
                      </div>
                  </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-1 sm:gap-0">
                      <button
                        onClick={() => downloadCompliancePack(dispute.id)}
                          className="group/btn inline-flex items-center px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl hover:from-blue-100 hover:to-cyan-100 border border-blue-200 shadow-soft hover:shadow-hover transition-all hover:scale-105 active:scale-95"
                          title="Download PDF"
                      >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover/btn:animate-bounce-subtle" />
                        <span className="hidden sm:inline">PDF</span>
                        <span className="sm:hidden">↓</span>
                      </button>
                      {/* Evidence form for consumer/auth/processing that need merchant input */}
                      {dispute.status === 'open' && !dispute.evidence_submission_type && ['consumer_evidence', 'auth_evidence', 'processing_evidence'].includes(dispute.evidence_type || '') && (
                        <button
                          onClick={() => openEvidencePanel(dispute.id)}
                          className="group/btn inline-flex items-center px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-teal-700 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg sm:rounded-xl hover:from-teal-100 hover:to-emerald-100 border border-teal-200 shadow-soft hover:shadow-hover transition-all hover:scale-105 active:scale-95"
                          title="Add evidence details"
                        >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Add Info</span>
                          <span className="sm:hidden">+</span>
                        </button>
                      )}
                      {dispute.auto_win_eligible && dispute.status === 'open' && (
                          <>
                            {dispute.requires_manual_review ? (
                              <button
                                onClick={() => submitEvidence(dispute.id)}
                                className="group/btn inline-flex items-center px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg sm:rounded-xl hover:from-amber-100 hover:to-yellow-100 border border-amber-200 shadow-soft hover:shadow-hover transition-all hover:scale-105 active:scale-95"
                                title="Requires Manual Review"
                              >
                                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover/btn:translate-x-0.5 transition-transform" />
                                <span className="hidden sm:inline">Review & Submit</span>
                                <span className="sm:hidden">Review</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => submitEvidence(dispute.id)}
                                className={`group/btn inline-flex items-center px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl shadow-soft hover:shadow-hover transition-all hover:scale-105 active:scale-95 border ${
                                  dispute.evidence_type === 'ce3_auto'
                                    ? 'text-violet-700 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border-violet-200'
                                    : 'text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200'
                                }`}
                                title={dispute.evidence_type === 'ce3_auto' ? 'Submit CE 3.0 evidence' : 'Submit evidence'}
                              >
                                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover/btn:translate-x-0.5 transition-transform" />
                                <span className="hidden sm:inline">Submit</span>
                                <span className="sm:hidden">Go</span>
                              </button>
                            )}
                          </>
                      )}
                    </div>
                  </td>
                </tr>
                )
              })}
          </tbody>
        </table>
      </div>
      )}

      {/* Evidence detail panel (slide-over) */}
      {evidencePanel && (() => {
        const targetDispute = disputes.find(d => d.id === evidencePanel)
        const category = targetDispute?.dispute_category || ''
        const isConsumer = category === 'consumer'
        const isAuth = category === 'authorization'
        const isProcessing = category === 'processing_error'

        return (
          <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEvidencePanel(null)} />
            <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-up">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Add Evidence</h3>
                  <p className="text-sm text-gray-500">{getCategoryLabel(category)} dispute</p>
                </div>
                <button onClick={() => setEvidencePanel(null)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Shared fields */}
                <Field label="Product / Service Description" value={evidenceForm.product_description} onChange={v => setEvidenceForm(f => ({ ...f, product_description: v }))} />
                <Field label="Customer Communication" value={evidenceForm.customer_communication} onChange={v => setEvidenceForm(f => ({ ...f, customer_communication: v }))} multiline />

                {/* Consumer-specific */}
                {isConsumer && (
                  <>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">Shipping & Delivery</p>
                    </div>
                    <Field label="Tracking Number" value={evidenceForm.shipping_tracking_number} onChange={v => setEvidenceForm(f => ({ ...f, shipping_tracking_number: v }))} />
                    <Field label="Carrier (e.g. UPS, FedEx)" value={evidenceForm.shipping_carrier} onChange={v => setEvidenceForm(f => ({ ...f, shipping_carrier: v }))} />
                    <Field label="Ship Date" value={evidenceForm.shipping_date} onChange={v => setEvidenceForm(f => ({ ...f, shipping_date: v }))} type="date" />
                    <Field label="Refund Policy" value={evidenceForm.refund_policy} onChange={v => setEvidenceForm(f => ({ ...f, refund_policy: v }))} multiline />
                    <Field label="Refund Policy Disclosure" value={evidenceForm.refund_policy_disclosure} onChange={v => setEvidenceForm(f => ({ ...f, refund_policy_disclosure: v }))} multiline />
                    <Field label="Service Documentation" value={evidenceForm.service_documentation} onChange={v => setEvidenceForm(f => ({ ...f, service_documentation: v }))} multiline />
                  </>
                )}

                {/* Authorization-specific */}
                {isAuth && (
                  <>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Authorization Proof</p>
                    </div>
                    <Field label="Receipt / Invoice" value={evidenceForm.receipt} onChange={v => setEvidenceForm(f => ({ ...f, receipt: v }))} multiline />
                  </>
                )}

                {/* Processing-specific */}
                {isProcessing && (
                  <>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">Processing Details</p>
                    </div>
                    {targetDispute?.reason_code === 'duplicate' && (
                      <>
                        <Field label="Why This Is NOT a Duplicate" value={evidenceForm.duplicate_charge_explanation} onChange={v => setEvidenceForm(f => ({ ...f, duplicate_charge_explanation: v }))} multiline />
                        <Field label="Original Charge ID (if applicable)" value={evidenceForm.duplicate_charge_id} onChange={v => setEvidenceForm(f => ({ ...f, duplicate_charge_id: v }))} />
                      </>
                    )}
                    {targetDispute?.reason_code === 'subscription_canceled' && (
                      <>
                        <Field label="Cancellation Policy" value={evidenceForm.cancellation_policy} onChange={v => setEvidenceForm(f => ({ ...f, cancellation_policy: v }))} multiline />
                        <Field label="How Policy Was Disclosed" value={evidenceForm.cancellation_policy_disclosure} onChange={v => setEvidenceForm(f => ({ ...f, cancellation_policy_disclosure: v }))} multiline />
                        <Field label="Rebuttal (why charge is valid)" value={evidenceForm.cancellation_rebuttal} onChange={v => setEvidenceForm(f => ({ ...f, cancellation_rebuttal: v }))} multiline />
                      </>
                    )}
                    {targetDispute?.reason_code === 'incorrect_amount' && (
                      <Field label="Refund Policy" value={evidenceForm.refund_policy} onChange={v => setEvidenceForm(f => ({ ...f, refund_policy: v }))} multiline />
                    )}
                  </>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  onClick={() => setEvidencePanel(null)}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveEvidence(evidencePanel)}
                  disabled={savingEvidence}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {savingEvidence ? 'Saving...' : 'Save Evidence'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function Field({ label, value, onChange, multiline, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
        />
      )}
    </div>
  )
}
