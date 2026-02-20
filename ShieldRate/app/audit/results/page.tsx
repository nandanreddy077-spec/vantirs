'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, DollarSign, TrendingUp, FileText, AlertTriangle, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import VantirsLogo from '@/components/VantirsLogo'

interface AuditResult {
  total_disputes: number
  ce_3_0_eligible: number
  golden_matches: number
  recoverable_amount: number
  current_vamp_ratio: number
  projected_vamp_ratio: number
  vamp_penalty_savings: number
  disputes_by_reason_code: Record<string, number>
  eligible_disputes: Array<{
    dispute_id: string
    amount: number
    reason_code: string
    matches_found: number
  }>
}

function AuditResultsContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get results using secure token (preferred) or audit ID (fallback)
    const token = searchParams?.get('token')
    const auditId = searchParams?.get('id')
    
    if (token || auditId) {
      // Fetch results securely from server
      const url = token 
        ? `/api/audit/results?token=${encodeURIComponent(token)}`
        : `/api/audit/results?id=${encodeURIComponent(auditId!)}`
      
      fetch(url)
        .then(res => {
          if (res.status === 410) {
            setError('Audit results have expired. Please run a new audit.')
            setLoading(false)
            return
          }
          return res.json()
        })
        .then(data => {
          if (data && data.success && data.result) {
            setResult(data.result)
          } else {
            setError(data?.error || 'Failed to load audit results')
          }
          setLoading(false)
        })
        .catch(err => {
          setError('Failed to load audit results. Please try again.')
          setLoading(false)
        })
    } else {
      // No token or ID provided
      setError('Invalid audit link. Please run a new audit.')
      setLoading(false)
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Loading audit results...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-premium p-10 animate-scale-in border border-gray-200/50 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-30"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Error</h1>
          <p className="text-gray-600 mb-8">{error || 'No audit results found'}</p>
          <Link
            href="/"
            className="inline-block gradient-primary text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-glow transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const recoverableDollars = (result.recoverable_amount / 100).toFixed(2)
  const winRateEstimate = result.total_disputes > 0 
    ? ((result.ce_3_0_eligible / result.total_disputes) * 100).toFixed(1)
    : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center group">
              <VantirsLogo width={160} height={52} className="flex-shrink-0" />
            </Link>
            <Link
              href="/onboarding"
              className="gradient-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:shadow-glow transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your 90-Day CE 3.0 Audit Results
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Analysis of your Stripe account completed successfully
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-premium hover:shadow-hover transition-all hover-lift">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6 mx-auto">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-5xl font-bold text-gray-900 mb-2">{result.total_disputes}</div>
            <div className="text-base text-gray-600 font-medium">Total Disputes</div>
            <div className="text-sm text-gray-500 mt-2">Last 90 days</div>
          </div>

          <div className="bg-white rounded-3xl p-8 border-2 border-green-200 shadow-premium hover:shadow-hover transition-all hover-lift">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-5xl font-bold text-green-600 mb-2">{result.ce_3_0_eligible}</div>
            <div className="text-base text-gray-600 font-medium">CE 3.0 Eligible</div>
            <div className="text-sm text-gray-500 mt-2">{winRateEstimate}% of disputes</div>
          </div>

          <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 shadow-premium hover:shadow-hover transition-all hover-lift">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-6 mx-auto">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-4xl font-bold text-purple-600 mb-2">${recoverableDollars}</div>
            <div className="text-base text-gray-600 font-medium">Recoverable Revenue</div>
            <div className="text-sm text-gray-500 mt-2">65-85% win rate</div>
          </div>

          <div className="bg-white rounded-3xl p-8 border-2 border-orange-200 shadow-premium hover:shadow-hover transition-all hover-lift">
            <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-6 mx-auto">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {(result.current_vamp_ratio * 100).toFixed(2)}%
            </div>
            <div className="text-base text-gray-600 font-medium">Current VAMP</div>
            <div className="text-sm text-gray-500 mt-2">
              {(result.projected_vamp_ratio * 100).toFixed(2)}% projected
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="bg-white rounded-3xl p-8 md:p-12 border-2 border-gray-200 shadow-premium mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <Sparkles className="h-8 w-8 mr-3 text-blue-600" />
            What This Means for You
          </h2>

          <div className="space-y-6">
            {result.ce_3_0_eligible > 0 ? (
              <>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-green-900 mb-3">💰 Revenue Recovery Opportunity</h3>
                  <p className="text-green-800 mb-4">
                    You have <strong>{result.ce_3_0_eligible} disputes</strong> that qualify for Visa CE 3.0 liability shift.
                    Based on typical win rates (65-85%), you could recover approximately:
                  </p>
                  <div className="text-3xl font-bold text-green-700 mb-2">
                    ${((parseFloat(recoverableDollars) * 0.65).toFixed(2))} - ${((parseFloat(recoverableDollars) * 0.85).toFixed(2))}
                  </div>
                  <p className="text-sm text-green-700">
                    by fighting these chargebacks with proper evidence.
                  </p>
                </div>

                {result.current_vamp_ratio > 0.015 && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-orange-900 mb-3">⚠️ VAMP Threshold Alert</h3>
                    <p className="text-orange-800 mb-2">
                      Your current VAMP ratio is <strong>{(result.current_vamp_ratio * 100).toFixed(2)}%</strong>, 
                      which is above the 1.5% threshold.
                    </p>
                    <p className="text-orange-800">
                      By winning CE 3.0 eligible disputes, your ratio would drop to{' '}
                      <strong>{(result.projected_vamp_ratio * 100).toFixed(2)}%</strong>, potentially saving you{' '}
                      <strong>${result.vamp_penalty_savings}</strong> in VAMP penalties.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-3">No CE 3.0 Eligible Disputes Found</h3>
                <p className="text-blue-800">
                  In the last 90 days, we didn't find any disputes that qualify for CE 3.0 liability shift.
                  This could mean:
                </p>
                <ul className="list-disc list-inside text-blue-800 mt-3 space-y-1">
                  <li>You don't have enough historical transactions (need 2+ from 120-365 days ago)</li>
                  <li>Your disputes don't have matching IP/device fingerprints</li>
                  <li>Your dispute volume is low (which is good!)</li>
                </ul>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-3">🚀 Next Steps</h3>
              <p className="text-blue-800 mb-4">
                Ready to start recovering revenue automatically? Vantirs can:
              </p>
              <ul className="list-disc list-inside text-blue-800 space-y-2 mb-6">
                <li>Automatically detect CE 3.0 eligible disputes in real-time</li>
                <li>Generate bank-ready forensic evidence in seconds</li>
                <li>Auto-submit evidence to Stripe for eligible disputes</li>
                <li>Monitor your VAMP ratio and alert you when it's at risk</li>
              </ul>
              <Link
                href="/onboarding"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-glow hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                <span>Get Started with Vantirs</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link
            href="/pricing"
            className="inline-block text-gray-600 hover:text-gray-900 font-semibold text-lg"
          >
            View Pricing Plans →
          </Link>
        </div>
      </main>
    </div>
  )
}

export default function AuditResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuditResultsContent />
    </Suspense>
  )
}

