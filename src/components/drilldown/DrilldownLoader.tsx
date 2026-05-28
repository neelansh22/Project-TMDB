/**
 * DrilldownLoader Component
 * 
 * Loading skeleton for drilldown content
 */

'use client';

export default function DrilldownLoader() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Top metrics skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="bg-gray-200 rounded-lg h-64"></div>

      {/* List items skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
        ))}
      </div>
    </div>
  );
}
