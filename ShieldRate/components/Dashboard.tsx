'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, DollarSign, TrendingUp, FileText, Shield, RefreshCw, LogOut, Settings, Sparkles, ArrowRight, Clock, CheckCircle2, Info, HelpCircle } from 'lucide-react'
import VAMPMonitor from './VAMPMonitor'
import DisputeQueue from './DisputeQueue'
import RecoverableAmount from './RecoverableAmount'
import VAMPMonitorSkeleton from './VAMPMonitorSkeleton'
import VantirsLogo from './VantirsLogo'
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
}

interface DashboardProps {
  apiKey?: string | null
}

export default function Dashboard({ apiKey }: DashboardProps = {}) {
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
        headers: {
          'X-API-Key': key,
        },
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
    if (key) {
      fetchDashboardStats(key, true)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('vantirs_api_key')
    window.location.href = '/dashboard'
  }

  async function runShadowPilot() {
    const key = apiKey || localStorage.getItem('vantirs_api_key')
    if (!key) {
      alert('❌ API key required. Please log in again.')
      return
    }

    setRunningShadowPilot(true)
    try {
      const response = await fetch('/api/onboarding/shadow-pilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
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
      const errorMsg = error.message || 'Failed to run revenue analysis'
      alert(`❌ Error: ${errorMsg}\n\nPlease check:\n- Your Stripe account has disputes\n- Your API key is valid\n- Try again in a moment`)
      console.error('Shadow Pilot error:', error)
    } finally {
      setRunningShadowPilot(false)
    }
  }

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (authError && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-premium p-10 animate-scale-in border border-gray-200/50">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-30"></div>
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Authentication Required</h1>
            <p className="text-gray-600 text-lg">{authError}</p>
          </div>
          <Link
            href="/dashboard"
            className="block w-full gradient-primary text-white py-4 px-4 rounded-2xl font-semibold text-center hover:shadow-glow transition-all duration-300"
          >
            Enter API Key
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white">
      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center group">
              <VantirsLogo width={140} height={44} className="flex-shrink-0" />
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all disabled:opacity-50 font-medium text-xs sm:text-sm"
                aria-label="Refresh"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="text-right border-r border-gray-200 pr-2 sm:pr-4 mr-2 sm:mr-4 hidden sm:block">
                <p className="text-xs text-gray-500 font-medium">Last updated</p>
                <p className="text-sm font-bold text-gray-900">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all font-medium text-xs sm:text-sm"
                aria-label="Logout"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 pt-20 sm:pt-24 lg:pt-28">
        {/* Plan Info Banner */}
        {stats.plan && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="bg-white rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Plan:</span>
                <span className="ml-2 text-base sm:text-lg font-bold text-gray-900 uppercase">{stats.plan}</span>
              </div>
              {stats.plan === 'free' ? (
                <div className="text-xs sm:text-sm text-gray-700">
                  <span className="font-semibold">{stats.disputesUsed || 0}</span> / {stats.disputesLimit || 2} disputes used (lifetime)
                </div>
              ) : stats.disputesLimit !== 'unlimited' ? (
                <div className="text-xs sm:text-sm text-gray-700">
                  <span className="font-semibold">{stats.disputesUsedThisMonth || 0}</span> / {stats.disputesLimit} disputes this month
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-gray-700">
                  <span className="font-semibold">Unlimited</span> disputes
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 sm:space-x-3 w-full sm:w-auto">
              {stats.plan === 'free' && typeof stats.disputesLimit === 'number' && (stats.disputesUsed || 0) >= (stats.disputesLimit || 2) && (
                <a
                  href="/pricing"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 text-sm sm:text-base text-center"
                >
                  Upgrade Now
                </a>
              )}
              {stats.plan !== 'free' && stats.disputesLimit !== 'unlimited' && (stats.disputesUsedThisMonth || 0) >= (stats.disputesLimit || 0) && (
                <a
                  href="/pricing"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 text-sm sm:text-base text-center"
                >
                  Upgrade Plan
                </a>
              )}
            {stats.plan !== 'enterprise' && stats.plan !== 'free' && (
              <a
                href="/api/billing/portal"
                onClick={async (e) => {
                  e.preventDefault()
                  const key = apiKey || localStorage.getItem('vantirs_api_key')
                  if (!key) {
                    window.location.href = '/pricing'
                    return
                  }
                  
                  try {
                    const response = await fetch('/api/billing/portal', {
                      method: 'POST',
                      headers: {
                        'X-API-Key': key,
                      },
                    })
                    const data = await response.json()
                    // Razorpay returns manage_url instead of portal_url
                    if (data.subscription?.manage_url) {
                      window.open(data.subscription.manage_url, '_blank')
                    } else if (data.portal_url) {
                      // Fallback for Stripe (if still using)
                      window.location.href = data.portal_url
                    } else {
                      // If no URL, show subscription details or redirect to pricing
                      window.location.href = '/pricing'
                    }
                  } catch (err) {
                    console.error('Failed to open billing portal:', err)
                    window.location.href = '/pricing'
                  }
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                Manage Subscription →
              </a>
            )}
            {stats.plan === 'free' && (
              <a
                href="/pricing"
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                View Plans →
              </a>
            )}
          </div>
        )}
        
        {/* Simple Action Cards */}
        {stats.totalTransactions === 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Sync Transactions</h3>
                <p className="text-sm text-gray-600">Sync 12 months of history to enable CE 3.0 matching</p>
              </div>
              <button
                onClick={async () => {
                  const key = apiKey || localStorage.getItem('vantirs_api_key')
                  if (!key) {
                    alert('❌ API key required. Please log in again.')
                    return
                  }

                  setSyncingTransactions(true)
                  try {
                    const response = await fetch('/api/onboarding/sync-transactions', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`,
                      },
                    })
                    
                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
                    }
                    
                    const data = await response.json()
                    if (data.success) {
                      const message = data.result.synced > 0
                        ? `✅ Synced ${data.result.synced} transactions`
                        : `ℹ️ No new transactions to sync`
                      alert(message)
                      setTimeout(() => fetchDashboardStats(key, true), 2000)
                    } else {
                      throw new Error(data.message || data.error || 'Sync failed')
                    }
                  } catch (error: any) {
                    alert(`❌ Error: ${error.message || 'Failed to sync transactions'}`)
                    console.error('Sync error:', error)
                  } finally {
                    setSyncingTransactions(false)
                  }
                }}
                disabled={syncingTransactions || !apiKey}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {syncingTransactions ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <span>Sync Now</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Simple Revenue Analysis */}
        {!shadowPilotResults && stats.totalDisputes > 0 && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Revenue Analysis</h3>
                <p className="text-sm text-gray-600">See how much you can recover from past disputes</p>
              </div>
              <button
                onClick={runShadowPilot}
                disabled={runningShadowPilot || !apiKey}
                className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {runningShadowPilot ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Run Analysis</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Shadow Pilot Results */}
        {shadowPilotResults && (
          <div className="mb-8 relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200/60 rounded-3xl p-8 shadow-premium animate-slide-in-right">
            {/* Success glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
              <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      💰 Revenue Analysis Results
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Analysis of your last 90 days of disputes
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShadowPilotResults(null)}
                className="text-purple-600 hover:text-purple-700 font-semibold text-sm px-4 py-2 hover:bg-purple-50 rounded-lg transition-all hover:scale-105 active:scale-95"
              >
                Run Again
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="group bg-white rounded-xl p-5 shadow-soft border border-gray-100 hover:border-gray-200 hover:shadow-hover transition-all duration-300 hover-lift">
                <div className="text-sm font-medium text-gray-600 mb-2">Total Disputes</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{shadowPilotResults.total_disputes}</div>
                <div className="text-xs text-gray-500">Last 90 days</div>
              </div>
              <div className="group bg-white rounded-xl p-5 shadow-soft border border-gray-100 hover:border-green-200 hover:shadow-hover transition-all duration-300 hover-lift">
                <div className="text-sm font-medium text-gray-600 mb-2">CE 3.0 Eligible</div>
                <div className="text-3xl font-bold text-green-600 mb-1">{shadowPilotResults.ce_3_0_eligible}</div>
                <div className="text-xs text-gray-500">Auto-win eligible</div>
              </div>
              <div className="group bg-white rounded-xl p-5 shadow-soft border border-gray-100 hover:border-green-200 hover:shadow-hover transition-all duration-300 hover-lift">
                <div className="text-sm font-medium text-gray-600 mb-2">Recoverable</div>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  ${(shadowPilotResults.recoverable_amount / 100).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">Potential recovery</div>
              </div>
              <div className="group bg-white rounded-xl p-5 shadow-soft border border-gray-100 hover:border-blue-200 hover:shadow-hover transition-all duration-300 hover-lift">
                <div className="text-sm font-medium text-gray-600 mb-2">VAMP Savings</div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  ${shadowPilotResults.vamp_penalty_savings.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">Penalty avoidance</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 mb-4 hover:shadow-hover transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <div className="text-sm font-semibold text-gray-700">VAMP Ratio Impact</div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Current Ratio</div>
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {(shadowPilotResults.current_vamp_ratio * 100).toFixed(2)}%
                  </div>
                  {shadowPilotResults.current_vamp_ratio > 0.015 && (
                    <div className="inline-flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Above threshold</span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-green-100 rounded-full flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Projected Ratio</div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {(shadowPilotResults.projected_vamp_ratio * 100).toFixed(2)}%
                  </div>
                  {shadowPilotResults.projected_vamp_ratio <= 0.015 && (
                    <div className="inline-flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Below threshold</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {shadowPilotResults.ce_3_0_eligible > 0 
                    ? `By winning ${shadowPilotResults.ce_3_0_eligible} CE 3.0 disputes, your VAMP ratio drops to ${(shadowPilotResults.projected_vamp_ratio * 100).toFixed(2)}%, keeping you below the 1.5% threshold.`
                    : 'Sync your historical transactions to enable CE 3.0 matching and see recoverable revenue.'}
                </p>
              </div>
            </div>

            {shadowPilotResults.ce_3_0_eligible > 0 && (
              <div className="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xl mb-1">
                      ${(shadowPilotResults.recoverable_amount / 100).toFixed(2)} Recoverable
                    </div>
                    <div className="text-sm text-green-50">
                      With 65-85% win rate, you could recover ${((shadowPilotResults.recoverable_amount * 0.65) / 100).toFixed(2)} - ${((shadowPilotResults.recoverable_amount * 0.85) / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sync Disputes Banner - Show if no disputes */}
        {stats.totalDisputes === 0 && (
          <div className="mb-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-3xl p-8 shadow-premium">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-6 flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Sync Existing Disputes from Stripe
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  You may have disputes in Stripe that haven't been imported yet. 
                  Click below to sync all your existing disputes. This will process them 
                  with CE 3.0 matching and add them to your dashboard.
                </p>
                <button
                  onClick={async () => {
                    const key = apiKey || localStorage.getItem('vantirs_api_key')
                    if (!key) {
                      alert('❌ API key required. Please log in again.')
                      return
                    }

                    setSyncingDisputes(true)
                    try {
                      const response = await fetch('/api/onboarding/sync-disputes', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${key}`,
                        },
                      })
                      
                      // Check if response is OK
                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
                      }
                      
                      const data = await response.json()
                      if (data.success) {
                        const message = data.result.synced > 0
                          ? `✅ Success! Synced ${data.result.synced} disputes. ${data.result.skipped > 0 ? `${data.result.skipped} already existed. ` : ''}Your dashboard will update shortly.`
                          : `ℹ️ No new disputes to sync. ${data.result.skipped > 0 ? `${data.result.skipped} disputes already synced.` : 'You may not have any disputes in Stripe.'}`
                        alert(message)
                        // Refresh stats after a short delay to allow DB to update
                        setTimeout(() => fetchDashboardStats(key, true), 2000)
                      } else {
                        throw new Error(data.message || data.error || 'Sync failed')
                      }
                    } catch (error: any) {
                      const errorMsg = error.message || 'Failed to sync disputes'
                      alert(`❌ Error: ${errorMsg}\n\nPlease check:\n- Your Stripe account has disputes\n- Your API key is valid\n- Try again in a moment`)
                      console.error('Dispute sync error:', error)
                    } finally {
                      setSyncingDisputes(false)
                    }
                  }}
                  disabled={syncingDisputes || !apiKey}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                >
                  {syncingDisputes ? (
                    <>
                      <RefreshCw className="animate-spin h-6 w-6" />
                      <span>Syncing Disputes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6" />
                      <span>Sync Disputes from Stripe</span>
                      <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  ⏱️ This may take a few minutes depending on your dispute volume.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Premium Alert Banner */}
        {stats.vampRatio > 0.015 && (
          <div className="mb-8 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-l-4 border-red-500 p-6 rounded-3xl shadow-premium animate-slide-up">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-lg font-bold text-red-900 mb-2">
                  VAMP Threshold Warning
                </p>
                <p className="text-red-800 leading-relaxed">
                  Your dispute ratio ({stats.vampRatio.toFixed(2)}%) exceeds the 1.5% threshold.
                  Activate CE 3.0 defense to reduce your ratio and avoid penalties.
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Clean Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Disputes</p>
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalDisputes}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Recoverable</p>
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${(stats.recoverableAmount / 100).toFixed(0)}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Auto-Win</p>
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.autoWinEligible}</p>
          </div>
        </div>

        {/* VAMP Monitor - Simplified */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">VAMP Ratio</h2>
              <p className="text-xs text-gray-500 mt-1">Threshold: 1.5% (April 1, 2026)</p>
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

        {/* Recoverable Amount - Simplified */}
        {stats.recoverableAmount > 0 && (
          <div className="mb-8">
            <RecoverableAmount amount={stats.recoverableAmount} />
          </div>
        )}

        {/* Dispute Queue - Simplified */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Disputes</h2>
          </div>
          <DisputeQueue />
        </div>
      </main>
    </div>
  )
}
