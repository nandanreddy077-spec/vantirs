'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, DollarSign, TrendingUp, FileText } from 'lucide-react'
import VAMPMonitor from './VAMPMonitor'
import DisputeQueue from './DisputeQueue'
import RecoverableAmount from './RecoverableAmount'
import VAMPMonitorSkeleton from './VAMPMonitorSkeleton'

interface DashboardStats {
  totalDisputes: number
  vampDisputes: number // Disputes that count for VAMP
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

  useEffect(() => {
    // Get API key from props or localStorage
    const key = apiKey || localStorage.getItem('vantirs_api_key')
    if (key) {
      fetchDashboardStats(key)
    } else {
      setAuthError('API key required')
      setLoading(false)
    }
  }, [apiKey])

  async function fetchDashboardStats(key: string) {
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
      } else {
        setAuthError('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setAuthError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">{authError}</p>
          <a
            href="/dashboard"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Enter API Key
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vantirs</h1>
              <p className="text-sm text-gray-500">CE 3.0 Compliance Engine</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Banner for VAMP Threshold */}
        {stats.vampRatio > 0.9 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  VAMP Threshold Warning
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Your dispute ratio ({stats.vampRatio.toFixed(2)}%) exceeds the 0.9% threshold.
                  Activate CE 3.0 defense to reduce your ratio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Disputes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDisputes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTransactions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recoverable</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(stats.recoverableAmount / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Auto-Win Eligible</p>
                <p className="text-2xl font-bold text-gray-900">{stats.autoWinEligible}</p>
              </div>
            </div>
          </div>
        </div>

        {/* VAMP Monitor */}
        <div className="mb-8">
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
        <div className="mb-8">
          <RecoverableAmount amount={stats.recoverableAmount} />
        </div>

        {/* Dispute Queue */}
        <div>
          <DisputeQueue />
        </div>
      </main>
    </div>
  )
}

