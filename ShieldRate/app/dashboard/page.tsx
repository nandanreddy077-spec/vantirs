'use client'

import { useEffect, useState } from 'react'
import Dashboard from '@/components/Dashboard'

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vantirs Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Please enter your API key to access your dashboard.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
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
              <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                id="api_key"
                name="api_key"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="vant_..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Your API key was provided when you connected your Stripe account
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Access Dashboard
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Don't have an API key?{' '}
              <a href="/onboarding" className="text-blue-600 hover:underline">
                Connect your Stripe account
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Render dashboard with API key
  return <Dashboard apiKey={apiKey} />
}

