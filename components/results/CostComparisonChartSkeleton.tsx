/**
 * Skeleton loading state for Cost Comparison Chart
 * Matches the chart layout for better UX
 */

import Skeleton from '../Skeleton';

export default function CostComparisonChartSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 h-[300px] flex flex-col">
      {/* Chart Title */}
      <Skeleton variant="rectangular" height={24} className="mb-6 w-1/3" />

      {/* Chart Area */}
      <div className="flex-1 flex items-end justify-around gap-4 px-8">
        {/* Bar 1 (Recommended) - Tallest */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <Skeleton variant="rectangular" height={180} className="w-full rounded-t-lg" />
          <Skeleton variant="text" className="w-20" />
        </div>

        {/* Bar 2 (Alternative 1) */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <Skeleton variant="rectangular" height={140} className="w-full rounded-t-lg" />
          <Skeleton variant="text" className="w-20" />
        </div>

        {/* Bar 3 (Alternative 2) */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <Skeleton variant="rectangular" height={160} className="w-full rounded-t-lg" />
          <Skeleton variant="text" className="w-20" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-center">
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" width={16} height={16} />
          <Skeleton variant="text" width={80} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" width={16} height={16} />
          <Skeleton variant="text" width={80} />
        </div>
      </div>
    </div>
  );
}
