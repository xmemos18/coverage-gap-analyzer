'use client';

import { useState } from 'react';
import { formatCost } from '@/lib/results-utils';
import CoverageScoreMeter from './CoverageScoreMeter';
import InsuranceText from '@/components/InsuranceText';
import { CostRange } from '@/types';

interface EnhancedHeroSummaryProps {
  coverageGapScore: number;
  recommendedInsurance: string;
  householdBreakdown: string;
  estimatedMonthlyCost: CostRange;
  reasoning: string;
}

export default function EnhancedHeroSummary({
  coverageGapScore,
  recommendedInsurance,
  householdBreakdown,
  estimatedMonthlyCost,
  reasoning,
}: EnhancedHeroSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Score color logic
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Needs Attention';
  };

  return (
    <div className="relative mb-6 md:mb-8 print:mb-8">
      {/* Collapsed State - Mobile Optimized */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 border-2 border-blue-200 rounded-2xl md:rounded-3xl p-4 md:p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left group"
          aria-label="Expand recommendation summary"
        >
          <div className="flex items-center gap-4">
            {/* Score Badge - Compact */}
            <div className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 ${getScoreColor(coverageGapScore)} flex flex-col items-center justify-center font-bold shadow-sm`}>
              <div className="text-2xl md:text-3xl">{coverageGapScore}</div>
              <div className="text-[10px] md:text-xs uppercase font-semibold opacity-75">Score</div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  ✨ RECOMMENDED
                </span>
              </div>

              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                {recommendedInsurance}
              </h2>

              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold text-blue-600">
                  {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}
                </span>
                <span className="text-sm md:text-base text-gray-600 font-medium">/month</span>
              </div>
            </div>

            {/* Expand Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Expanded State - Responsive Layout */}
      {isExpanded && (
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-2 border-blue-200 rounded-2xl md:rounded-3xl shadow-lg print:shadow-none print:border print:border-gray-300">
          {/* Header Section */}
          <div className="p-6 md:p-8 lg:p-10">
            {/* Collapse Button */}
            <div className="flex justify-end mb-4 print:hidden">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
                aria-label="Collapse recommendation summary"
              >
                <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>

            {/* Main Content - Stacked on Mobile, Side-by-side on Desktop */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
              {/* Left: Score Meter */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <CoverageScoreMeter score={coverageGapScore} />
                <div className={`mt-4 text-center px-4 py-2 rounded-lg border-2 ${getScoreColor(coverageGapScore)} font-semibold text-sm`}>
                  {getScoreLabel(coverageGapScore)}
                </div>
              </div>

              {/* Right: Recommendation Details */}
              <div className="flex-1 text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white font-bold text-sm mb-4 shadow-sm">
                  <span>🎯</span>
                  <span>YOUR BEST MATCH</span>
                </div>

                {/* Insurance Type */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                  <InsuranceText text={recommendedInsurance} position="bottom" />
                </h2>

                {/* Household Breakdown */}
                <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed">
                  <InsuranceText text={householdBreakdown} position="bottom" />
                </p>

                {/* Cost Display - Prominent */}
                <div className="inline-flex flex-col md:flex-row items-center md:items-baseline gap-2 md:gap-3 bg-white border-2 border-blue-300 px-6 py-4 rounded-xl shadow-md mb-2">
                  <div className="text-4xl md:text-5xl font-bold text-blue-600">
                    {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}
                  </div>
                  <div className="text-lg md:text-xl text-gray-700 font-semibold">
                    /month
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-gray-500 italic mt-2">
                  * Estimated range. Actual costs vary by carrier and plan details.
                </p>
              </div>
            </div>
          </div>

          {/* Reasoning Section - Full Width */}
          <div className="border-t-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 md:p-8 rounded-b-2xl md:rounded-b-3xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                  Why This Recommendation?
                </h3>
                <p className="text-base md:text-lg text-gray-800 leading-relaxed">
                  {reasoning}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
