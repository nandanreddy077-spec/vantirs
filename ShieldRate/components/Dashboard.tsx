'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, DollarSign, TrendingUp, FileText, Shield, RefreshCw, LogOut, Settings, Sparkles, ArrowRight } from 'lucide-react'
import VAMPMonitor from './VAMPMonitor'
import DisputeQueue from './DisputeQueue'
import RecoverableAmount from './RecoverableAmount'
import VAMPMonitorSkeleton from './VAMPMonitorSkeleton'
import Link from 'next/link'

interface DashboardStats {
  totalDisputes: number
  vampDisputes: number
  totalTransactions: number
  vampRatio: number
  recoverableAmount: number
  autoWinEligible: number
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
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-primary p-2.5 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vantirs</h1>
                <p className="text-xs text-gray-500">CE 3.0 Compliance Engine</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50 font-medium text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <div className="text-right border-r border-gray-200 pr-4 mr-4">
                <p className="text-xs text-gray-500 font-medium">Last updated</p>
                <p className="text-sm font-bold text-gray-900">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-medium text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
        {/* Sync Transactions Banner - Show if no transactions */}
        {stats.totalTransactions === 0 && (
          <div className="mb-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-3xl p-8 shadow-premium">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-6 flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Get Started: Sync Historical Transactions
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  To enable CE 3.0 compliance matching, we need to sync your last 12 months of transactions. 
                  This allows Vantirs to find historical matches (120-365 days old) when disputes occur.
                </p>
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
                      
                      // Check if response is OK
                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
                      }
                      
                      const data = await response.json()
                      if (data.success) {
                        const message = data.result.synced > 0
                          ? `✅ Success! Synced ${data.result.synced} transactions. ${data.result.skipped > 0 ? `${data.result.skipped} already existed. ` : ''}Your dashboard will update shortly.`
                          : `ℹ️ No new transactions to sync. ${data.result.skipped > 0 ? `${data.result.skipped} transactions already synced.` : 'You may not have any transactions in the last 12 months.'}`
                        alert(message)
                        // Refresh stats after a short delay to allow DB to update
                        setTimeout(() => fetchDashboardStats(key, true), 2000)
                      } else {
                        throw new Error(data.message || data.error || 'Sync failed')
                      }
                    } catch (error: any) {
                      const errorMsg = error.message || 'Failed to sync transactions'
                      alert(`❌ Error: ${errorMsg}\n\nPlease check:\n- Your Stripe account has transactions\n- Your API key is valid\n- Try again in a moment`)
                      console.error('Sync error:', error)
                    } finally {
                      setSyncingTransactions(false)
                    }
                  }}
                  disabled={syncingTransactions || !apiKey}
                  className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                >
                  {syncingTransactions ? (
                    <>
                      <RefreshCw className="animate-spin h-6 w-6" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6" />
                      <span>Sync 12-Month History</span>
                      <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  ⏱️ This may take a few minutes depending on your transaction volume.
                </p>
              </div>
            </div>
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

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="group bg-white rounded-3xl shadow-premium p-8 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-500 hover-lift animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Total Disputes</p>
                <p className="text-4xl font-bold text-gray-900">{stats.totalDisputes}</p>
              </div>
              <div className="flex-shrink-0 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-4 group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-3xl shadow-premium p-8 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-500 hover-lift animate-fade-in animation-delay-600">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Total Transactions</p>
                <p className="text-4xl font-bold text-gray-900">
                  {stats.totalTransactions.toLocaleString()}
                </p>
              </div>
              <div className="flex-shrink-0 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-3xl shadow-premium p-8 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-500 hover-lift animate-fade-in animation-delay-1200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Recoverable</p>
                <p className="text-4xl font-bold text-gray-900">
                  ${(stats.recoverableAmount / 100).toFixed(2)}
                </p>
              </div>
              <div className="flex-shrink-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 group-hover:scale-110 transition-transform">
                <DollarSign className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-3xl shadow-premium p-8 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-500 hover-lift animate-fade-in animation-delay-1200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Auto-Win Eligible</p>
                <p className="text-4xl font-bold text-gray-900">{stats.autoWinEligible}</p>
              </div>
              <div className="flex-shrink-0 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl p-4 group-hover:scale-110 transition-transform">
                <Sparkles className="h-7 w-7 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* VAMP Monitor */}
        <div className="mb-8 animate-slide-up animation-delay-600">
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

        {/* Recoverable Amount Ticker */}
        {stats.recoverableAmount > 0 && (
          <div className="mb-8 animate-slide-up animation-delay-1200">
            <RecoverableAmount amount={stats.recoverableAmount} />
          </div>
        )}

        {/* Dispute Queue */}
        <div className="animate-slide-up animation-delay-1200">
          <DisputeQueue />
        </div>
      </main>
    </div>
  )
}
