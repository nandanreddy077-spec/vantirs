'use client'

import { AlertTriangle, CheckCircle, DollarSign } from 'lucide-react'

interface VAMPMonitorProps {
  vampRatio: number
  totalDisputes: number
  totalTransactions: number
  vampDisputes?: number // Disputes that count for VAMP
}

export default function VAMPMonitor({ vampRatio, totalDisputes, totalTransactions, vampDisputes }: VAMPMonitorProps) {
  // April 1, 2026 VAMP threshold: 1.5% (1500 basis points)
  // Current threshold until April 1: 2.2%
  const currentThreshold = 0.022 // 2.2% until April 1, 2026
  const aprilThreshold = 0.015 // 1.5% starting April 1, 2026
  const penaltyPerDispute = 8 // $8-10 per dispute if over threshold
  
  // Use April threshold for risk calculation (we're preparing for April 1)
  const threshold = aprilThreshold
  const isAtRisk = vampRatio > threshold
  const percentage = (vampRatio * 100).toFixed(2)
  const progressPercentage = Math.min((vampRatio / threshold) * 100, 100)
  
  // Calculate projected April 1st penalty
  const disputesThatCount = vampDisputes || totalDisputes
  const projectedPenalty = vampRatio > aprilThreshold 
    ? disputesThatCount * penaltyPerDispute 
    : 0
  
  // Calculate how many disputes need to be won to get under threshold
  const disputesToWin = Math.ceil((vampRatio - aprilThreshold) * totalTransactions)
  
  // Calculate monthly penalty projection (assuming current dispute rate continues)
  const monthlyPenalty = projectedPenalty

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">VAMP Threshold Monitor</h2>
          <p className="text-sm text-gray-500 mt-1">
            Visa Acquirer Monitoring Program - April 1, 2026 Threshold: 1.5%
          </p>
          <p className="text-xs text-red-600 mt-1 font-medium">
            ⚠️ Current: 2.2% → April 1st: 1.5% (The Cliff)
          </p>
        </div>
        {isAtRisk ? (
          <div className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className="font-semibold">At Risk</span>
          </div>
        ) : (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-semibold">Safe</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Current Ratio: {percentage}%
          </span>
          <span className="text-sm font-medium text-gray-700">
            April 1st Threshold: 1.50%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAtRisk ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500">Disputes</p>
          <p className="text-lg font-semibold text-gray-900">{totalDisputes}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Transactions</p>
          <p className="text-lg font-semibold text-gray-900">
            {totalTransactions.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Projected April 1st Penalty */}
      {projectedPenalty > 0 && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
          <div className="flex items-start">
            <DollarSign className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">
                Projected April 1st Penalty
              </p>
              <p className="text-lg font-bold text-red-700 mt-1">
                ${projectedPenalty.toLocaleString()}/month
              </p>
              <p className="text-xs text-red-700 mt-2">
                Based on current ratio ({percentage}%) with {disputesThatCount} disputes counting.
                {disputesToWin > 0 && (
                  <span className="block mt-1">
                    Win {disputesToWin} disputes via CE 3.0 to get under 1.5% threshold.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning Message */}
      {isAtRisk && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <strong>Critical Warning:</strong> Your dispute ratio ({percentage}%) exceeds the April 1st VAMP threshold (1.5%). 
            You will be subject to ${penaltyPerDispute}-${penaltyPerDispute + 2} per dispute penalties starting April 1, 2026.
            Acquirers may shut down merchants that put their portfolio at risk. Activate CE 3.0 defense immediately 
            to remove eligible disputes from your ratio calculation.
          </p>
        </div>
      )}

      {/* Info Message */}
      {!isAtRisk && vampRatio > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Info:</strong> CE 3.0 eligible disputes are automatically removed 
            from your VAMP calculation when won, reducing your effective ratio. You're currently 
            safe, but monitor closely as the April 1st 1.5% threshold approaches.
          </p>
        </div>
      )}
      
      {/* April 1st Countdown Warning */}
      {!isAtRisk && vampRatio > 0.01 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>April 1st Deadline:</strong> The VAMP threshold drops from 2.2% to 1.5% on April 1, 2026. 
            Your current ratio ({percentage}%) is below the new threshold, but you're close. 
            Consider proactive CE 3.0 defense to maintain safety margin.
          </p>
        </div>
      )}
    </div>
  )
}

