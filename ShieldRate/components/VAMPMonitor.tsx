'use client'

import { AlertTriangle, CheckCircle, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'

interface VAMPMonitorProps {
  vampRatio: number
  totalDisputes: number
  totalTransactions: number
  vampDisputes?: number
}

export default function VAMPMonitor({ vampRatio, totalDisputes, totalTransactions, vampDisputes }: VAMPMonitorProps) {
  const currentThreshold = 0.022 // 2.2% until April 1, 2026
  const aprilThreshold = 0.015 // 1.5% starting April 1, 2026
  const penaltyPerDispute = 8
  
  const threshold = aprilThreshold
  const isAtRisk = vampRatio > threshold
  const percentage = (vampRatio * 100).toFixed(2)
  const progressPercentage = Math.min((vampRatio / threshold) * 100, 100)
  
  const disputesThatCount = vampDisputes || totalDisputes
  const projectedPenalty = vampRatio > aprilThreshold 
    ? disputesThatCount * penaltyPerDispute 
    : 0
  
  const disputesToWin = Math.ceil((vampRatio - aprilThreshold) * totalTransactions)
  
  // Calculate days until April 1, 2026
  const april2026 = new Date('2026-04-01')
  const today = new Date()
  const daysUntil = Math.ceil((april2026.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
      {/* Clean Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-4xl font-bold text-gray-900">{percentage}%</span>
            {isAtRisk ? (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">At Risk</span>
            ) : vampRatio > 0 ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">Safe</span>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Threshold</p>
            <p className="text-lg font-bold text-gray-900">1.5%</p>
          </div>
        </div>
      </div>

      {/* Simple Progress Bar */}
      <div className="mb-6">
        <div className="relative w-full bg-gray-100 rounded-full h-8 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isAtRisk 
                ? 'bg-red-500' 
                : progressPercentage > 80
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
          {/* Threshold marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-900"
            style={{ left: '15%' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>0%</span>
          <span className="font-medium">Threshold: 1.5%</span>
          <span>10%</span>
        </div>
      </div>

      {/* Simple Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Disputes</p>
          <p className="text-2xl font-bold text-gray-900">{disputesThatCount}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{totalTransactions.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Ratio</p>
          <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Days Left</p>
          <p className="text-2xl font-bold text-gray-900">{daysUntil}</p>
        </div>
      </div>

      {/* Simple Status Message */}
      {isAtRisk && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-900 mb-1">Above Threshold</p>
              <p className="text-xs text-red-700">
                Your ratio ({percentage}%) exceeds 1.5%. Win {disputesToWin} dispute{disputesToWin !== 1 ? 's' : ''} via CE 3.0 to get under threshold.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isAtRisk && vampRatio > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-900 mb-1">Safe Zone</p>
              <p className="text-xs text-green-700">
                Your ratio ({percentage}%) is below the 1.5% threshold.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {vampRatio === 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              No active disputes counting toward your VAMP ratio.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
