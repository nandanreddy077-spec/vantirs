'use client'

import { useEffect, useState } from 'react'
import Dashboard from '@/components/Dashboard'
import { Mail, X, AlertCircle, CheckCircle2, Loader2, ArrowRight, Lock } from 'lucide-react'
import Link from 'next/link'
import VantirsLogo from '@/components/VantirsLogo'

export default function MerchantDashboard() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [recoveryResult, setRecoveryResult] = useState<{
    success: boolean
    message: string
    api_key?: string
  } | null>(null)

  useEffect(() => {
    // Check for API key in URL params first
    const params = new URLSearchParams(window.location.search)
    const urlApiKey = params.get('api_key')

    if (urlApiKey) {
      // Store in localStorage for future visits
      localStorage.setItem('vantirs_api_key', urlApiKey)
      setApiKey(urlApiKey)
      setLoading(false)
      return
    }

    // Check localStorage
    const storedApiKey = localStorage.getItem('vantirs_api_key')
    if (storedApiKey) {
      setApiKey(storedApiKey)
      setLoading(false)
      return
    }

    // No API key found
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Minimal Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-sm mx-auto flex items-center justify-between">
            <Link href="/">
              <VantirsLogo width={120} height={38} />
            </Link>
            <Link href="/onboarding" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              New here?
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-sm w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-900 rounded-2xl mb-4">
                <Lock className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in to Dashboard</h1>
              <p className="text-sm text-gray-500">
                Enter your API key to access your dispute management dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const key = formData.get('api_key') as string

                if (!key) {
                  setError('API key is required')
                  return
                }

                try {
                  const response = await fetch('/api/dashboard/stats', {
                    headers: { 'X-API-Key': key },
                  })

                  if (response.ok) {
                    localStorage.setItem('vantirs_api_key', key)
                    setApiKey(key)
                    setError(null)
                  } else {
                    setError('Invalid API key. Please check and try again.')
                  }
                } catch (err) {
                  setError('Failed to verify API key. Please try again.')
                }
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 mb-1.5">
                  API Key
                </label>
                <input
                  type="password"
                  id="api_key"
                  name="api_key"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-mono text-sm transition-all bg-white"
                  placeholder="vant_..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Access Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an API key?{' '}
                <Link href="/onboarding" className="text-gray-900 font-medium hover:underline">
                  Connect your Stripe account
                </Link>
              </p>
              <button
                onClick={() => setShowRecovery(true)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Forgot your API key?
              </button>
            </div>
          </div>
        </div>

        {/* Recovery Modal */}
        {showRecovery && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => { setShowRecovery(false); setRecoveryResult(null); setRecoveryEmail('') }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-scale-in border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Recover API Key</h3>
                </div>
                <button
                  onClick={() => { setShowRecovery(false); setRecoveryResult(null); setRecoveryEmail('') }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!recoveryResult ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setRecoveryLoading(true)
                    setRecoveryResult(null)
                    try {
                      const response = await fetch('/api/auth/recover-api-key', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: recoveryEmail }),
                      })
                      const data = await response.json()
                      const result = {
                        success: data.success || false,
                        message: data.message || data.error || 'An error occurred.',
                        api_key: data.api_key,
                      }
                      setRecoveryResult(result)
                      if (result.success && result.api_key) {
                        const input = document.getElementById('api_key') as HTMLInputElement
                        if (input) input.value = result.api_key
                      }
                    } catch (err: any) {
                      setRecoveryResult({ success: false, message: err.message || 'Failed to recover API key.' })
                    } finally {
                      setRecoveryLoading(false)
                    }
                  }}
                  className="space-y-4"
                >
                  <p className="text-sm text-gray-500">
                    Enter the email associated with your account. We&apos;ll generate a new API key.
                  </p>
                  <div>
                    <label htmlFor="recovery_email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="recovery_email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                      placeholder="you@company.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="w-full bg-gray-900 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {recoveryLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /><span>Generating...</span></>
                    ) : (
                      <span>Generate New API Key</span>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {recoveryResult.success ? (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-900 text-sm">{recoveryResult.message}</p>
                            {recoveryResult.api_key && (
                              <div className="mt-3">
                                <label className="block text-xs font-medium text-green-800 mb-1.5">Your New API Key (save this)</label>
                                <div className="flex items-center space-x-2">
                                  <code className="flex-1 bg-white px-3 py-2 rounded-lg border border-green-200 font-mono text-xs break-all">
                                    {recoveryResult.api_key}
                                  </code>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(recoveryResult.api_key!)}
                                    className="px-3 py-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors text-xs font-medium"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowRecovery(false); setRecoveryResult(null); setRecoveryEmail('') }}
                        className="w-full bg-gray-900 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors"
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{recoveryResult.message}</p>
                      </div>
                      <button
                        onClick={() => { setRecoveryResult(null); setRecoveryEmail('') }}
                        className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                      >
                        Try Again
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render dashboard with API key
  return <Dashboard apiKey={apiKey} />
}
