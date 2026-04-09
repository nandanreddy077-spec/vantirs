'use client'

import Link from 'next/link'
import VantirsLogo from '@/components/VantirsLogo'
import { CheckCircle2 } from 'lucide-react'

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-premium p-10 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Vantirs!</h1>
          <p className="text-gray-600">
            All features are unlocked — completely free. Start fighting disputes now.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all hover:from-blue-700 hover:to-purple-700"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            <VantirsLogo width={100} height={32} />
          </div>
        </div>
      </div>
    </div>
  )
}
