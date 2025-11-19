/**
 * Skeleton loading state for Marketplace Plans
 * Matches the plan card grid layout for better UX
 */

import Skeleton from '../Skeleton';

function PlanCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      {/* Plan Name & Insurer */}
      <div className="mb-4">
        <Skeleton variant="rectangular" height={24} className="mb-2 w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>

      {/* Metal Tier Badge */}
      <Skeleton variant="rectangular" height={24} width={80} className="mb-4 rounded-full" />

      {/* Cost Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Skeleton variant="text" className="mb-1 w-20" />
          <Skeleton variant="rectangular" height={32} className="w-full" />
        </div>
        <div>
          <Skeleton variant="text" className="mb-1 w-20" />
          <Skeleton variant="rectangular" height={32} className="w-full" />
        </div>
      </div>

      {/* Coverage Details */}
      <div className="space-y-2 mb-4">
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" className="w-4/5" />
      </div>

      {/* View Details Button */}
      <Skeleton variant="rectangular" height={40} className="w-full rounded-lg" />
    </div>
  );
}

export default function MarketplacePlansSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-8">
      {/* Section Header */}
      <div className="mb-6">
        <Skeleton variant="rectangular" height={32} className="mb-2 w-1/3" />
        <Skeleton variant="text" className="w-2/3" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Skeleton variant="rectangular" height={40} width={120} className="rounded-lg" />
        <Skeleton variant="rectangular" height={40} width={120} className="rounded-lg" />
        <Skeleton variant="rectangular" height={40} width={120} className="rounded-lg" />
      </div>

      {/* Plan Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center gap-2">
        <Skeleton variant="rectangular" height={40} width={40} className="rounded" />
        <Skeleton variant="rectangular" height={40} width={40} className="rounded" />
        <Skeleton variant="rectangular" height={40} width={40} className="rounded" />
        <Skeleton variant="rectangular" height={40} width={40} className="rounded" />
      </div>
    </div>
  );
}
