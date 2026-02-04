'use client'

import { useState, useEffect } from 'react'
import { FileText, CheckCircle, XCircle, Clock, Download, AlertTriangle } from 'lucide-react'
import DisputeQueueSkeleton from './DisputeQueueSkeleton'
import EmptyState from './EmptyState'

interface Dispute {
  id: string
  stripe_dispute_id: string
  amount: number
  status: string
  reason_code: string
  v_compliance_score: number // Kept for backward compatibility
  auto_win_eligible: boolean
  liability_shift_eligible?: boolean
  historical_match_found?: boolean
  usage_audit_attached?: boolean
  card_network?: string
  match_count?: number
  evidence_due_by: string
  created_at: string
}

export default function DisputeQueue() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)

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

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { color: string; icon: any; label: string }> = {
      open: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Open' },
      won: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Won' },
      lost: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Lost' },
      warning_needs_response: { color: 'bg-orange-100 text-orange-800', icon: FileText, label: 'Needs Response' },
      needs_attention: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Needs Attention' },
    }

    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: FileText, label: status }
    const Icon = statusInfo.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <Icon className="h-3 w-3 mr-1" />
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

  if (loading) {
    return <DisputeQueueSkeleton />
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Dispute Queue</h2>
        <p className="text-sm text-gray-500 mt-1">
          All chargeback disputes with compliance scores
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="p-6">
          <EmptyState />
        </div>
      ) : (
        <>
          {/* Alert for disputes needing attention */}
          {disputes.filter(d => d.status === 'needs_attention').length > 0 && (
            <div className="mx-6 mt-4 mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {disputes.filter(d => d.status === 'needs_attention').length} Dispute(s) Need Attention
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    These disputes failed PDF validation and require manual review before the evidence deadline.
                    Please review and submit evidence manually.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dispute ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Compliance Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Network
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {disputes.length === 0 ? null : (
              disputes.map((dispute) => (
                <tr key={dispute.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {dispute.stripe_dispute_id.slice(0, 20)}...
                    </div>
                    <div className="text-xs text-gray-500">{dispute.reason_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${(dispute.amount / 100).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(dispute.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const status = getComplianceStatus(dispute)
                      return (
                        <div className="space-y-1">
                          <div className={`text-xs ${status.liabilityShift ? 'text-green-600 font-semibold' : 'text-red-600'}`}>
                            LIABILITY_SHIFT: {status.liabilityShift ? 'YES' : 'NO'}
                          </div>
                          <div className={`text-xs ${status.historicalMatch ? 'text-green-600' : 'text-gray-500'}`}>
                            HIST_MATCH: {status.historicalMatch ? 'YES' : 'NO'}
                          </div>
                          <div className={`text-xs ${status.usageAudit ? 'text-green-600' : 'text-gray-500'}`}>
                            USAGE_AUDIT: {status.usageAudit ? 'YES' : 'NO'}
                          </div>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-medium text-gray-700">
                      {dispute.card_network || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(dispute.evidence_due_by).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => downloadCompliancePack(dispute.id)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </button>
                      {dispute.auto_win_eligible && dispute.status === 'open' && (
                        <button
                          onClick={async () => {
                            try {
                              const apiKey = getApiKey()
                              if (!apiKey) {
                                alert('API key required')
                                return
                              }

                              const response = await fetch(`/api/disputes/${dispute.id}/submit`, {
                                method: 'POST',
                                headers: {
                                  'X-API-Key': apiKey,
                                },
                              })
                              if (response.ok) {
                                alert('Evidence submitted to Stripe successfully!')
                                fetchDisputes()
                              } else {
                                alert('Failed to submit evidence')
                              }
                            } catch (error) {
                              alert('Error submitting evidence')
                            }
                          }}
                          className="text-green-600 hover:text-green-900 inline-flex items-center text-xs"
                        >
                          Submit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  )
}


