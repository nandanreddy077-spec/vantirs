'use client'

import { useState } from 'react'
import { Shield, Zap, TrendingUp, ArrowRight, BarChart3, Lock, DollarSign, FileText, CheckCircle2, Play, Check, Search, Clock, CreditCard } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AuditModal from '@/components/AuditModal'

export default function Home() {
  const [auditModalOpen, setAuditModalOpen] = useState(false)

  // Calculate days until April 1, 2026
  const april2026 = new Date('2026-04-01')
  const today = new Date()
  const daysUntil = Math.max(0, Math.ceil((april2026.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="min-h-screen bg-white">
      <Navbar transparent />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-20">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-400/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-purple-400/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-indigo-400/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-slide-up">
            {/* Urgency Badge */}
            {daysUntil > 0 && (
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 border border-red-200/60 mb-8 animate-fade-in">
                <Clock className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-sm font-semibold text-red-700">
                  {daysUntil} days until VAMP threshold drops to 1.5% (April 1, 2026)
                </span>
              </div>
            )}

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.08] tracking-tight">
              Stop Losing Money to
              <br />
              <span className="text-gradient">Chargebacks</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Vantirs automatically fights every type of dispute &mdash; fraud, consumer, authorization, and processing errors.
              Bank-ready evidence, generated and submitted in under 2 minutes. <strong className="text-gray-900">Free during early access.</strong>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 px-4">
              <Link
                href="/onboarding"
                className="group relative overflow-hidden bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-gray-800 transition-all duration-300 flex items-center justify-center space-x-3 w-full sm:w-auto sm:min-w-[240px] shadow-lg"
              >
                <span>Start Protecting Revenue</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => setAuditModalOpen(true)}
                className="group bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-base border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex items-center justify-center space-x-3 w-full sm:w-auto sm:min-w-[240px]"
              >
                <Search className="h-5 w-5 text-gray-500" />
                <span>Run Free 90-Day Audit</span>
              </button>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-gray-500 mb-16">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>5-minute setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Visa &amp; Mastercard supported</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">9</div>
                <div className="text-sm text-gray-500">Dispute types covered</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">&lt;2 min</div>
                <div className="text-sm text-gray-500">Per dispute vs 2-4 hours</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">$0</div>
                <div className="text-sm text-gray-500">Free during early access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Cover Section */}
      <section className="py-20 sm:py-28 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Every dispute type. Handled automatically.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Vantirs covers the full spectrum of Visa and Mastercard dispute categories with specialized evidence engines for each.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Visa */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Visa Dispute Codes</h3>
              </div>
              <div className="space-y-3">
                {[
                  { code: '10.1', label: 'EMV Counterfeit', desc: 'Terminal certification + chip proof' },
                  { code: '10.2', label: 'EMV Non-Counterfeit', desc: 'PIN verification + auth proof' },
                  { code: '10.3', label: 'Card Present Fraud', desc: 'Signed receipt + in-person verification' },
                  { code: '10.4', label: 'CNP Fraud (CE 3.0)', desc: 'Forensic historical footprint matching' },
                  { code: '10.5', label: 'VFMP', desc: 'Auto-skipped (Visa accepts no evidence)' },
                  { code: '11.x', label: 'Authorization', desc: 'AVS/CVV match + 3DS authentication' },
                  { code: '12.x', label: 'Processing Errors', desc: 'Duplicate/cancellation/amount disputes' },
                  { code: '13.x', label: 'Consumer Disputes', desc: 'Shipping, delivery, product evidence' },
                ].map((item) => (
                  <div key={item.code} className="flex items-start space-x-3 py-2">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold min-w-[40px] text-center">
                      {item.code}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mastercard */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Mastercard Dispute Codes</h3>
              </div>
              <div className="space-y-3">
                {[
                  { code: '48xx', label: 'Fraud Disputes', desc: 'First-Party Trust matching + forensic evidence', codes: '4837, 4840, 4849, 4863, 4870, 4871' },
                  { code: '48xx', label: 'Cardholder Disputes', desc: 'Shipping proof + product documentation', codes: '4853, 4854, 4855, 4857-4860' },
                  { code: '48xx', label: 'Processing Errors', desc: 'Transaction details + cancellation proof', codes: '4831, 4834, 4842, 4846' },
                  { code: '48xx', label: 'Authorization', desc: 'Auth records + terminal verification', codes: '4807, 4808, 4812' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3 py-2">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-bold min-w-[40px] text-center">
                      MC
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Codes: {item.codes}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-800">
                  <strong>Mastercard First-Party Trust:</strong> Stricter than Visa CE 3.0 &mdash; requires device fingerprint consistency across all transactions plus customer ID or IP match.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-50 border border-red-100 mb-6">
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">The Problem</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Chargebacks are eating your revenue &mdash; and getting worse
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  On April 1, 2026, Visa&apos;s VAMP threshold drops from 2.2% to <strong className="text-gray-900">1.5%</strong>.
                  Merchants above this threshold face <strong className="text-gray-900">$8 per dispute</strong> in penalties.
                </p>
                <p>
                  Most merchants fight chargebacks manually, spending 2-4 hours per dispute and winning only 40-50% of the time.
                  That&apos;s thousands of dollars and hundreds of hours wasted every month.
                </p>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-50 border border-green-100 mb-6">
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">The Solution</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Vantirs fights every dispute automatically
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  For <strong className="text-gray-900">Visa 10.4 fraud</strong>, Vantirs uses <strong className="text-gray-900">Compelling Evidence 3.0</strong> to create automatic liability shifts
                  by proving 2+ previous successful purchases from the same device/IP.
                </p>
                <p>
                  For <strong className="text-gray-900">every other dispute type</strong> &mdash; Mastercard fraud, consumer complaints, authorization issues, processing errors &mdash;
                  Vantirs generates specialized evidence from your transaction data, activity logs, and charge metadata, then submits it automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Everything you need for chargeback defense
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Forensic matching, specialized evidence engines, VAMP monitoring &mdash; all features included free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'CE 3.0 &amp; First-Party Trust',
                description: 'Forensic historical footprint matching for Visa CE 3.0 and Mastercard First-Party Trust. Automatic liability shift when eligible.',
              },
              {
                icon: BarChart3,
                title: 'Intelligent Dispute Routing',
                description: 'Automatically classifies disputes by network and reason code, then routes to the right evidence engine — fraud, consumer, auth, or processing.',
              },
              {
                icon: FileText,
                title: 'Bank-Ready PDFs',
                description: 'Forensic compliance reports formatted for OCR scanning. Structured tables, not letters. Visa and Mastercard compliant.',
              },
              {
                icon: TrendingUp,
                title: 'VAMP Monitoring',
                description: 'Real-time dispute ratio tracking against the 1.5% threshold. Countdown to April 2026 deadline with projected penalties.',
              },
              {
                icon: Zap,
                title: 'Auto-Submission',
                description: 'Evidence is automatically submitted to Stripe for eligible disputes. Zero manual effort required for most dispute types.',
              },
              {
                icon: Lock,
                title: 'Full Coverage',
                description: 'Visa codes 10.1-10.5, 11.x, 12.x, 13.x. Mastercard fraud, cardholder, processing, and authorization disputes. All covered.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-5">
                  <feature.icon className="h-6 w-6 text-gray-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3" dangerouslySetInnerHTML={{ __html: feature.title }} />
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Set up in 5 minutes. Runs on autopilot.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect Stripe, run a 12-month backfill, and let Vantirs handle every dispute automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-10">
              {[
                {
                  step: '1',
                  title: 'Connect Your Stripe Account',
                  description: 'One-click OAuth or manual API key. Vantirs only needs read access to charges, disputes, customers, and payment intents, plus write access for evidence submission.',
                },
                {
                  step: '2',
                  title: 'Automatic Dispute Processing',
                  description: 'When a chargeback hits, Vantirs classifies it by network and reason code, selects the right evidence strategy (CE 3.0, consumer, auth, processing, or EMV), and submits automatically.',
                },
                {
                  step: '3',
                  title: 'Monitor &amp; Recover',
                  description: 'Track your VAMP ratio in real-time, see recoverable amounts, and watch dispute outcomes. Successful defenses reduce your dispute ratio.',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start space-x-5">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2" dangerouslySetInnerHTML={{ __html: item.title }} />
                    <p className="text-gray-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dashboard Preview */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Total Recoverable</div>
                    <div className="text-4xl font-bold text-gray-900">$12,450</div>
                  </div>
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-7 w-7 text-green-600" />
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Disputes</div>
                    <div className="text-xl font-bold text-gray-900">24</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Win Rate</div>
                    <div className="text-xl font-bold text-green-600">78%</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">VAMP</div>
                    <div className="text-xl font-bold text-green-600">0.8%</div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800 font-medium">Below 1.5% VAMP threshold</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Free for founding merchants.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every feature, unlimited disputes, no credit card required. We&apos;re onboarding our first merchants for free &mdash; paid plans come later, and early users lock in founder pricing.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative bg-white rounded-2xl p-8 sm:p-10 border-2 border-gray-900 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                  All Features Included
                </span>
              </div>
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-6xl font-bold text-gray-900">$0</span>
                  <span className="text-xl text-gray-500 ml-2">/month during early access</span>
                </div>
                <p className="text-gray-500">No credit card required</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited disputes per month',
                  'CE 3.0 + Mastercard First-Party Trust',
                  'Auto-submission to Stripe',
                  'VAMP threshold monitoring',
                  'All 9 dispute type evidence engines',
                  'Visa 10.1-10.5, 11.x, 12.x, 13.x',
                  'Mastercard fraud + non-fraud codes',
                  'Clean PDFs (no watermarks)',
                  'Shadow Pilot revenue audit',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/onboarding"
                className="block w-full bg-gray-900 text-white text-center px-6 py-4 rounded-xl font-semibold text-base hover:bg-gray-800 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          {/* FAQ Quick */}
          <div className="max-w-2xl mx-auto mt-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="text-center sm:text-left">
                <h4 className="font-semibold text-gray-900 mb-1">Why is it free?</h4>
                <p className="text-sm text-gray-500">We&apos;re building our founding merchant base. You get free protection now; when paid plans launch, early users get first access and grandfathered rates.</p>
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-semibold text-gray-900 mb-1">What do I need?</h4>
                <p className="text-sm text-gray-500">Just a Stripe account. Connect via OAuth (30 seconds) or API key (5 minutes).</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to stop losing money to chargebacks?
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            Connect your Stripe account in minutes. Start recovering revenue automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="group bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-base hover:bg-gray-100 transition-colors flex items-center justify-center space-x-3 min-w-[220px]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="group bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-4 rounded-xl font-semibold text-base hover:bg-white/20 transition-colors flex items-center justify-center space-x-3 min-w-[220px]"
            >
              <Play className="h-5 w-5" />
              <span>View Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Audit Modal */}
      <AuditModal isOpen={auditModalOpen} onClose={() => setAuditModalOpen(false)} />
    </div>
  )
}
