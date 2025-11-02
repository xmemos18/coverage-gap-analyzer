/**
 * Skeleton loading state for results page
 * Shows content structure while recommendation loads
 */

import { SkeletonCard } from '../Skeleton';
import Skeleton from '../Skeleton';

export default function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <Skeleton variant="rectangular" height={48} className="mb-4 mx-auto w-3/4" />
          <Skeleton variant="text" className="mx-auto w-1/2" />
        </div>

        {/* Main Recommendation Card Skeleton */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <Skeleton variant="circular" width={64} height={64} />
            <div className="flex-1">
              <Skeleton variant="rectangular" height={32} className="mb-2 w-3/4" />
              <Skeleton variant="text" className="w-1/2" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <Skeleton variant="text" className="mb-2" />
              <Skeleton variant="rectangular" height={36} />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <Skeleton variant="text" className="mb-2" />
              <Skeleton variant="rectangular" height={36} />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <Skeleton variant="text" className="mb-2" />
              <Skeleton variant="rectangular" height={36} />
            </div>
          </div>

          <Skeleton variant="rectangular" height={100} className="mb-4" />
          <Skeleton variant="text" className="w-3/4" />
        </div>

        {/* Share Buttons Skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <Skeleton variant="rectangular" height={24} className="mb-4 w-1/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Skeleton variant="rectangular" height={48} />
            <Skeleton variant="rectangular" height={48} />
            <Skeleton variant="rectangular" height={48} />
            <Skeleton variant="rectangular" height={48} />
          </div>
        </div>

        {/* Reasoning Section Skeleton */}
        <SkeletonCard className="mb-8" />

        {/* Cost Breakdown Skeleton */}
        <SkeletonCard className="mb-8" />

        {/* Next Steps Skeleton */}
        <SkeletonCard className="mb-8" />

        {/* Alternative Options Skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <Skeleton variant="rectangular" height={28} className="mb-6 w-1/3" />
          <div className="grid md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
}
