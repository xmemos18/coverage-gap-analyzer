'use client';

import { CostRange } from '@/types';

interface HeroCardProps {
  score: number;
  planType: string;
  planCategory?: string; // PPO, HMO, EPO, HDHP, etc.
  priceRange: CostRange | 'free' | 'varies';
  eligibilityDescription: string;
  householdSize?: number;
}

export default function HeroCard({
  score,
  planType,
  planCategory,
  priceRange,
  eligibilityDescription,
}: HeroCardProps) {
  // Score color logic
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-gradient-to-br from-green-400 to-green-600';
    if (score >= 70) return 'bg-gradient-to-br from-blue-400 to-blue-600';
    return 'bg-gradient-to-br from-amber-400 to-amber-600';
  };

  // Format price display
  const formatPrice = (price: CostRange | 'free' | 'varies') => {
    if (price === 'free') return '$0/month';
    if (price === 'varies') return 'Varies by employer';
    return `$${price.low}-$${price.high}/month`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:gap-8">
        {/* Score Badge */}
        <div className="flex flex-col items-center mb-6 md:mb-0 md:flex-shrink-0">
          {/* Score Circle */}
          <div className="relative">
            <div
              className={`
                w-20 h-20 md:w-[120px] md:h-[120px]
                rounded-full
                flex items-center justify-center
                ${getScoreColor(score)}
                shadow-xl
                relative
              `}
            >
              {/* Score Number */}
              <span className="text-4xl md:text-5xl font-bold text-white">
                {score}
              </span>

              {/* Check Icon (top-right) */}
              <svg
                className="absolute -top-1 -right-1 w-6 h-6 md:w-8 md:h-8 text-white bg-green-500 rounded-full p-1 shadow-md"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Score Label */}
          <p className="text-sm md:text-base font-semibold text-gray-600 mt-3 text-center">
            Coverage Score
          </p>
        </div>

        {/* Hero Content */}
        <div className="flex-1 text-center md:text-left">
          {/* Recommended Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold uppercase rounded-full mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Recommended For You
          </span>

          {/* Plan Name */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
            {planType}
          </h1>

          {/* Plan Category/Type */}
          {planCategory && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {planCategory}
              </span>
            </div>
          )}

          {/* Price */}
          <p className="text-3xl md:text-4xl font-bold text-blue-600 mb-3">
            {formatPrice(priceRange)}
          </p>

          {/* Eligibility Description */}
          <p className="text-sm md:text-base text-gray-600">
            {eligibilityDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
