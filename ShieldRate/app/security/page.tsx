'use client'

import { Shield, Lock, Key, Database, AlertTriangle, CheckCircle2, ArrowLeft, Eye, FileLock } from 'lucide-react'
import VantirsLogo from '@/components/VantirsLogo'
import Link from 'next/link'

export default function SecurityPage() {
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
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Security</h1>
          </div>
          <p className="text-lg text-gray-600">
            How we protect your data and ensure compliance
          </p>
        </div>

        {/* Security Features */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Lock className="h-6 w-6 mr-2 text-blue-600" />
            Security Features
          </h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">API Key Hashing</h3>
                  <p className="text-gray-600 text-sm">All API keys are hashed using bcrypt with 12 salt rounds. We cannot retrieve your original API key - if lost, we generate a new one.</p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AES-256-GCM Encryption</h3>
                  <p className="text-gray-600 text-sm">Stripe restricted keys are encrypted at rest using AES-256-GCM encryption. Keys are never stored in plaintext.</p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Security Headers</h3>
                  <p className="text-gray-600 text-sm">All responses include security headers: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and Strict-Transport-Security (HTTPS only).</p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Rate Limiting</h3>
                  <p className="text-gray-600 text-sm">API endpoints are protected with rate limiting using Upstash Redis (with in-memory fallback) to prevent abuse and DoS attacks.</p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">CORS Protection</h3>
                  <p className="text-gray-600 text-sm">Cross-Origin Resource Sharing is strictly controlled with configurable allowed origins to prevent unauthorized access.</p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Request Size Limits</h3>
                  <p className="text-gray-600 text-sm">All API requests are limited to 1MB by default to prevent DoS attacks and resource exhaustion.</p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">PII Scrubbing</h3>
                  <p className="text-gray-600 text-sm">Activity logs are automatically sanitized to remove personally identifiable information before storage.</p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Row Level Security (RLS)</h3>
                  <p className="text-gray-600 text-sm">Database tables are protected with Row Level Security policies, ensuring data isolation between merchants.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stripe Key Security */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Key className="h-6 w-6 mr-2 text-blue-600" />
            Stripe Key Security
          </h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 mb-2">🔒 Security Guarantee</p>
                <p className="text-blue-800 text-sm mb-2">Vantirs requires <strong>restricted API keys only</strong>. We never ask for your full Stripe secret key.</p>
                <p className="text-blue-800 text-sm">Your restricted key can only:</p>
                <ul className="list-disc list-inside text-blue-800 text-sm mt-2 space-y-1">
                  <li>Read charges and disputes</li>
                  <li>Write to disputes (submit evidence)</li>
                  <li>Upload files to Stripe</li>
                </ul>
                <p className="text-blue-800 text-sm mt-2">Your restricted key <strong>cannot</strong>:</p>
                <ul className="list-disc list-inside text-blue-800 text-sm mt-2 space-y-1">
                  <li>Access customer data</li>
                  <li>Create or modify charges</li>
                  <li>Access payment methods</li>
                  <li>Modify account settings</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Encryption at Rest</h3>
              <p className="text-gray-600 text-sm">All Stripe restricted keys are encrypted using AES-256-GCM before being stored in the database. The encryption key is never stored alongside the encrypted data.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Key Rotation</h3>
              <p className="text-gray-600 text-sm">You can rotate your Stripe key at any time through the onboarding page. The old key is immediately invalidated and removed from our system.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Access Control</h3>
              <p className="text-gray-600 text-sm">Only the service role (backend) can decrypt and use your Stripe key. Frontend applications never have access to decrypted keys.</p>
            </div>
          </div>
        </section>

        {/* Database Security */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Database className="h-6 w-6 mr-2 text-blue-600" />
            Database Security
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Row Level Security (RLS)</h3>
              <p className="text-gray-600 text-sm mb-2">All tables have Row Level Security enabled, ensuring that:</p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-4">
                <li>Merchants can only access their own data</li>
                <li>Service role has full access (required for backend operations)</li>
                <li>Anonymous keys cannot access sensitive data</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Function Security</h3>
              <p className="text-gray-600 text-sm">Database functions use <code className="bg-gray-100 px-1 rounded">SET search_path = public</code> to prevent search path injection attacks.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Connection Security</h3>
              <p className="text-gray-600 text-sm">All database connections use SSL/TLS encryption. Connection strings are stored securely as environment variables.</p>
            </div>
          </div>
        </section>

        {/* Webhook Security */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FileLock className="h-6 w-6 mr-2 text-blue-600" />
            Webhook Security
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Signature Verification</h3>
              <p className="text-gray-600 text-sm">All Stripe webhooks are verified using HMAC-SHA256 signatures. Requests without valid signatures are immediately rejected.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Idempotency</h3>
              <p className="text-gray-600 text-sm">All webhook handlers are idempotent, meaning duplicate events are safely ignored. This prevents double-processing of disputes.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Event Validation</h3>
              <p className="text-gray-600 text-sm">Webhook events are validated against Stripe's API to ensure they're legitimate before processing.</p>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="mb-12 bg-green-50 rounded-xl border border-green-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-green-600" />
            Compliance & Certifications
          </h2>
          
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">PCI DSS Compliant (via Stripe's infrastructure)</p>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">GDPR Compliant data handling</p>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">SOC 2 Type II infrastructure (Supabase)</p>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">Regular security audits and penetration testing</p>
            </div>
          </div>
        </section>

        {/* Security Best Practices */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Best Practices</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">For Merchants</h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-4">
                <li>Always use restricted Stripe API keys (never full secret keys)</li>
                <li>Rotate your API keys regularly</li>
                <li>Keep your Vantirs API key secure and never share it</li>
                <li>Monitor your dashboard for suspicious activity</li>
                <li>Report any security concerns immediately</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">For Vantirs</h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-4">
                <li>Regular security audits and penetration testing</li>
                <li>Automated vulnerability scanning</li>
                <li>Security incident response plan</li>
                <li>Regular dependency updates</li>
                <li>Encrypted backups with secure key management</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            Questions about security? <Link href="/documentation" className="text-blue-600 hover:underline">View Documentation</Link> or <Link href="/setup-guide" className="text-blue-600 hover:underline">Setup Guide</Link>
          </p>
        </div>
      </div>
    </div>
  )
}



