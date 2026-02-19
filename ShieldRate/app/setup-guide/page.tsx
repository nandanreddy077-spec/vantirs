'use client'

import { CheckCircle2, Lock, Key, Webhook, AlertTriangle, Shield, ArrowLeft, ExternalLink, Info } from 'lucide-react'
import VantirsLogo from '@/components/VantirsLogo'
import Link from 'next/link'

export default function SetupGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white">
      {/* Premium Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3">
              <VantirsLogo width={160} height={52} className="flex-shrink-0" />
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/onboarding"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Back to Setup
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/onboarding"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Onboarding
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Stripe API Key Setup Guide</h1>
          <p className="text-lg text-gray-600">
            Follow these steps to securely connect your Stripe account to Vantirs
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-premium border border-gray-200/50 overflow-hidden">
          <div className="p-10 space-y-12">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">1</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Log in to Stripe</h2>
              </div>
              <div className="ml-14 space-y-3 text-gray-700">
                <p>Go to <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold underline inline-flex items-center">dashboard.stripe.com <ExternalLink className="h-3 w-3 ml-1" /></a></p>
                <p>Log in to your Stripe account</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mt-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-900 mb-1">Mode Selection</p>
                      <p className="text-sm text-yellow-800">
                        Make sure you are in the correct mode:
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
                        <li>Use <strong>Test mode</strong> if you are testing</li>
                        <li>Use <strong>Live mode</strong> if you want real protection</li>
                      </ul>
                      <p className="text-sm font-semibold text-yellow-900 mt-3">
                        ⚠️ Vantirs only works on the mode you connect.
                      </p>
                      <p className="text-sm text-yellow-800">
                        Test keys → Test disputes<br />
                        Live keys → Real disputes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-blue-500 pl-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">2</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create a Restricted API Key (Recommended)</h2>
              </div>
              <div className="ml-14 space-y-3 text-gray-700">
                <p className="font-semibold text-gray-900">We strongly recommend using a Restricted Key instead of a full secret key.</p>
                <p className="font-semibold text-gray-900 mt-4">How to create it:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>In Stripe Dashboard, go to <strong>Developers → API keys</strong></li>
                  <li>Click <strong>"Create restricted key"</strong></li>
                  <li>Name it something like: <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">Vantirs – Dispute Protection</code></li>
                </ol>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-blue-500 pl-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">3</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Set Required Permissions</h2>
              </div>
              <div className="ml-14 space-y-4">
                <p className="text-gray-700">Enable only the permissions below:</p>
                
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                  <h3 className="font-bold text-green-900 mb-3 flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Required (must be ON)
                  </h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      <strong>Charges → Read</strong>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      <strong>Disputes → Read & Write</strong>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      <strong>Payment Intents → Read</strong>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      <strong>Customers → Read</strong>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      <strong>Balance Transactions → Read</strong>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Optional (recommended)
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                      <strong>Events → Read</strong> (helps with webhook reliability)
                    </li>
                  </ul>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                  <h3 className="font-bold text-red-900 mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Must be OFF
                  </h3>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                      Creating charges
                    </li>
                    <li className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                      Refunds
                    </li>
                    <li className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                      Payouts
                    </li>
                    <li className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                      Account settings
                    </li>
                    <li className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                      Anything related to moving money
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mt-4">
                  <div className="flex items-start">
                    <Lock className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-blue-900 mb-1">🔒 Security Guarantee</p>
                      <p className="text-sm text-blue-800">
                        Vantirs cannot withdraw funds or charge customers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="border-l-4 border-blue-500 pl-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">4</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Copy the API Key</h2>
              </div>
              <div className="ml-14 space-y-3 text-gray-700">
                <p>After saving:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Copy the key that starts with:</li>
                  <li className="ml-4">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">rk_test_...</code> (Test mode)
                  </li>
                  <li className="ml-4">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">rk_live_...</code> (Live mode)
                  </li>
                  <li>Paste this key into the Vantirs onboarding form.</li>
                </ul>
              </div>
            </div>

            {/* Step 5 */}
            <div className="border-l-4 border-blue-500 pl-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">5</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Set Up Stripe Webhooks (Important)</h2>
              </div>
              <div className="ml-14 space-y-3 text-gray-700">
                <p>Webhooks allow Stripe to notify Vantirs instantly when a dispute happens.</p>
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mt-4">
                  <h3 className="font-bold text-blue-900 mb-3">Add the Vantirs webhook URL</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Vantirs will give you a URL like:
                  </p>
                  <code className="block bg-white px-4 py-2 rounded-lg font-mono text-xs border border-blue-200">
                    https://vantirs.com/api/webhooks/stripe/&#123;your_merchant_id&#125;
                  </code>
                </div>

                <p className="font-semibold text-gray-900 mt-4">In Stripe:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Go to <strong>Developers → Webhooks</strong></li>
                  <li>Click <strong>"Add endpoint"</strong></li>
                  <li>Paste the webhook URL</li>
                  <li>Select these events:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li><code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">charge.dispute.created</code></li>
                      <li><code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">charge.dispute.updated</code></li>
                    </ul>
                  </li>
                  <li>Save the endpoint</li>
                </ol>
              </div>
            </div>

            {/* Step 6 */}
            <div className="border-l-4 border-blue-500 pl-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">6</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Copy the Webhook Secret</h2>
              </div>
              <div className="ml-14 space-y-3 text-gray-700">
                <p>After saving the webhook:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Click the webhook you just created</li>
                  <li>Copy the <strong>Signing secret</strong>:
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm ml-2">whsec_...</code>
                  </li>
                  <li>Paste it into Vantirs when asked</li>
                </ol>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <Lock className="h-4 w-4 inline mr-2" />
                    This ensures all events are secure and verified.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 7 */}
            <div className="border-l-4 border-blue-500 pl-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">7</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">(Optional) Run Historical Sync</h2>
              </div>
              <div className="ml-14 space-y-3 text-gray-700">
                <p>To enable protection immediately, Vantirs may ask to sync past transactions.</p>
                <p className="font-semibold text-gray-900">This allows us to:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Find historical trusted payments</li>
                  <li>Qualify disputes for Visa CE 3.0</li>
                  <li>Avoid waiting 3–4 months for data</li>
                </ul>
                <p className="mt-3">You can start this with one click inside Vantirs.</p>
              </div>
            </div>

            {/* What Vantirs Can Access */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Shield className="h-6 w-6 mr-3 text-blue-600" />
                What Vantirs Can Access (Transparency)
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                  <h3 className="font-bold text-green-900 mb-3 flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Vantirs can:
                  </h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>Read past successful charges</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>Detect disputes</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>Upload dispute evidence (only when approved)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>Monitor dispute ratios (VAMP)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                  <h3 className="font-bold text-red-900 mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Vantirs cannot:
                  </h3>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-red-600 flex-shrink-0" />
                      <span>Move money</span>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-red-600 flex-shrink-0" />
                      <span>Create or cancel charges</span>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-red-600 flex-shrink-0" />
                      <span>Change your Stripe settings</span>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-red-600 flex-shrink-0" />
                      <span>Access full card numbers</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mt-6">
                <p className="text-sm text-blue-800">
                  <Shield className="h-4 w-4 inline mr-2" />
                  We use Stripe's official APIs and follow best-practice security.
                </p>
              </div>
            </div>

            {/* Common Questions */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Questions</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="text-xl mr-2">❓</span>
                    Is this safe?
                  </h3>
                  <p className="text-gray-700">
                    Yes. We recommend restricted keys and encrypt all credentials at rest.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="text-xl mr-2">❓</span>
                    Can I revoke access?
                  </h3>
                  <p className="text-gray-700">
                    Yes. You can delete the API key or webhook anytime in Stripe.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="text-xl mr-2">❓</span>
                    Does this affect my customers?
                  </h3>
                  <p className="text-gray-700">
                    No. Everything happens behind the scenes.
                  </p>
                </div>
              </div>
            </div>

            {/* Done Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Done 🎉</h2>
              <p className="text-gray-700 mb-6">Once connected:</p>
              <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700">
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>Vantirs automatically monitors disputes</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>Detects liability-shift eligibility</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>Generates bank-ready evidence</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>Helps you recover money you'd otherwise lose</span>
                </li>
              </ul>
            </div>

            {/* Back to Onboarding */}
            <div className="pt-8 border-t border-gray-200">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Onboarding
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
