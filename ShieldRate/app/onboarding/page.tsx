'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    stripe_publishable_key: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    merchant?: any
    next_steps?: string[]
  } | null>(null)

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

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to connect Stripe account',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect Your Stripe Account
          </h1>
          <p className="text-gray-600 mb-8">
            Connect your Stripe account to start protecting your business from chargebacks with
            automated CE 3.0 compliance.
          </p>

          {result && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.merchant && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-700">
                        <strong>Merchant ID:</strong> {result.merchant.id}
                      </p>
                      {result.merchant.webhook_url && (
                        <p className="text-sm text-gray-700">
                          <strong>Webhook URL:</strong>{' '}
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {result.merchant.webhook_url}
                          </code>
                        </p>
                      )}
                    </div>
                  )}
                  {result.next_steps && result.next_steps.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-800 mb-2">Next Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                        {result.next_steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Acme Inc."
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="stripe_secret_key"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Stripe Restricted Key (rk_live_... or rk_test_...) *
              </label>
              <input
                type="password"
                id="stripe_secret_key"
                required
                value={formData.stripe_secret_key}
                onChange={(e) => setFormData({ ...formData, stripe_secret_key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="rk_live_..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be a restricted key with permissions: charges:read, disputes:read,
                disputes:write
              </p>
            </div>

            <div>
              <label
                htmlFor="stripe_webhook_secret"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Webhook Secret (whsec_...) *
              </label>
              <input
                type="password"
                id="stripe_webhook_secret"
                required
                value={formData.stripe_webhook_secret}
                onChange={(e) =>
                  setFormData({ ...formData, stripe_webhook_secret: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="whsec_..."
              />
            </div>

            <div>
              <label
                htmlFor="stripe_publishable_key"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Publishable Key (pk_live_... or pk_test_...) (Optional)
              </label>
              <input
                type="text"
                id="stripe_publishable_key"
                value={formData.stripe_publishable_key}
                onChange={(e) =>
                  setFormData({ ...formData, stripe_publishable_key: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="pk_live_..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Connecting...
                </>
              ) : (
                'Connect Stripe Account'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • See{' '}
                <a
                  href="/STRIPE_API_KEY_SETUP.md"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  Stripe API Key Setup Guide
                </a>
              </li>
              <li>• Restricted keys must start with rk_ (not sk_)</li>
              <li>• Webhook secret must start with whsec_</li>
              <li>• After connecting, run the 12-month backfill to enable CE 3.0 matching</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}


