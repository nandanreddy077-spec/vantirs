'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, DollarSign, TrendingUp, FileText, Shield, RefreshCw, LogOut, Sparkles, ArrowRight, CheckCircle2, Info } from 'lucide-react'
import VAMPMonitor from './VAMPMonitor'
import DisputeQueue from './DisputeQueue'
import RecoverableAmount from './RecoverableAmount'
import VAMPMonitorSkeleton from './VAMPMonitorSkeleton'
import VantirsLogo from './VantirsLogo'
import { useToast } from './Toast'
import Link from 'next/link'

interface DashboardStats {
  totalDisputes: number
  vampDisputes: number
  totalTransactions: number
  vampRatio: number
  recoverableAmount: number
  autoWinEligible: number
  plan?: string
  disputesUsed?: number
  disputesLimit?: number | 'unlimited'
  disputesUsedThisMonth?: number
  subscriptionStatus?: string
  ce3Addon?: boolean
  evidenceBreakdown?: {
    ce3: number
    regular: number
    emv: number
    cardPresent: number
    consumer: number
    authorization: number
    processing: number
    skipped: number
    manual: number
  }
}

interface DashboardProps {
  apiKey?: string | null
}

export default function Dashboard({ apiKey }: DashboardProps = {}) {
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalDisputes: 0,
    vampDisputes: 0,
    totalTransactions: 0,
    vampRatio: 0,
    recoverableAmount: 0,
    autoWinEligible: 0,
  })
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [syncingDisputes, setSyncingDisputes] = useState(false)
  const [syncingTransactions, setSyncingTransactions] = useState(false)
  const [runningShadowPilot, setRunningShadowPilot] = useState(false)
  const [shadowPilotResults, setShadowPilotResults] = useState<any>(null)

  useEffect(() => {
    const key = apiKey || localStorage.getItem('vantirs_api_key')
    if (key) {
      fetchDashboardStats(key)
    } else {
      setAuthError('API key required')
      setLoading(false)
    }
  }, [apiKey])

  async function fetchDashboardStats(key: string, showRefreshing = false) {
    if (showRefreshing) setRefreshing(true)

    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: { 'X-API-Key': key },
      })

      if (response.status === 401) {
        setAuthError('Invalid API key. Please check your key and try again.')
        localStorage.removeItem('vantirs_api_key')
        setLoading(false)
        return
      }

      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setAuthError(null)
        setLastUpdated(new Date())
      } else {
        setAuthError('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setAuthError('Failed to connect to server')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    const key = apiKey || localStorage.getItem('vantirs_api_key')
    if (key) fetchDashboardStats(key, true)
  }

  const handleLogout = () => {
    localStorage.removeItem('vantirs_api_key')
    window.location.href = '/dashboard'
  }

  async function syncTransactions() {
    const key = apiKey || localStorage.getItem('vantirs_api_key')
    if (!key) {
      toast('API key required. Please log in again.', 'error')
      return
    }

    setSyncingTransactions(true)
    try {
      const response = await fetch('/api/onboarding/sync-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        toast(
          data.result.synced > 0
            ? `Synced ${data.result.synced} transactions`
            : 'No new transactions to sync',
          data.result.synced > 0 ? 'success' : 'info'
        )
        setTimeout(() => fetchDashboardStats(key, true), 2000)
      } else {
        throw new Error(data.message || data.error || 'Sync failed')
      }
    } catch (error: any) {
      toast(error.message || 'Failed to sync transactions', 'error')
      console.error('Sync error:', error)
    } finally {
      setSyncingTransactions(false)
    }
  }

  async function syncDisputes() {
    const key = apiKey || localStorage.getItem('vantirs_api_key')
    if (!key) {
      toast('API key required. Please log in again.', 'error')
      return
    }

    setSyncingDisputes(true)
    try {
      const response = await fetch('/api/onboarding/sync-disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        const msg = data.result.synced > 0
          ? `Synced ${data.result.synced} disputes${data.result.skipped > 0 ? `. ${data.result.skipped} already existed.` : ''}`
          : `No new disputes found${data.result.skipped > 0 ? `. ${data.result.skipped} already synced.` : ''}`
        toast(msg, data.result.synced > 0 ? 'success' : 'info')
        setTimeout(() => fetchDashboardStats(key, true), 2000)
      } else {
        throw new Error(data.message || 'Sync failed')
      }
    } catch (error: any) {
      toast(error.message || 'Failed to sync disputes', 'error')
      console.error('Sync error:', error)
    } finally {
      setSyncingDisputes(false)
    }
  }

  async function runShadowPilot() {
    const key = apiKey || localStorage.getItem('vantirs_api_key')
    if (!key) {
      toast('API key required. Please log in again.', 'error')
      return
    }

    setRunningShadowPilot(true)
    try {
      const response = await fetch('/api/onboarding/shadow-pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setShadowPilotResults(data.result)
      } else {
        throw new Error(data.message || data.error || 'Analysis failed')
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Something went wrong'
      if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
        toast('Please log in again with your API key.', 'error')
      } else if (errorMsg.includes('disputes')) {
        toast('No disputes found to analyze. Make sure your Stripe account is connected.', 'warning')
      } else {
        toast('Could not analyze your account right now. Please try again.', 'error')
      }
      console.error('Shadow Pilot error:', error)
    } finally {
      setRunningShadowPilot(false)
    }
  }

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (authError && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mb-4">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h1>
            <p className="text-sm text-gray-500">{authError}</p>
          </div>
          <Link
            href="/dashboard"
            className="block w-full bg-gray-900 text-white py-3 px-4 rounded-xl font-semibold text-sm text-center hover:bg-gray-800 transition-colors"
          >
            Enter API Key
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <VantirsLogo width={130} height={42} className="flex-shrink-0" />
            </Link>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="text-right border-r border-gray-200 pr-3 mr-1 hidden sm:block">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Updated</p>
                <p className="text-xs font-semibold text-gray-700">{lastUpdated.toLocaleTimeString()}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20 sm:pt-24">
        {/* Plan Info */}
        {stats.plan && (
          <div className="mb-4 bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Plan: <span className="font-semibold text-gray-900 uppercase">{stats.plan}</span></span>
              <span className="text-sm text-gray-400">&middot;</span>
              <span className="text-sm text-gray-500">Unlimited disputes</span>
            </div>
            <span className="text-green-600 font-medium text-sm hidden sm:block">All features included</span>
          </div>
        )}

        {/* Sync Transactions */}
        {stats.totalTransactions === 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Sync Transactions</h3>
                <p className="text-sm text-gray-600">Sync 12 months of history to enable CE 3.0 matching</p>
              </div>
              <button
                onClick={syncTransactions}
                disabled={syncingTransactions || !apiKey}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
              >
                {syncingTransactions ? (
                  <><RefreshCw className="animate-spin h-4 w-4" /><span>Syncing...</span></>
                ) : (
                  <span>Sync Now</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Revenue Recovery Analysis */}
        {!shadowPilotResults && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Find Recoverable Revenue</h3>
                  <p className="text-sm text-gray-500">
                    {stats.totalDisputes > 0
                      ? "Discover how much you can recover from past chargebacks"
                      : "Analyze your Stripe account to find recoverable revenue"}
                  </p>
                </div>
              </div>
              <button
                onClick={runShadowPilot}
                disabled={runningShadowPilot || !apiKey}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 whitespace-nowrap"
              >
                {runningShadowPilot ? (
                  <><RefreshCw className="animate-spin h-4 w-4" /><span>Analyzing...</span></>
                ) : (
                  <><Sparkles className="h-4 w-4" /><span>Analyze Now</span></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Revenue Recovery Results */}
        {shadowPilotResults && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Revenue Recovery Analysis</h3>
                  <p className="text-xs text-gray-500">Based on your last 90 days of chargebacks</p>
                </div>
              </div>
              <button
                onClick={() => setShadowPilotResults(null)}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Run Again
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100">
              <div className="bg-white p-5">
                <div className="text-xs font-medium text-gray-500 mb-1">Total Chargebacks</div>
                <div className="text-2xl font-bold text-gray-900">{shadowPilotResults.total_disputes}</div>
              </div>
              <div className="bg-white p-5">
                <div className="text-xs font-medium text-gray-500 mb-1">Winnable</div>
                <div className="text-2xl font-bold text-green-600">{shadowPilotResults.ce_3_0_eligible}</div>
              </div>
              <div className="bg-white p-5">
                <div className="text-xs font-medium text-gray-500 mb-1">Recoverable</div>
                <div className="text-2xl font-bold text-green-600">${(shadowPilotResults.recoverable_amount / 100).toFixed(0)}</div>
              </div>
              <div className="bg-white p-5">
                <div className="text-xs font-medium text-gray-500 mb-1">Penalty Savings</div>
                <div className="text-2xl font-bold text-blue-600">${shadowPilotResults.vamp_penalty_savings.toFixed(0)}</div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-100">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">VAMP Ratio Impact</span>
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Current</div>
                  <span className={`text-xl font-bold ${shadowPilotResults.current_vamp_ratio > 0.015 ? 'text-red-600' : 'text-gray-900'}`}>
                    {(shadowPilotResults.current_vamp_ratio * 100).toFixed(2)}%
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Projected</div>
                  <span className={`text-xl font-bold ${shadowPilotResults.projected_vamp_ratio <= 0.015 ? 'text-green-600' : 'text-red-600'}`}>
                    {(shadowPilotResults.projected_vamp_ratio * 100).toFixed(2)}%
                  </span>
                </div>
                {shadowPilotResults.projected_vamp_ratio <= 0.015 && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                    Below 1.5% threshold
                  </span>
                )}
              </div>
              {shadowPilotResults.ce_3_0_eligible > 0 && (
                <p className="text-sm text-gray-500 mt-3">
                  Win {shadowPilotResults.ce_3_0_eligible} eligible disputes to recover ${((shadowPilotResults.recoverable_amount * 0.65) / 100).toFixed(0)}&ndash;${((shadowPilotResults.recoverable_amount * 0.85) / 100).toFixed(0)} (65-85% win rate).
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sync Disputes Banner */}
        {stats.totalDisputes === 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Sync Disputes from Stripe</h3>
                  <p className="text-sm text-gray-500">Import existing disputes and process them automatically.</p>
                </div>
              </div>
              <button
                onClick={syncDisputes}
                disabled={syncingDisputes || !apiKey}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 whitespace-nowrap"
              >
                {syncingDisputes ? (
                  <><RefreshCw className="animate-spin h-4 w-4" /><span>Syncing...</span></>
                ) : (
                  <span>Sync Now</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* VAMP Alert */}
        {stats.vampRatio > 0.015 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900 mb-1">VAMP Threshold Warning</p>
                <p className="text-sm text-red-700">
                  Your dispute ratio ({(stats.vampRatio * 100).toFixed(2)}%) exceeds the 1.5% threshold.
                  Dispute defense is active to reduce your ratio and avoid penalties.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Disputes" value={stats.totalDisputes.toString()} icon={FileText} color="text-blue-500" />
          <StatCard label="Transactions" value={stats.totalTransactions.toLocaleString()} icon={TrendingUp} color="text-green-500" />
          <StatCard label="Recoverable" value={`$${(stats.recoverableAmount / 100).toFixed(0)}`} icon={DollarSign} color="text-purple-500" />
          <StatCard label="Auto-Win" value={stats.autoWinEligible.toString()} icon={Sparkles} color="text-amber-500" />
        </div>

        {/* Evidence Breakdown */}
        {stats.evidenceBreakdown && (
          <div className="mb-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Evidence Breakdown</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <EvidenceChip label="CE 3.0" count={stats.evidenceBreakdown.ce3} color="violet" />
              <EvidenceChip label="10.4 CNP" count={stats.evidenceBreakdown.regular} color="blue" />
              <EvidenceChip label="EMV 10.1/2" count={stats.evidenceBreakdown.emv} color="cyan" />
              <EvidenceChip label="10.3 Present" count={stats.evidenceBreakdown.cardPresent} color="sky" />
              <EvidenceChip label="Consumer" count={stats.evidenceBreakdown.consumer} color="emerald" />
              <EvidenceChip label="Auth" count={stats.evidenceBreakdown.authorization} color="indigo" />
              <EvidenceChip label="Processing" count={stats.evidenceBreakdown.processing} color="orange" />
              <EvidenceChip label="10.5 Skip" count={stats.evidenceBreakdown.skipped} color="red" />
              <EvidenceChip label="Manual" count={stats.evidenceBreakdown.manual} color="amber" />
            </div>
          </div>
        )}

        {/* VAMP Monitor */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">VAMP Ratio</h2>
              <p className="text-xs text-gray-500 mt-0.5">Threshold: 1.5% (April 1, 2026)</p>
            </div>
          </div>
          {loading ? (
            <VAMPMonitorSkeleton />
          ) : (
            <VAMPMonitor
              vampRatio={stats.vampRatio}
              totalDisputes={stats.totalDisputes}
              vampDisputes={stats.vampDisputes}
              totalTransactions={stats.totalTransactions}
            />
          )}
        </div>

        {/* Recoverable Amount */}
        {stats.recoverableAmount > 0 && (
          <div className="mb-8">
            <RecoverableAmount amount={stats.recoverableAmount} />
          </div>
        )}

        {/* Dispute Queue */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Disputes</h2>
          </div>
          <DisputeQueue />
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function EvidenceChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`text-center p-2.5 rounded-xl bg-${color}-50 border border-${color}-200`}>
      <p className={`text-lg font-bold text-${color}-700`}>{count}</p>
      <p className={`text-[9px] font-medium text-${color}-600 mt-0.5`}>{label}</p>
    </div>
  )
}
