'use client'

import { useState } from 'react'
import { X, Menu } from 'lucide-react'
import Link from 'next/link'
import VantirsLogo from './VantirsLogo'

interface NavbarProps {
  transparent?: boolean
  showCTA?: boolean
}

export default function Navbar({ transparent = false, showCTA = true }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${transparent ? 'glass-effect' : 'bg-white/95 backdrop-blur-lg'} border-b border-gray-100/50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link href="/" className="flex items-center group">
            <VantirsLogo width={140} height={46} className="flex-shrink-0" />
          </Link>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/#features"
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
            >
              Pricing
            </Link>
            <Link
              href="/documentation"
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
            >
              Docs
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
            >
              Dashboard
            </Link>
            {showCTA && (
              <Link
                href="/onboarding"
                className="ml-2 gradient-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-glow transition-all duration-300"
              >
                Get Started Free
              </Link>
            )}
          </div>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
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
          <div className="md:hidden border-t border-gray-200 bg-white/98 backdrop-blur-lg animate-fade-in pb-4">
            <div className="px-2 py-3 space-y-1">
              {[
                { href: '/#features', label: 'Features' },
                { href: '/#how-it-works', label: 'How It Works' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/documentation', label: 'Docs' },
                { href: '/dashboard', label: 'Dashboard' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-base font-medium transition-colors py-3 px-4 rounded-lg"
                >
                  {item.label}
                </Link>
              ))}
              {showCTA && (
                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block gradient-primary text-white px-6 py-3 rounded-xl font-semibold text-sm text-center hover:shadow-glow transition-all duration-300 mt-3 mx-2"
                >
                  Get Started Free
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
