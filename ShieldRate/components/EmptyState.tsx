/**
 * Empty State Component
 * Encourages users to run Shadow Pilot script
 */

import { FileText, PlayCircle, Sparkles } from 'lucide-react'

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
    <div className="text-center py-16 animate-fade-in">
      <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-6">
        <FileText className="h-10 w-10 text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">{description}</p>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8 max-w-2xl mx-auto text-left">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
              <PlayCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Run Shadow Pilot to Find Recoverable Revenue
            </p>
            <p className="text-sm text-blue-800 mb-4 leading-relaxed">
              The Shadow Pilot script scans your last 90 days of Stripe disputes and shows you exactly how much money you're leaving on the table.
            </p>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <code className="block text-sm bg-gray-900 text-green-400 p-3 rounded font-mono text-left overflow-x-auto">
                <span className="text-gray-400">$</span> npx tsx scripts/shadow-pilot.ts
              </code>
            </div>
          </div>
        </div>
      </div>

      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white gradient-primary hover:shadow-lg transition-all duration-300"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
