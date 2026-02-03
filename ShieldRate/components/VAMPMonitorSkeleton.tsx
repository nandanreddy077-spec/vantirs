/**
 * Loading Skeleton for VAMPMonitor
 */

export default function VAMPMonitorSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
        <div>
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
        <div>
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

