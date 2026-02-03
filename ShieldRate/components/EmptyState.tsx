/**
 * Empty State Component
 * Encourages users to run Shadow Pilot script
 */

import { FileText, PlayCircle } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  title = 'No Disputes Found',
  description = 'Run the Shadow Pilot script to analyze your historical Stripe disputes and identify recoverable revenue.',
  actionLabel = 'Learn More',
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">{description}</p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
        <div className="flex items-start">
          <PlayCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <p className="text-sm font-medium text-blue-900 mb-1">
              Run Shadow Pilot to Find Recoverable Revenue
            </p>
            <p className="text-xs text-blue-700 mb-3">
              The Shadow Pilot script scans your last 90 days of Stripe disputes and shows you exactly how much money you're leaving on the table.
            </p>
            <code className="block text-xs bg-blue-100 text-blue-900 p-2 rounded font-mono">
              npx tsx scripts/shadow-pilot.ts
            </code>
          </div>
        </div>
      </div>

      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

