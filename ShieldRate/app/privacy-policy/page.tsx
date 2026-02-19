'use client'

import { FileText, Shield, Eye, Lock, ArrowLeft, Calendar } from 'lucide-react'
import VantirsLogo from '@/components/VantirsLogo'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
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
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <p>Last Updated: February 19, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
          <section>
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy explains how Vantirs ("Vantirs," "we," "our," or "us") collects, uses, and protects information in connection with the Vantirs CE 3.0 compliance engine and related services (the "Service").
            </p>
            <p className="text-gray-700 leading-relaxed mt-4 font-semibold">
              If you do not agree with this Privacy Policy, you must not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Legal Status</h2>
            <p className="text-gray-700 leading-relaxed">
              Vantirs is currently operated as a pre-incorporation venture by its founder. Formal incorporation is in progress. Upon incorporation, this Privacy Policy will be updated to reflect the registered legal entity.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              For any legal or privacy-related inquiries, please contact: <a href="mailto:anixagency7@gmail.com" className="text-blue-600 hover:underline">anixagency7@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Scope</h2>
            <p className="text-gray-700 leading-relaxed mb-4">This Policy applies to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Merchants using Vantirs</li>
              <li>Website visitors</li>
              <li>Authorized account users</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              This Policy does not apply to Stripe or other third-party platforms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data We Process</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">A. Account Information (Controller Role)</h3>
                <p className="text-gray-700 leading-relaxed mb-2">We collect:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Company name</li>
                  <li>Billing information</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-2">
                  <strong>Purpose:</strong> Account creation, authentication, billing.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Legal basis (GDPR):</strong> Contract performance.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">B. Stripe Integration Data (Processor Role)</h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                  To provide our Service, merchants provide a restricted Stripe API key.
                </p>
                <p className="text-gray-700 leading-relaxed mb-2">We may process:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Dispute identifiers</li>
                  <li>Charge identifiers</li>
                  <li>Transaction amounts and timestamps</li>
                  <li>Dispute status</li>
                  <li>Limited metadata (billing country, IP address, customer ID)</li>
                  <li>Evidence files submitted to Stripe</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4 font-semibold">We do NOT:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Store full card numbers</li>
                  <li>Store CVC codes</li>
                  <li>Process sensitive authentication data</li>
                  <li>Store raw Stripe webhook payloads</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Stripe remains the payment processor and PCI DSS entity.
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                  <strong>Legal basis:</strong> Processing under merchant instruction (Data Processor role).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">C. Technical and Usage Data</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-2">
                  <li>IP address</li>
                  <li>Device type and browser</li>
                  <li>API request logs</li>
                  <li>Error logs</li>
                  <li>Authentication events</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Purpose:</strong> Security, fraud prevention, system stability.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Legal basis:</strong> Legitimate interest.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Use Data</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use information to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Generate CE 3.0 compliant evidence</li>
              <li>Match historical transactions</li>
              <li>Submit dispute evidence to Stripe</li>
              <li>Secure the Service</li>
              <li>Improve reliability and performance</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We do not sell personal data.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We do not use merchant data for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Processing Roles</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>For account data:</strong> Vantirs acts as a Data Controller.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>For Stripe dispute and transaction data:</strong> Vantirs acts as a Data Processor on behalf of merchants.
            </p>
            <p className="text-gray-700 leading-relaxed">
              A Data Processing Agreement (DPA) is available upon request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Security Measures</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We implement:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>TLS encryption in transit</li>
              <li>AES-256 encryption at rest</li>
              <li>Restricted API key scopes</li>
              <li>Role-based access controls</li>
              <li>Database row-level isolation</li>
              <li>Continuous security monitoring</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              API keys are encrypted at rest and never logged in plaintext.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              No system is completely secure, but we implement commercially reasonable safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Subprocessors</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We may use infrastructure providers, including:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Hosting provider</li>
              <li>Database provider</li>
              <li>Payment processor (Stripe)</li>
              <li>Email infrastructure provider</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              All subprocessors are bound by contractual confidentiality and security obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We retain data only as necessary to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide the Service</li>
              <li>Comply with tax and legal requirements</li>
              <li>Resolve disputes</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 font-semibold">Typical retention:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Account data: Duration of account + up to 7 years (where legally required)</li>
              <li>Dispute data: As instructed by merchant</li>
              <li>Logs: Up to 12 months</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Upon account deletion, personal data is deleted or anonymized within 30 days, unless legally required otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Data may be processed outside your jurisdiction.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              For EU/UK users, appropriate safeguards such as Standard Contractual Clauses are used where required.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Your Rights</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-700 leading-relaxed font-semibold mb-2">EEA / UK users may:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Access their data</li>
                  <li>Request correction</li>
                  <li>Request deletion</li>
                  <li>Request portability</li>
                  <li>Restrict or object to processing</li>
                </ul>
              </div>
              <div>
                <p className="text-gray-700 leading-relaxed font-semibold mb-2">California residents may:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Request disclosure of categories of data collected</li>
                  <li>Request deletion</li>
                  <li>Confirm data is not sold</li>
                </ul>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>Requests:</strong> <a href="mailto:anixagency7@gmail.com" className="text-blue-600 hover:underline">anixagency7@gmail.com</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service is not intended for individuals under 18.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Policy periodically. Continued use of the Service constitutes acceptance of changes.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            <Link href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</Link> • <Link href="/security" className="text-blue-600 hover:underline">Security</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
