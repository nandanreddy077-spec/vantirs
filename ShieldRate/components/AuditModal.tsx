'use client'

import { useState } from 'react'
import { X, Loader2, AlertCircle, CheckCircle2, Key, Mail, ArrowRight } from 'lucide-react'

interface AuditModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuditModal({ isOpen, onClose }: AuditModalProps) {
  const [email, setEmail] = useState('')
  const [stripeKey, setStripeKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [auditId, setAuditId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/audit/free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          stripe_key: stripeKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = data.retry_after || 3600
          throw new Error(`Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`)
        }
        throw new Error(data.error || data.message || 'Failed to start audit')
      }

      // Use secure token to fetch results
      if (data.token) {
        // Redirect to results page with secure token
        window.location.href = `/audit/results?token=${data.token}`
      } else if (data.audit_id) {
        // Fallback: use audit ID if token not available
        window.location.href = `/audit/results?id=${data.audit_id}`
      } else {
        throw new Error('No results returned from audit')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start audit. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-3xl font-bold text-white mb-2">Free 90-Day CE 3.0 Audit</h2>
          <p className="text-blue-100 text-lg">
            Discover how much revenue you can recover from past chargebacks
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
              placeholder="you@company.com"
            />
            <p className="mt-2 text-xs text-gray-500">
              We'll send your audit results to this email
            </p>
          </div>

          <div>
            <label htmlFor="stripe_key" className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center">
              <Key className="h-4 w-4 mr-2 text-gray-500" />
              Stripe Restricted Key *
            </label>
            <input
              type="password"
              id="stripe_key"
              required
              value={stripeKey}
              onChange={(e) => setStripeKey(e.target.value)}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
              placeholder="rk_live_... or rk_test_..."
            />
            <p className="mt-2 text-xs text-gray-500">
              Must start with <code className="bg-gray-100 px-2 py-1 rounded font-mono">rk_</code> (restricted key)
            </p>
            <div className="mt-3 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>🔒 Security:</strong> We only need read access to charges and disputes. 
                Your key is encrypted and never stored permanently.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">What you'll get:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Total disputes in last 90 days</li>
                  <li>CE 3.0 eligible disputes count</li>
                  <li>Recoverable revenue amount</li>
                  <li>VAMP ratio analysis</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email || !stripeKey}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Running Audit...</span>
                </>
              ) : (
                <>
                  <span>Run Free Audit</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

