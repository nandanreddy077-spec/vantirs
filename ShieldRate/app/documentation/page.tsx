'use client'

import { Book, Zap, Shield, TrendingUp, FileText, BarChart3, ArrowLeft, CheckCircle2, AlertCircle, Download, Send } from 'lucide-react'
import VantirsLogo from '@/components/VantirsLogo'
import Link from 'next/link'

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3">
              <VantirsLogo width={160} height={52} className="flex-shrink-0" />
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
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
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center space-x-3 mb-4">
            <Book className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Documentation</h1>
          </div>
          <p className="text-lg text-gray-600">
            Learn how to use Vantirs to protect your business from chargebacks
          </p>
        </div>

        {/* How It Works */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Zap className="h-6 w-6 mr-2 text-blue-600" />
            How Vantirs Works
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-4">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Automatic Dispute Detection</h3>
                <p className="text-gray-600 text-sm">When a chargeback is filed, Stripe automatically notifies Vantirs via webhook. We immediately begin analyzing the dispute.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-4">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">CE 3.0 Eligibility Matching</h3>
                <p className="text-gray-600 text-sm">Vantirs searches your historical transactions (120-365 days) to find matches based on device fingerprints, IP addresses, and customer IDs. If 2+ matches are found, the dispute is eligible for CE 3.0 liability shift.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-4">3</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Evidence Generation</h3>
                <p className="text-gray-600 text-sm">For eligible disputes, Vantirs automatically generates a bank-admissible compliance report (PDF) with structured tables, historical transaction matches, and usage audit logs.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-4">4</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Automatic Submission</h3>
                <p className="text-gray-600 text-sm">Evidence is automatically submitted to Stripe on your behalf. You can also manually review and submit disputes through the dashboard.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-4">5</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">VAMP Protection</h3>
                <p className="text-gray-600 text-sm">Disputes won via CE 3.0 are automatically removed from your VAMP ratio calculation, helping you stay below the 1.5% threshold.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Features */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
            Dashboard Features
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Real-Time Statistics</h3>
              <p className="text-gray-600 text-sm mb-3">Your dashboard shows:</p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-4">
                <li>Total disputes and their status</li>
                <li>Recoverable amount (disputes eligible for CE 3.0)</li>
                <li>Win rate and success metrics</li>
                <li>Total transaction volume</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">VAMP Ratio Monitor</h3>
              <p className="text-gray-600 text-sm">Track your dispute ratio in real-time against the 1.5% threshold. Visual indicators show when you're approaching the limit, with automatic alerts when exceeded.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Dispute Queue</h3>
              <p className="text-gray-600 text-sm mb-3">View all your disputes in one place with:</p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-4">
                <li>Compliance scores (0-100) for each dispute</li>
                <li>CE 3.0 eligibility status</li>
                <li>Network information (Visa, Mastercard)</li>
                <li>Dispute amounts and dates</li>
                <li>One-click PDF download</li>
                <li>Manual evidence submission option</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Compliance Reports</h3>
              <p className="text-gray-600 text-sm">Download bank-ready PDF compliance reports for any dispute. Reports include structured tables, historical matches, and usage audit logs formatted for bank OCR scanning.</p>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-600" />
            Key Features
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Automatic CE 3.0 Matching</p>
                <p className="text-gray-600 text-sm">Searches 12 months of transaction history to find eligible disputes automatically</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Forensic Evidence Generation</p>
                <p className="text-gray-600 text-sm">Creates bank-admissible PDF reports with structured tables and historical matches</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Automatic Evidence Submission</p>
                <p className="text-gray-600 text-sm">Submits evidence to Stripe automatically for eligible disputes (with manual review option)</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">VAMP Ratio Protection</p>
                <p className="text-gray-600 text-sm">Monitors your dispute ratio and removes CE 3.0 wins from calculations</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Mastercard FPT Support</p>
                <p className="text-gray-600 text-sm">Special handling for Mastercard First-Party Trust disputes with stricter matching requirements</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Historical Transaction Sync</p>
                <p className="text-gray-600 text-sm">Sync up to 12 months of past transactions for comprehensive CE 3.0 matching</p>
              </div>
            </div>
          </div>
        </section>

        {/* Using the API */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            Using the API
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Authentication</h3>
              <p className="text-gray-600 text-sm mb-3">All API requests require your API key in the header:</p>
              <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`Authorization: Bearer vant_xxxxxxxxxxxx`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Get Dashboard Statistics</h3>
              <p className="text-gray-600 text-sm mb-2">Retrieve your dispute statistics and metrics:</p>
              <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`GET https://vantirs.com/api/dashboard/stats
Authorization: Bearer vant_xxxxxxxxxxxx`}</code>
              </pre>
              <p className="text-gray-600 text-xs mt-2">Returns: Total disputes, recoverable amount, win rate, VAMP ratio</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">List All Disputes</h3>
              <p className="text-gray-600 text-sm mb-2">Get all your disputes with compliance scores:</p>
              <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`GET https://vantirs.com/api/disputes
Authorization: Bearer vant_xxxxxxxxxxxx`}</code>
              </pre>
              <p className="text-gray-600 text-xs mt-2">Returns: Array of disputes with status, compliance scores, and eligibility</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Download Compliance Report</h3>
              <p className="text-gray-600 text-sm mb-2">Download the PDF compliance report for a specific dispute:</p>
              <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`GET https://vantirs.com/api/disputes/{dispute_id}/pdf
Authorization: Bearer vant_xxxxxxxxxxxx`}</code>
              </pre>
              <p className="text-gray-600 text-xs mt-2">Returns: PDF file with compliance report</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Submit Evidence Manually</h3>
              <p className="text-gray-600 text-sm mb-2">Manually submit evidence for a dispute:</p>
              <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`POST https://vantirs.com/api/disputes/{dispute_id}/submit
Authorization: Bearer vant_xxxxxxxxxxxx
Content-Type: application/json

{
  "custom_context": "Additional context for this dispute"
}`}</code>
              </pre>
              <p className="text-gray-600 text-xs mt-2">Submits evidence to Stripe and returns submission status</p>
            </div>
          </div>
        </section>

        {/* Compliance & Regulations */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
            Compliance & Regulations
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">CE 3.0 (Visa)</h3>
              <p className="text-gray-600 text-sm mb-2">Visa's Compelling Evidence 3.0 program allows liability shift for disputes when:</p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-4">
                <li>2+ historical transactions (120-365 days old) match the disputed transaction</li>
                <li>Matches are based on device fingerprint, IP address, or customer ID</li>
                <li>Evidence is submitted within the required timeframe</li>
              </ul>
              <p className="text-gray-600 text-sm mt-2"><strong>Benefit:</strong> Won disputes are removed from your VAMP ratio calculation.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mastercard FPT</h3>
              <p className="text-gray-600 text-sm mb-2">Mastercard's First-Party Trust program has stricter requirements:</p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-4">
                <li>Requires device fingerprint AND (customer ID OR IP address) matches</li>
                <li>Emphasizes "Service Delivery" evidence (login, exports, API calls)</li>
                <li>2+ historical transactions within 120-365 day window</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">VAMP Threshold</h3>
              <p className="text-gray-600 text-sm">The Visa Acquirer Monitoring Program (VAMP) threshold drops to <strong>1.5%</strong> on April 1, 2026. Merchants exceeding this threshold face $8 per dispute penalties. CE 3.0 wins help keep your ratio below the threshold.</p>
            </div>
          </div>
        </section>

        {/* Important Notes */}
        <section className="mb-12 bg-blue-50 rounded-xl border border-blue-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-6 w-6 mr-2 text-blue-600" />
            Important Information
          </h2>
          
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">April 1, 2026 Deadline</p>
                <p className="text-sm">VAMP threshold drops to 1.5% (from 2.2%). Start protecting your business now.</p>
              </div>
            </li>
            <li className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">CE 3.0 Requirements</p>
                <p className="text-sm">Need 2+ historical transactions 120-365 days old with matching fingerprints. Vantirs automatically finds these matches.</p>
              </div>
            </li>
            <li className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Automatic vs Manual</p>
                <p className="text-sm">Disputes over $500 are flagged for manual review. You can add custom context before submission.</p>
              </div>
            </li>
            <li className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">No Guarantees</p>
                <p className="text-sm">While Vantirs identifies eligible disputes and generates evidence, final outcomes are determined by Stripe and card networks.</p>
              </div>
            </li>
          </ul>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            Need help getting started? <Link href="/setup-guide" className="text-blue-600 hover:underline">View Setup Guide</Link> or <Link href="/security" className="text-blue-600 hover:underline">Security Documentation</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
