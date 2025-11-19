/**
 * Skeleton loading state for Plan Comparison Table
 * Matches the actual table structure for better UX
 */

import Skeleton from '../Skeleton';

export default function PlanComparisonTableSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      {/* Table Header */}
      <Skeleton variant="rectangular" height={32} className="mb-6 w-1/3" />

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Table Head */}
          <div className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-200">
            <Skeleton variant="rectangular" height={48} className="bg-blue-100" />
            <Skeleton variant="rectangular" height={48} />
            <Skeleton variant="rectangular" height={48} />
            <Skeleton variant="rectangular" height={48} />
          </div>

          {/* Table Rows */}
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100">
              <Skeleton variant="text" className="font-semibold" />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
            </div>
          ))}

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-4 pt-6">
            <div /> {/* Empty cell for labels column */}
            <Skeleton variant="rectangular" height={44} className="rounded-lg" />
            <Skeleton variant="rectangular" height={44} className="rounded-lg" />
            <Skeleton variant="rectangular" height={44} className="rounded-lg" />
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2 mt-2" />
      </div>
    </div>
  );
}
