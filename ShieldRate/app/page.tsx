'use client'

// Vantirs Landing Page - Home Route
// Force rebuild: 2026-02-04
import { useState } from 'react'
import { Shield, Zap, TrendingUp, ArrowRight, BarChart3, Lock, Clock, DollarSign, FileText, CheckCircle2, Sparkles, Play, Check, X, Menu, Search } from 'lucide-react'
import Link from 'next/link'
import VantirsLogo from '@/components/VantirsLogo'
import AuditModal from '@/components/AuditModal'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [auditModalOpen, setAuditModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center group">
              <VantirsLogo width={160} height={52} className="flex-shrink-0" />
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/onboarding"
                className="gradient-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:shadow-glow transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg animate-fade-in">
              <div className="px-4 py-4 space-y-3">
                <Link
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-600 hover:text-gray-900 text-base font-medium transition-colors py-2"
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-600 hover:text-gray-900 text-base font-medium transition-colors py-2"
                >
                  How It Works
                </Link>
                <Link
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-600 hover:text-gray-900 text-base font-medium transition-colors py-2"
                >
                  Pricing
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-600 hover:text-gray-900 text-base font-medium transition-colors py-2"
                >
                  Dashboard
                </Link>
                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block gradient-primary text-white px-6 py-3 rounded-xl font-semibold text-sm text-center hover:shadow-glow transition-all duration-300 mt-4"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Premium Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-gradient-subtle border border-blue-200/50 mb-6 sm:mb-8 animate-fade-in mx-4 sm:mx-0">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                April 1, 2026 Deadline: VAMP Threshold Drops to 1.5%
              </span>
            </div>

            {/* Main Headline - Kinso Style */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-6 sm:mb-8 leading-[1.1] tracking-tight px-4">
              Automated
              <br />
              <span className="text-gradient">CE 3.0 Compliance</span>
              <br />
              for Chargeback Defense
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-4">
              Vantirs intelligently identifies disputes eligible for Visa CE 3.0 liability shift 
              and generates bank-admissible forensic evidence in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-20 px-4">
              <Link
                href="/onboarding"
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-semibold text-base sm:text-lg hover:shadow-glow hover:from-blue-700 hover:to-purple-700 transition-all duration-500 flex items-center justify-center space-x-3 w-full sm:w-auto sm:min-w-[240px] shadow-lg"
              >
                <span className="relative z-10">Start Protecting Revenue</span>
                <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
              </Link>
              <button
                onClick={() => setAuditModalOpen(true)}
                className="group bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-semibold text-base sm:text-lg hover:shadow-glow hover:from-green-600 hover:to-emerald-700 transition-all duration-500 flex items-center justify-center space-x-3 w-full sm:w-auto sm:min-w-[240px] shadow-lg"
              >
                <Search className="h-5 w-5" />
                <span>Run Free 90-Day CE 3.0 Audit</span>
              </button>
              <Link
                href="/dashboard"
                className="group bg-white text-gray-900 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-semibold text-base sm:text-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-premium transition-all duration-300 flex items-center justify-center space-x-3 w-full sm:w-auto sm:min-w-[240px]"
              >
                <Play className="h-5 w-5" />
                <span>View Dashboard</span>
              </Link>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-32">
              <div className="group bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 hover:border-gray-300/50 hover:shadow-premium transition-all duration-500 hover-lift">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-5xl font-bold text-gray-900 mb-3">65-85%</div>
                <div className="text-base text-gray-600 font-medium">Win Rate on CE 3.0 Eligible</div>
              </div>
              
              <div className="group bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 hover:border-gray-300/50 hover:shadow-premium transition-all duration-500 hover-lift animation-delay-600">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-5xl font-bold text-gray-900 mb-3">&lt; 2 min</div>
                <div className="text-base text-gray-600 font-medium">Per Dispute (vs 2-4 hours)</div>
              </div>
              
              <div className="group bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 hover:border-gray-300/50 hover:shadow-premium transition-all duration-500 hover-lift animation-delay-1200">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-5xl font-bold text-gray-900 mb-3">1.5%</div>
                <div className="text-base text-gray-600 font-medium">VAMP Threshold (April 2026)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Premium Design */}
      <section id="features" className="py-32 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Everything You Need for
              <br />
              <span className="text-gradient">CE 3.0 Compliance</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Automated, compliant, and ready for the April 2026 regulatory deadline
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'CE 3.0 Historical Matching',
                description: 'Automatically finds 2+ successful transactions from 120-365 days ago with matching IP/device fingerprints',
                gradient: 'from-blue-500 to-cyan-500',
                bgGradient: 'from-blue-50 to-cyan-50',
              },
              {
                icon: BarChart3,
                title: 'Compliance Score Calculation',
                description: '0-100 score based on Identity, Value, Consent, and Continuity evidence',
                gradient: 'from-green-500 to-emerald-500',
                bgGradient: 'from-green-50 to-emerald-50',
              },
              {
                icon: FileText,
                title: 'Forensic PDF Generation',
                description: 'Bank-ready compliance reports formatted for OCR scanning, not letters',
                gradient: 'from-purple-500 to-pink-500',
                bgGradient: 'from-purple-50 to-pink-50',
              },
              {
                icon: TrendingUp,
                title: 'VAMP Threshold Monitoring',
                description: 'Real-time tracking of dispute ratio vs. 1.5% threshold with automatic alerts',
                gradient: 'from-orange-500 to-red-500',
                bgGradient: 'from-orange-50 to-red-50',
              },
              {
                icon: Zap,
                title: 'Auto-Win Detection',
                description: 'Identifies disputes that qualify for automatic liability shift',
                gradient: 'from-yellow-500 to-amber-500',
                bgGradient: 'from-yellow-50 to-amber-50',
              },
              {
                icon: Lock,
                title: 'Automatic Submission',
                description: 'Auto-submits evidence to Stripe for CE 3.0 eligible disputes',
                gradient: 'from-indigo-500 to-purple-500',
                bgGradient: 'from-indigo-50 to-purple-50',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative bg-white rounded-3xl p-8 border border-gray-200/50 hover:border-gray-300/50 hover:shadow-premium transition-all duration-500 hover-lift"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500`}></div>
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-base">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Take a Look Inside
              <br />
              <span className="text-gradient">Vantirs</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Whether you're dealing with chargebacks, monitoring VAMP thresholds, or preparing for the April 2026 deadline, 
              Vantirs brings together all your dispute management in one intelligent dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Stripe Account</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Securely connect with a restricted API key. Vantirs only needs read access to charges and disputes, 
                    plus the ability to submit evidence. Your money and account settings remain protected.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Automatic Dispute Processing</h3>
                  <p className="text-gray-600 leading-relaxed">
                    When a chargeback occurs, Vantirs automatically identifies CE 3.0 eligible disputes, 
                    generates bank-ready compliance evidence, and submits it to Stripe—all in under 2 minutes.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Monitor & Recover</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Track your VAMP ratio in real-time, see recoverable amounts, and monitor dispute outcomes. 
                    CE 3.0 wins are automatically excluded from your ratio calculation.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 border border-gray-200/50 shadow-premium">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Total Recoverable</div>
                      <div className="text-4xl font-bold text-gray-900">$12,450</div>
                    </div>
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">Disputes</div>
                      <div className="text-2xl font-bold text-gray-900">24</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">Win Rate</div>
                      <div className="text-2xl font-bold text-gray-900">78%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Premium */}
      <section id="pricing" className="py-32 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Simple, Transparent
              <br />
              <span className="text-gradient">Pricing</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Choose the plan that fits your dispute volume. All plans include CE 3.0 detection and bank-ready evidence generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* FREE Plan */}
            <div className="relative bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-gray-300 hover:shadow-premium transition-all duration-500 hover-lift">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  FREE
                  <span className="text-lg text-gray-500 font-normal"> (Demo)</span>
                </h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                </div>
                <p className="text-sm text-gray-600">Perfect for testing</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">Read-only CE 3.0 detection</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">Watermarked PDFs</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">2 disputes lifetime</span>
                </li>
                <li className="flex items-start">
                  <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-400">Auto-submission</span>
                </li>
                <li className="flex items-start">
                  <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-400">VAMP monitoring</span>
                </li>
              </ul>
              <Link
                href="/onboarding"
                className="block w-full bg-gray-900 text-white text-center px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300"
              >
                Start Free
              </Link>
            </div>

            {/* STARTER Plan - Most Popular */}
            <div className="relative bg-white rounded-3xl p-8 border-2 border-blue-500 shadow-premium hover:shadow-hover transition-all duration-500 hover-lift scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">STARTER</h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-5xl font-bold text-gray-900">$99</span>
                  <span className="text-lg text-gray-500 ml-1">/mo</span>
                </div>
                <p className="text-sm text-gray-600">For small SaaS businesses</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">25 disputes/month</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">Auto-submission</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">VAMP monitoring</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">Clean PDFs</span>
                </li>
                <li className="flex items-start">
                  <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-400">Shadow Pilot</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Subscribe
              </Link>
            </div>

            {/* PROFESSIONAL Plan */}
            <div className="relative bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-gray-300 hover:shadow-premium transition-all duration-500 hover-lift">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">PROFESSIONAL</h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-5xl font-bold text-gray-900">$249</span>
                  <span className="text-lg text-gray-500 ml-1">/mo</span>
                </div>
                <p className="text-sm text-gray-600">For growing businesses</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">100 disputes/month</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">Priority processing</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">Shadow Pilot</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">All Starter features</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Subscribe
              </Link>
            </div>

            {/* ENTERPRISE Plan */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border-2 border-gray-700 hover:border-gray-600 hover:shadow-premium transition-all duration-500 hover-lift">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">ENTERPRISE</h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-5xl font-bold text-white">Custom</span>
                </div>
                <p className="text-sm text-gray-400">For large organizations</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-300">Unlimited disputes</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-300">SLA guarantee</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-300">White-label option</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-300">All Professional features</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-300">Dedicated support</span>
                </li>
              </ul>
              <Link
                href="mailto:sales@vantirs.com?subject=Enterprise Plan Inquiry"
                className="block w-full bg-white text-gray-900 text-center px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300"
              >
                Contact Sales
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 text-sm">
              All plans include CE 3.0 detection, bank-ready PDFs, and real-time dispute monitoring.
              <br />
              <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-semibold underline">
                View detailed pricing →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section - Premium */}
      <section className="py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDEuMS0uOSAyLTIgMkgyNGMtMS4xIDAtMi0uOS0yLTJWMTJjMC0xLjEuOS0yIDItMmgxMGMxLjEgMCAyIC45IDIgMnYyMnoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMDUiLz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Ready to Protect Your Revenue?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light">
            Connect your Stripe account in minutes and start recovering chargebacks automatically. 
            No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="group relative overflow-hidden bg-white text-gray-900 px-10 py-5 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-500 flex items-center justify-center space-x-3 min-w-[240px]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="group bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 px-10 py-5 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-3 min-w-[240px]"
            >
              <Play className="h-5 w-5" />
              <span>View Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <VantirsLogo width={140} height={44} className="flex-shrink-0" />
              </div>
              <p className="text-gray-600 text-sm">
                Automated CE 3.0 compliance for chargeback defense. Built for the April 2026 regulatory deadline.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</Link></li>
                <li><Link href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/setup-guide" className="hover:text-gray-900 transition-colors">Setup Guide</Link></li>
                <li><Link href="/documentation" className="hover:text-gray-900 transition-colors">Documentation</Link></li>
                <li><Link href="/security" className="hover:text-gray-900 transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              © 2026 Vantirs. All rights reserved. Built for the April 2026 regulatory cliff.
            </p>
          </div>
        </div>
      </footer>

      {/* Audit Modal */}
      <AuditModal isOpen={auditModalOpen} onClose={() => setAuditModalOpen(false)} />
    </div>
  )
}
