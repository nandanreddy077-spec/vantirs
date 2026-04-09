'use client'

import { Check } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { PLAN_LIMITS, type Plan } from '@/lib/plan-limits'

const PLANS: Plan[] = ['free', 'starter', 'professional', 'enterprise']

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-white to-gray-50 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Simple pricing
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Early users get <strong>5 free disputes</strong> to try Vantirs. Then choose a plan that fits your volume.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              No hidden fees · Upgrade or cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((planKey) => {
            const plan = PLAN_LIMITS[planKey]
            const isFree = planKey === 'free'
            const isEnterprise = planKey === 'enterprise'
            const isPopular = planKey === 'starter'
            return (
              <div
                key={planKey}
                className={`relative flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 transition-all hover:shadow-md ${
                  isFree
                    ? 'ring-blue-200 ring-2'
                    : isPopular
                    ? 'ring-2 ring-violet-500 shadow-md'
                    : 'ring-gray-200'
                }`}
              >
                {isFree && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Early user
                  </span>
                )}
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Popular
                  </span>
                )}
                <div className="flex flex-1 flex-col">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price === 0 && !isEnterprise ? '$0' : isEnterprise ? 'Custom' : `$${plan.price}`}
                    </span>
                    {!isEnterprise && (
                      <span className="text-sm text-gray-500">
                        /{plan.price === 0 ? 'one-time' : 'mo'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {plan.disputesLimit === 'unlimited'
                      ? 'Unlimited disputes'
                      : `${plan.disputesLimit} disputes/${plan.disputesPeriod === 'lifetime' ? 'total' : 'mo'}`}
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500 mt-0.5" />
                      <span>Auto-submission to Stripe</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500 mt-0.5" />
                      <span>Visa: fraud (10.1–10.4), authorization, processing & consumer</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500 mt-0.5" />
                      <span>Mastercard FPT</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500 mt-0.5" />
                      <span>VAMP monitoring</span>
                    </li>
                    {plan.shadowPilot && (
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="h-4 w-4 flex-shrink-0 text-green-500 mt-0.5" />
                        <span>Shadow Pilot revenue audit</span>
                      </li>
                    )}
                    {plan.ce3AddonAvailable && (
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="h-4 w-4 flex-shrink-0 text-green-500 mt-0.5" />
                        <span>CE 3.0 {plan.ce3AddonPrice > 0 ? `(+$${plan.ce3AddonPrice}/mo)` : 'included'}</span>
                      </li>
                    )}
                  </ul>
                </div>
                <a
                  href={isEnterprise ? 'mailto:sales@vantirs.com?subject=Enterprise plan' : '/onboarding'}
                  className={`mt-6 flex w-full items-center justify-center rounded-xl px-4 py-3 text-center font-semibold transition-colors ${
                    isFree
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : isPopular
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isFree ? 'Get started — 5 free' : isEnterprise ? 'Contact sales' : 'Get started'}
                </a>
              </div>
            )
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">
            Frequently asked questions
          </h2>
          <dl className="space-y-8">
            <div>
              <dt className="text-base font-semibold text-gray-900">Do I get any free disputes?</dt>
              <dd className="mt-2 text-sm text-gray-600">
                Yes. Early users get <strong>5 free disputes</strong> (lifetime) with full features — auto-submission, CE 3.0, VAMP monitoring. After that, upgrade to Starter or higher.
              </dd>
            </div>
            <div>
              <dt className="text-base font-semibold text-gray-900">What does Vantirs do?</dt>
              <dd className="mt-2 text-sm text-gray-600">
                Vantirs fights <strong>all dispute types</strong>: Visa fraud (10.1–10.4), authorization (11.x), processing (12.x), consumer (13.x), and Mastercard FPT. We build and submit evidence to Stripe on your behalf.
              </dd>
            </div>
            <div>
              <dt className="text-base font-semibold text-gray-900">What is CE 3.0?</dt>
              <dd className="mt-2 text-sm text-gray-600">
                CE 3.0 is Visa&apos;s liability shift program. When qualifying historical transactions match the disputed charge, the bank must reverse the chargeback. Vantirs finds these cases and generates compliant reports.
              </dd>
            </div>
            <div>
              <dt className="text-base font-semibold text-gray-900">How many disputes can I win?</dt>
              <dd className="mt-2 text-sm text-gray-600">
                With regular 10.4 evidence, merchants typically win 40–50% of fraud disputes. With CE 3.0, qualifying disputes have a near-certain win rate; overall win rates are often 65–75%.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <Footer />
    </div>
  )
}
