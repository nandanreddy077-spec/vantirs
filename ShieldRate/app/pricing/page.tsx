'use client'

import { useState } from 'react'
import VantirsLogo from '@/components/VantirsLogo'
import { Check, X } from 'lucide-react'

const plans = [
  {
    name: 'FREE',
    subtitle: '(Demo)',
    price: 0,
    period: 'lifetime',
    description: 'Perfect for testing Vantirs with limited disputes',
    features: [
      { text: 'Read-only CE 3.0 detection', included: true },
      { text: 'Watermarked PDFs', included: true },
      { text: '2 disputes lifetime', included: true },
      { text: 'Auto-submission', included: false },
      { text: 'VAMP monitoring', included: false },
      { text: 'Shadow Pilot', included: false },
      { text: 'Advanced analytics', included: false },
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'STARTER',
    price: 99,
    period: 'month',
    description: 'For small SaaS businesses with moderate dispute volume',
    features: [
      { text: '25 disputes/month', included: true },
      { text: 'Auto-submission', included: true },
      { text: 'VAMP monitoring', included: true },
      { text: 'Clean PDFs (no watermark)', included: true },
      { text: 'Shadow Pilot', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Priority processing', included: false },
    ],
    cta: 'Subscribe',
    popular: true,
  },
  {
    name: 'PROFESSIONAL',
    price: 249,
    period: 'month',
    description: 'For growing businesses with high dispute volume',
    features: [
      { text: '100 disputes/month', included: true },
      { text: 'Priority processing', included: true },
      { text: 'Shadow Pilot', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Auto-submission', included: true },
      { text: 'VAMP monitoring', included: true },
      { text: 'Clean PDFs', included: true },
    ],
    cta: 'Subscribe',
    popular: false,
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    period: '',
    description: 'For large organizations with custom requirements',
    features: [
      { text: 'Unlimited disputes', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'White-label option', included: true },
      { text: 'All Professional features', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Volume discounts', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (planName: string) => {
    if (planName === 'FREE') {
      window.location.href = '/onboarding'
      return
    }
    
    if (planName === 'ENTERPRISE') {
      window.location.href = 'mailto:sales@vantirs.com?subject=Enterprise Plan Inquiry'
      return
    }

    setIsLoading(planName)
    setError(null)

    try {
      // Get API key from localStorage (user should be logged in)
      const apiKey = localStorage.getItem('vantirs_api_key')
      
      if (!apiKey) {
        // Redirect to onboarding if not logged in
        window.location.href = `/onboarding?plan=${planName.toLowerCase()}`
        return
      }

      // Create checkout session
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          plan: planName.toLowerCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Razorpay Payment Link
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout. Please try again.')
      setIsLoading(null)
      console.error('Checkout error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <VantirsLogo width={140} height={44} className="flex-shrink-0" />
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </a>
              <a
                href="/onboarding"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Choose the plan that fits your dispute volume. All plans include CE 3.0 detection and bank-ready evidence generation.
          </p>
        </div>

        {/* Pricing Cards */}
          {error && (
            <div className="mx-auto max-w-7xl mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-8 shadow-lg transition-all hover:shadow-xl ${
                plan.popular
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white scale-105'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  {plan.name}
                  {plan.subtitle && (
                    <span className="text-lg text-gray-500"> {plan.subtitle}</span>
                  )}
                </h3>
                <div className="mt-4 flex items-baseline justify-center">
                  {typeof plan.price === 'number' ? (
                    <>
                      <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                      <span className="ml-2 text-lg text-gray-500">/{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 flex-shrink-0 text-gray-300" />
                    )}
                    <span
                      className={`ml-3 text-sm ${
                        feature.included ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.name)}
                disabled={isLoading === plan.name}
                className={`mt-8 w-full rounded-lg px-4 py-3 font-semibold text-white transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    : plan.name === 'FREE'
                    ? 'bg-gray-900 hover:bg-gray-800'
                    : 'bg-gray-800 hover:bg-gray-700'
                } ${isLoading === plan.name ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading === plan.name ? 'Processing...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="mt-2 text-gray-600">
                Yes! You can upgrade or downgrade at any time. Changes take effect immediately, and we'll prorate your billing.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                What happens if I exceed my dispute limit?
              </h3>
              <p className="mt-2 text-gray-600">
                We'll notify you when you're approaching your limit. You can upgrade to a higher plan or wait for your next billing cycle (for monthly plans).
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Is there a contract or commitment?
              </h3>
              <p className="mt-2 text-gray-600">
                No contracts. Cancel anytime. All paid plans are month-to-month with no long-term commitments.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                What's the difference between Free and Starter?
              </h3>
              <p className="mt-2 text-gray-600">
                Free tier is read-only (you can see CE 3.0 detection but can't submit evidence). Starter includes auto-submission, VAMP monitoring, and clean PDFs without watermarks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-24 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-3">
            <VantirsLogo width={120} height={36} />
            <span className="text-gray-600">© 2024 Vantirs. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

