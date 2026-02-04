'use client'

import { DollarSign } from 'lucide-react'

interface RecoverableAmountProps {
  amount: number
}

export default function RecoverableAmount({ amount }: RecoverableAmountProps) {
  const formattedAmount = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-green-100 mb-1">
            Money Recoverable (Auto-Win Eligible)
          </p>
          <p className="text-4xl font-bold">{formattedAmount}</p>
          <p className="text-sm text-green-100 mt-2">
            These disputes qualify for automatic CE 3.0 liability shift
          </p>
        </div>
        <div className="bg-white/20 rounded-full p-4">
          <DollarSign className="h-12 w-12" />
        </div>
      </div>
    </div>
  )
}


