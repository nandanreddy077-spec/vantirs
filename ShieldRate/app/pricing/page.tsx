'use client'

import VantirsLogo from '@/components/VantirsLogo'
import { Check } from 'lucide-react'

const features = [
  { text: 'Unlimited disputes', highlight: true },
  { text: 'All 10.4 fraud evidence (auto)' },
  { text: 'CE 3.0 forensic matching included', highlight: true },
  { text: 'Auto-submission to Stripe' },
  { text: 'Customer identity + AVS/3DS proof' },
  { text: 'Transaction history evidence' },
  { text: 'VAMP monitoring' },
  { text: 'Shadow Pilot revenue audit' },
  { text: 'Advanced analytics' },
  { text: 'Priority processing' },
  { text: 'Clean PDFs (no watermark)' },
  { text: 'EMV + card-present evidence' },
  { text: 'Consumer + authorization evidence' },
]

export default function PricingPage() {
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
            Completely Free. Every Feature.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Fight <strong>all fraud disputes</strong> automatically with <strong>CE 3.0 forensic matching</strong>,
            unlimited disputes, and every feature included — no credit card required.
          </p>
        </div>

        {/* Single Free Plan Card */}
        <div className="mx-auto mt-16 max-w-lg">
          <div className="relative rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white p-8 shadow-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1 text-sm font-semibold text-white">
                100% Free
              </span>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Vantirs</h3>
              <div className="mt-4 flex items-baseline justify-center">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="ml-2 text-lg text-gray-500">/forever</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                All features included — completely free
              </p>
            </div>

            <ul className="mt-8 space-y-4">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check
                    className={`h-5 w-5 flex-shrink-0 ${
                      feature.highlight ? 'text-blue-600' : 'text-green-500'
                    }`}
                  />
                  <span
                    className={`ml-3 text-sm ${
                      feature.highlight
                        ? 'text-blue-700 font-semibold'
                        : 'text-gray-900'
                    }`}
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href="/onboarding"
              className="mt-8 block w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-center font-semibold text-white transition-all hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Is Vantirs really free?
              </h3>
              <p className="mt-2 text-gray-600">
                Yes — every feature is included at no cost. Unlimited disputes, CE 3.0 forensic matching, auto-submission, VAMP monitoring, Shadow Pilot, and more. No credit card required.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                What does Vantirs do?
              </h3>
              <p className="mt-2 text-gray-600">
                Vantirs fights <strong>all fraud disputes</strong> automatically. We build evidence from your Stripe charge data — customer identity, AVS/3DS results, IP address, transaction history, and activity logs — then submit it to Stripe on your behalf.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                What is CE 3.0?
              </h3>
              <p className="mt-2 text-gray-600">
                CE 3.0 (Compelling Evidence 3.0) is Visa&apos;s liability shift program. When qualifying historical transactions match the disputed charge, it triggers an automatic liability shift — the bank must reverse the chargeback. Vantirs uses forensic matching to identify these cases and generates bank-admissible compliance reports.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                How many disputes can I win?
              </h3>
              <p className="mt-2 text-gray-600">
                With regular 10.4 evidence, merchants typically win 40-50% of fraud disputes. With CE 3.0, qualifying disputes have a near-certain win rate, bringing overall win rates to 65-75%.
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
            <span className="text-gray-600">&copy; 2024 Vantirs. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
