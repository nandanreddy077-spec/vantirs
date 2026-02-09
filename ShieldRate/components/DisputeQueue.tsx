'use client'

import { useState, useEffect } from 'react'
import { FileText, CheckCircle, XCircle, Clock, Download, AlertTriangle, Search, Filter, ChevronDown, ExternalLink, CheckCircle2 } from 'lucide-react'
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
  requires_manual_review?: boolean // ELITE: Manual review flag
}

export default function DisputeQueue() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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
    }
  }

  // Filter and sort disputes
  const filteredDisputes = disputes
    .filter(dispute => {
      const matchesSearch = 
        dispute.stripe_dispute_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.reason_code.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter
      
      return matchesSearch && matchesStatus
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
      {/* Premium Header */}
      <div className="px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Dispute Queue</h2>
            <p className="text-sm text-gray-500 font-medium">
              {disputes.length} total dispute{disputes.length !== 1 ? 's' : ''}
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
                className="appearance-none pl-5 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white font-medium transition-all min-w-[160px] hover:border-gray-300 shadow-soft cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="needs_attention">Needs Attention</option>
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
          <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 via-white to-gray-50">
              <tr>
                <th 
                  className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-all duration-200 group"
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
                  className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-all duration-200 group"
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
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Status
              </th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Compliance
              </th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Network
              </th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Due Date
              </th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
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
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 font-mono group-hover:text-blue-600 transition-colors">
                            {dispute.stripe_dispute_id.slice(0, 20)}...
                          </div>
                          <div className="text-xs text-gray-500 mt-1 font-medium">{dispute.reason_code}</div>
                        </div>
                      </div>
                  </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                        ${(dispute.amount / 100).toFixed(2)}
                      </div>
                  </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                    {getStatusBadge(dispute.status)}
                  </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-2">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          compliance.liabilityShift 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-soft hover:shadow-hover hover:scale-105' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {compliance.liabilityShift ? (
                            <CheckCircle className="h-3 w-3 mr-1.5 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1.5 text-gray-400" />
                          )}
                          Liability Shift
                          </div>
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          compliance.historicalMatch 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-soft hover:shadow-hover hover:scale-105' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {compliance.historicalMatch ? (
                            <CheckCircle className="h-3 w-3 mr-1.5 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1.5 text-gray-400" />
                          )}
                          Historical Match
                          </div>
                        {compliance.usageAudit && (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-soft hover:shadow-hover hover:scale-105 transition-all duration-200">
                            <CheckCircle className="h-3 w-3 mr-1.5 text-green-600" />
                            Usage Audit
                          </div>
                        )}
                        </div>
                  </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                        {compliance.network}
                    </span>
                  </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                    {new Date(dispute.evidence_due_by).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {new Date(dispute.evidence_due_by).toLocaleTimeString()}
                      </div>
                  </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => downloadCompliancePack(dispute.id)}
                          className="group/btn inline-flex items-center px-4 py-2.5 text-sm font-semibold text-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl hover:from-blue-100 hover:to-cyan-100 border border-blue-200 shadow-soft hover:shadow-hover transition-all hover:scale-105 active:scale-95"
                          title="Download PDF"
                      >
                          <Download className="h-4 w-4 mr-2 group-hover/btn:animate-bounce-subtle" />
                        PDF
                      </button>
                      {dispute.auto_win_eligible && dispute.status === 'open' && (
                          <>
                            {dispute.requires_manual_review ? (
                              <div className="flex flex-col items-start">
                                <button
                                  onClick={() => submitEvidence(dispute.id)}
                                  className="group/btn inline-flex items-center px-4 py-2.5 text-sm font-semibold text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl hover:from-amber-100 hover:to-yellow-100 border border-amber-200 shadow-soft hover:shadow-hover transition-all hover:scale-105 active:scale-95"
                                  title="Requires Manual Review - Click to submit after review"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2 group-hover/btn:translate-x-0.5 transition-transform" />
                                  Review & Submit
                                </button>
                                <span className="text-xs text-amber-600 mt-1 font-medium">
                                  High-value: Review recommended
                                </span>
                              </div>
                            ) : (
                        <button
                                onClick={() => submitEvidence(dispute.id)}
                                className="group/btn inline-flex items-center px-4 py-2.5 text-sm font-semibold text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 border border-green-200 shadow-soft hover:shadow-hover transition-all hover:scale-105 active:scale-95"
                                title="Submit to Stripe"
                              >
                                <ExternalLink className="h-4 w-4 mr-2 group-hover/btn:translate-x-0.5 transition-transform" />
                          Submit
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
    </div>
  )
}
