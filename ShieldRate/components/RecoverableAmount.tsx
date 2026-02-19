'use client'

import { DollarSign, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'

interface RecoverableAmountProps {
  amount: number
}

export default function RecoverableAmount({ amount }: RecoverableAmountProps) {
  const formattedAmount = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 0,
  })

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-premium animate-scale-in group">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600"></div>
      
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDEuMS0uOSAyLTIgMkgyNGMtMS4xIDAtMi0uOS0yLTJWMTJjMC0xLjEuOS0yIDItMmgxMGMxLjEgMCAyIC45IDIgMnYyMnoiIGZpbGw9IiNmZmYiLz48L2c+PC9zdmc+')]"></div>
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 animate-shimmer"></div>

      <div className="relative p-10 md:p-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex-1 mb-8 md:mb-0">
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="h-6 w-6 text-white/90" />
              <p className="text-sm font-bold text-white/90 uppercase tracking-wider">
                Money Recoverable
              </p>
            </div>
            <p className="text-6xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
              {formattedAmount}
            </p>
            <p className="text-xl text-white/90 max-w-md leading-relaxed mb-6">
              These disputes qualify for automatic CE 3.0 liability shift and can be recovered automatically
            </p>
            
            {/* Premium Stats */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                <TrendingUp className="h-4 w-4 text-white/90" />
                <span className="text-sm text-white font-semibold">65-85% Win Rate</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                <DollarSign className="h-4 w-4 text-white/90" />
                <span className="text-sm text-white font-semibold">Auto-Submit Enabled</span>
              </div>
            </div>
          </div>
          
          {/* Premium Icon */}
          <div className="flex-shrink-0">
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 border border-white/30 group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="h-20 w-20 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
