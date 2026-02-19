'use client'

import { useEffect, useState } from 'react'
import Dashboard from '@/components/Dashboard'
import { Mail, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

/**
 * Merchant Dashboard Page
 * 
 * Supports API key authentication via:
 * - Query parameter: ?api_key=...
 * - Local storage: Stores API key for convenience
 */
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-scale-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Vantirs Dashboard</h1>
            <p className="text-gray-600">
              Please enter your API key to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
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

              // Test API key by fetching dashboard stats
              try {
                const response = await fetch('/api/dashboard/stats', {
                  headers: {
                    'X-API-Key': key,
                  },
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
              <label htmlFor="api_key" className="block text-sm font-semibold text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                id="api_key"
                name="api_key"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
                placeholder="vant_..."
              />
              <p className="mt-2 text-xs text-gray-500">
                Your API key was provided when you connected your Stripe account
              </p>
            </div>

            <button
              type="submit"
              className="w-full gradient-primary text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
            >
              Access Dashboard
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Don't have an API key?{' '}
              <a href="/onboarding" className="text-blue-600 hover:underline font-medium">
                Connect your Stripe account
              </a>
            </p>
            
            <div className="text-center">
              <button
                onClick={() => setShowRecovery(true)}
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                Forgot your API key?
              </button>
            </div>
          </div>

          {/* Recovery Modal */}
          {showRecovery && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
              onClick={() => {
                setShowRecovery(false)
                setRecoveryResult(null)
                setRecoveryEmail('')
              }}
            >
              <div 
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Recover API Key</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowRecovery(false)
                      setRecoveryResult(null)
                      setRecoveryEmail('')
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
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
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ email: recoveryEmail }),
                        })

                        const data = await response.json()
                        
                        // Handle both error and message fields
                        const result = {
                          success: data.success || false,
                          message: data.message || data.error || 'An error occurred. Please try again.',
                          api_key: data.api_key,
                        }
                        
                        setRecoveryResult(result)
                        
                        if (result.success && result.api_key) {
                          // Auto-fill the API key in the main form
                          const input = document.getElementById('api_key') as HTMLInputElement
                          if (input) {
                            input.value = result.api_key
                          }
                        }
                      } catch (err: any) {
                        setRecoveryResult({
                          success: false,
                          message: err.message || 'Failed to recover API key. Please try again.',
                        })
                      } finally {
                        setRecoveryLoading(false)
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-gray-600 mb-4">
                        Enter the email address associated with your Vantirs account. We'll generate a new API key for you.
                      </p>
                      <label htmlFor="recovery_email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="recovery_email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="you@company.com"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={recoveryLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {recoveryLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Generate New API Key</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {recoveryResult.success ? (
                      <>
                        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                          <div className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-green-900 mb-2">{recoveryResult.message}</p>
                              {recoveryResult.api_key && (
                                <div className="mt-4">
                                  <label className="block text-xs font-semibold text-green-800 mb-2">
                                    Your New API Key (Save this - shown only once)
                                  </label>
                                  <div className="flex items-center space-x-2">
                                    <code className="flex-1 bg-white px-4 py-3 rounded-lg border-2 border-green-200 font-mono text-sm break-all">
                                      {recoveryResult.api_key}
                                    </code>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(recoveryResult.api_key!)
                                      }}
                                      className="px-4 py-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors font-medium text-sm"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <p className="text-xs text-green-700 mt-3 font-medium">
                                    ⚠️ This key has been auto-filled in the login form below. Save it securely!
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowRecovery(false)
                            setRecoveryResult(null)
                            setRecoveryEmail('')
                          }}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                        >
                          Close
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                          <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-800">{recoveryResult.message}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setRecoveryResult(null)
                            setRecoveryEmail('')
                          }}
                          className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
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
      </div>
    )
  }

  // Render dashboard with API key
  return <Dashboard apiKey={apiKey} />
}
