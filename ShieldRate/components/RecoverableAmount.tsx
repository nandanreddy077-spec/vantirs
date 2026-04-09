'use client'

import { DollarSign, TrendingUp } from 'lucide-react'

interface RecoverableAmountProps {
  amount: number
}

export default function RecoverableAmount({ amount }: RecoverableAmountProps) {
  const formattedAmount = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Recoverable Revenue
              </p>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
              {formattedAmount}
            </p>
            <p className="text-sm text-gray-500 max-w-md">
              Disputes eligible for automatic evidence submission and liability shift
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Auto-Submit</span>
          </div>
        </div>
      </div>
    </div>
  )
}
