'use client'

import Link from 'next/link'
import VantirsLogo from './VantirsLogo'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <VantirsLogo width={130} height={42} className="flex-shrink-0 mb-4" />
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Automated CE 3.0 compliance engine for chargeback defense. Protect your revenue before the April 2026 deadline.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Product</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href="/#features" className="hover:text-gray-900 transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</Link></li>
              <li><Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Resources</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href="/setup-guide" className="hover:text-gray-900 transition-colors">Setup Guide</Link></li>
              <li><Link href="/documentation" className="hover:text-gray-900 transition-colors">Documentation</Link></li>
              <li><Link href="/security" className="hover:text-gray-900 transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Legal</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Vantirs. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">
            Built for the April 2026 VAMP regulatory deadline.
          </p>
        </div>
      </div>
    </footer>
  )
}
