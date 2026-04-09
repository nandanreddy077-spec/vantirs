'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Lock, Key, Webhook, Info, Check, Sparkles, Zap } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

// Main component that uses useSearchParams
function OnboardingContent() {
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    stripe_publishable_key: '',
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [showManualForm, setShowManualForm] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    merchant?: any
    next_steps?: string[]
  } | null>(null)

  // Handle OAuth callback success/error
  useEffect(() => {
    const success = searchParams?.get('success')
    const error = searchParams?.get('error')
    const merchantId = searchParams?.get('merchant_id')
    const apiKey = searchParams?.get('api_key')
    const reconnected = searchParams?.get('reconnected')
    const message = searchParams?.get('message')

    if (success === 'true' && merchantId) {
      setResult({
        success: true,
        message: reconnected === 'true' 
          ? 'Stripe account reconnected successfully!'
          : 'Stripe account connected successfully via OAuth!',
        merchant: {
          id: merchantId,
          api_key: apiKey || undefined,
        },
        next_steps: [
          apiKey ? `Save your API key: ${apiKey}` : 'Your account is ready',
          'Webhook has been automatically configured',
          'All 10.4 fraud disputes will be fought automatically',
          'Run 12-month backfill to enable CE 3.0 matching (add-on)',
        ],
      })
      setStep(3)
    } else if (error) {
      const errorMessages: Record<string, string> = {
        stripe_connect_not_configured: 'Stripe Connect is not configured. Use manual connection below or contact support.',
        access_denied: 'You declined the connection. You can try again or use manual API key connection.',
        oauth_initiation_failed: 'Could not start Stripe connection. Please try again or use manual connection.',
        no_code: 'Authorization was interrupted. Please try again.',
        state_mismatch: 'Security check failed. Please try connecting again.',
        stripe_not_configured: 'Server Stripe configuration is missing. Contact support.',
        token_exchange_failed: 'Stripe authorization failed. Please try again.',
        merchant_creation_failed: 'Could not create your account. Please try again or use manual connection.',
        callback_failed: 'Something went wrong. Please try again or use manual connection below.',
      }
      setResult({
        success: false,
        message: message || errorMessages[error] || `Connection error: ${error}. You can use manual API key connection below.`,
      })
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/onboarding/connect-stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      // Read response body once (can only be read once)
      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')
      
      let data
      try {
        if (isJson) {
          data = await response.json()
        } else {
          const text = await response.text()
          if (text) {
            try {
              data = JSON.parse(text)
            } catch {
              // Not JSON, use as error message
              data = { success: false, error: text }
            }
          }
        }
      } catch (parseError: any) {
        setResult({
          success: false,
          message: `Failed to parse server response: ${parseError.message}`,
        })
        return
      }

      // Check if response is ok
      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Server error: ${response.status} ${response.statusText}`
        setResult({
          success: false,
          message: errorMessage,
        })
        return
      }

      // Check if response has content
      if (!data) {
        setResult({
          success: false,
          message: 'Empty response from server. Please try again.',
        })
        return
      }

      setResult(data)
      
      if (data.success) {
        setStep(3)
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to connect Stripe account. Please check your connection and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white">
      <Navbar showCTA={false} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 pt-24 sm:pt-28 lg:pt-32">
        {/* Premium Progress Steps */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 lg:space-x-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl border-2 transition-all duration-500 ${
                    step >= s
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-transparent shadow-glow'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {step > s ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white relative z-10" />
                  ) : (
                    <span 
                      className={`relative z-10 font-black text-lg sm:text-xl lg:text-2xl leading-none ${
                        step >= s 
                          ? 'text-white' 
                          : 'text-gray-400'
                      }`}
                      style={step >= s ? {
                        textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 12px rgba(0,0,0,0.3), 0 0 2px rgba(0,0,0,0.8)',
                        WebkitTextStroke: '0.5px rgba(0,0,0,0.2)'
                      } : {}}
                    >
                      {s}
                    </span>
                  )}
                </div>
                {s < 3 && (
                  <div
                    className={`w-8 sm:w-16 lg:w-32 h-1 mx-1 sm:mx-2 lg:mx-4 transition-all duration-500 rounded-full ${
                      step > s ? 'bg-gradient-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 sm:mt-6 space-x-4 sm:space-x-12 lg:space-x-32 px-4">
            <span className={`text-xs sm:text-sm font-semibold transition-colors ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
              Connect Stripe
            </span>
            <span className={`text-xs sm:text-sm font-semibold transition-colors ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
              Configure Webhook
            </span>
            <span className={`text-xs sm:text-sm font-semibold transition-colors ${step >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>
              Complete
            </span>
          </div>
        </div>

        {/* Premium Main Card */}
        <div className="bg-white rounded-3xl shadow-premium border border-gray-200/50 overflow-hidden animate-scale-in">
          {/* Premium Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-6 sm:px-8 lg:px-10 py-8 sm:py-10 lg:py-12">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDEuMS0uOSAyLTIgMkgyNGMtMS4xIDAtMi0uOS0yLTJWMTJjMC0xLjEuOS0yIDItMmgxMGMxLjEgMCAyIC45IDIgMnYyMnoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMDUiLz48L2c+PC9zdmc+')] opacity-20"></div>
            <div className="relative">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">Connect Your Stripe Account</h1>
              <p className="text-blue-100 text-base sm:text-lg font-light">
                Get started with automated CE 3.0 compliance in minutes
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-10">
            {/* Success State - Premium */}
            {result?.success && step === 3 ? (
              <div className="text-center py-16 animate-scale-in">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Account Connected Successfully!</h2>
                <p className="text-gray-600 mb-12 max-w-md mx-auto text-lg">{result.message}</p>

                  {result.merchant && (
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 mb-8 text-left max-w-2xl mx-auto border border-gray-200/50 shadow-premium">
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-semibold text-gray-500 mb-2 block uppercase tracking-wide">Merchant ID</label>
                        <div className="flex items-center space-x-3">
                          <code className="flex-1 bg-white px-5 py-3 rounded-xl border border-gray-200 font-mono text-sm shadow-sm">
                            {result.merchant.id}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(result.merchant.id)
                            }}
                            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium text-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      {result.merchant.api_key && (
                        <div>
                          <label className="text-sm font-semibold text-gray-500 mb-2 block uppercase tracking-wide">
                            API Key <span className="text-red-600 normal-case">*Save this - shown only once*</span>
                          </label>
                          <div className="flex items-center space-x-3">
                            <code className="flex-1 bg-white px-5 py-3 rounded-xl border-2 border-red-200 font-mono text-sm shadow-sm">
                              {result.merchant.api_key}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(result.merchant.api_key)
                              }}
                              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium text-sm"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-xs text-red-600 mt-3 font-medium">
                            ⚠️ Store this securely. You'll need it to access your dashboard.
                          </p>
                        </div>
                      )}

                      {result.merchant.webhook_url && (
                        <div>
                          <label className="text-sm font-semibold text-gray-500 mb-2 block uppercase tracking-wide">Webhook URL</label>
                          <div className="flex items-center space-x-3">
                            <code className="flex-1 bg-white px-5 py-3 rounded-xl border border-gray-200 font-mono text-sm break-all shadow-sm">
                            {result.merchant.webhook_url}
                          </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(result.merchant.webhook_url)
                              }}
                              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  )}

                  {result.next_steps && result.next_steps.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-2xl p-8 mb-8 max-w-2xl mx-auto text-left">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center text-lg">
                      <Info className="h-5 w-5 mr-3" />
                      Next Steps
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                        {result.next_steps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href={`/dashboard?api_key=${result.merchant?.api_key || ''}`}
                    className="group relative overflow-hidden gradient-primary text-white px-10 py-4 rounded-2xl font-semibold hover:shadow-glow transition-all duration-500 flex items-center justify-center space-x-3 min-w-[240px]"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button
                    onClick={() => {
                      fetch('/api/onboarding/sync-transactions', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ merchant_id: result.merchant?.id }),
                      }).then(() => {
                        alert('12-month transaction sync started! This may take a few minutes.')
                      })
                    }}
                    className="bg-white text-gray-900 px-10 py-4 rounded-2xl font-semibold border-2 border-gray-200 hover:border-gray-300 hover:shadow-premium transition-all duration-300 min-w-[240px]"
                  >
                    Run 12-Month Backfill
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Error State - Premium */}
                {result && !result.success && (
                  <div className="mb-8 p-6 bg-gradient-to-br from-red-50 to-orange-50 border-l-4 border-red-500 rounded-2xl animate-slide-up">
                    <div className="flex items-start">
                      <AlertCircle className="h-6 w-6 text-red-500 mr-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900 text-lg">{result.message}</p>
                </div>
              </div>
            </div>
          )}

                {/* Company Info - Only shown in manual form */}
                {showManualForm && (
                  <div className="space-y-6 mb-8">
            <div>
                      <label htmlFor="name" className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                Company Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                placeholder="Acme Inc."
              />
            </div>

            <div>
                      <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                Contact Email *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                placeholder="you@company.com"
              />
            </div>
                  </div>
                )}

                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <Key className="h-6 w-6 mr-3 text-blue-600" />
                      Connect Your Stripe Account
                    </h3>

                    {/* OAuth One-Click Connect (Primary Option) */}
                    {!showManualForm && (
                      <div className="mb-8">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 text-center mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                            <Zap className="h-8 w-8 text-green-600" />
                          </div>
                          <h4 className="text-2xl font-bold text-gray-900 mb-2">One-Click Setup</h4>
                          <p className="text-gray-700 mb-6 max-w-md mx-auto">
                            Connect your Stripe account instantly with secure OAuth. No API keys to copy—just sign in with Stripe and authorize.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setOauthLoading(true)
                              window.location.href = '/api/onboarding/stripe-connect'
                            }}
                            disabled={oauthLoading}
                            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-3 mx-auto disabled:opacity-70 disabled:cursor-wait"
                          >
                            {oauthLoading ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Redirecting to Stripe…</span>
                              </>
                            ) : (
                              <>
                                <span>Connect with Stripe</span>
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </button>
                        </div>

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => setShowManualForm(true)}
                            className="text-gray-600 hover:text-gray-900 text-sm font-medium underline"
                          >
                            Or connect manually with API keys
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Manual Form (Fallback Option) */}
                    {showManualForm && (
                      <>
                        <div className="mb-6">
                          <button
                            onClick={() => setShowManualForm(false)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
                          >
                            <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
                            Back to one-click setup
                          </button>
                        </div>

                        {/* Premium Security Box */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Lock className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4 flex-1">
                              <p className="font-bold text-blue-900 mb-2 text-base">Security: Restricted Keys Only</p>
                              <p className="text-sm text-blue-800 mb-3 leading-relaxed">
                                Vantirs needs these permissions:{' '}
                                <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">Charges: Read</code>,{' '}
                                <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">Disputes: Read &amp; Write</code>,{' '}
                                <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">Payment Intents: Read</code>,{' '}
                                <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">Customers: Read</code>, and{' '}
                                <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">Balance Transactions: Read</code>
                              </p>
                              <Link
                                href="/setup-guide"
                                className="text-blue-600 hover:text-blue-700 font-semibold text-sm inline-flex items-center"
                              >
                                View detailed setup guide <ArrowRight className="h-4 w-4 ml-1" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {showManualForm && (
                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
            <div>
              <label
                htmlFor="stripe_secret_key"
                              className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide"
              >
                              Stripe Restricted Key *
              </label>
              <input
                type="password"
                id="stripe_secret_key"
                required
                value={formData.stripe_secret_key}
                onChange={(e) => setFormData({ ...formData, stripe_secret_key: e.target.value })}
                              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
                              placeholder="rk_live_... or rk_test_..."
              />
                            <p className="mt-3 text-xs text-gray-500 font-medium">
                              Must start with <code className="bg-gray-100 px-2 py-1 rounded font-mono">rk_</code> (restricted key, not <code className="bg-gray-100 px-2 py-1 rounded font-mono">sk_</code>)
              </p>
            </div>

            <div>
              <label
                htmlFor="stripe_webhook_secret"
                              className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center"
              >
                              <Webhook className="h-5 w-5 mr-2 text-gray-500" />
                              Webhook Secret *
              </label>
              <input
                type="password"
                id="stripe_webhook_secret"
                required
                value={formData.stripe_webhook_secret}
                onChange={(e) =>
                  setFormData({ ...formData, stripe_webhook_secret: e.target.value })
                }
                              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
                placeholder="whsec_..."
              />
                            <p className="mt-3 text-xs text-gray-500 font-medium">
                              Get this from Stripe Dashboard → Webhooks → Your endpoint → Signing secret
                            </p>
            </div>

            <div>
              <label
                htmlFor="stripe_publishable_key"
                              className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide"
              >
                              Publishable Key (Optional)
              </label>
              <input
                type="text"
                id="stripe_publishable_key"
                value={formData.stripe_publishable_key}
                onChange={(e) =>
                  setFormData({ ...formData, stripe_publishable_key: e.target.value })
                }
                              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
                              placeholder="pk_live_... or pk_test_..."
              />
                          </div>
            </div>

                        {/* Submit Button - Prominent */}
                        <div className="mt-10 pt-8 border-t-2 border-gray-200">
            <button
              type="submit"
              disabled={loading}
                            className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-6 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                                <Loader2 className="animate-spin h-6 w-6" />
                                <span>Connecting...</span>
                </>
              ) : (
                              <>
                                <span>Connect Stripe Account</span>
                                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                              </>
              )}
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
            </button>
                          <p className="text-center text-sm text-gray-500 mt-4">
                            Click to connect your Stripe account and start protecting your revenue
                          </p>
                        </div>
          </form>
                    )}
                  </div>

                {/* Premium Help Section */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
                    Need Help?
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-3">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>
                        See{' '}
                        <Link
                  href="/setup-guide"
                          className="text-blue-600 hover:text-blue-700 font-semibold underline"
                >
                  Stripe API Key Setup Guide
                        </Link>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Restricted keys must start with <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">rk_</code> (not <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">sk_</code>)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Webhook secret must start with <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">whsec_</code></span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>After connecting, run the 12-month backfill to enable CE 3.0 matching</span>
              </li>
            </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Export with Suspense wrapper for useSearchParams
export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
