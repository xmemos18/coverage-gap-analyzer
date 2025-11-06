'use client';

import { useState } from 'react';
import { formatCost } from '@/lib/results-utils';
import CoverageScoreMeter from './CoverageScoreMeter';
import InsuranceText from '@/components/InsuranceText';
import { CostRange } from '@/types';

interface CollapsibleHeroSummaryProps {
  coverageGapScore: number;
  recommendedInsurance: string;
  householdBreakdown: string;
  estimatedMonthlyCost: CostRange;
  reasoning: string;
}

export default function CollapsibleHeroSummary({
  coverageGapScore,
  recommendedInsurance,
  householdBreakdown,
  estimatedMonthlyCost,
  reasoning,
}: CollapsibleHeroSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="card-highlight mb-8 md:mb-12 fade-in">
      {/* Collapsed State */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-6 md:p-8 text-left hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
              {/* Mini Score Badge */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl icon-blue flex items-center justify-center">
                  <div className="text-blue-600 text-xl md:text-2xl font-bold">
                    {coverageGapScore}
                  </div>
                </div>
              </div>

              {/* Summary Info */}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 badge-blue mb-2">
                  <span>✨</span>
                  <span>YOUR RECOMMENDATION</span>
                </div>
                <h2 className="heading-2 truncate mb-1">
                  {recommendedInsurance}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-2xl md:text-4xl font-bold text-blue-600">
                    {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}/mo
                  </span>
                </div>
              </div>
            </div>

            {/* Expand button */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="p-6 md:p-10 lg:p-12">
          {/* Collapse Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
              aria-label="Collapse summary"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center">
            {/* Coverage Score */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <CoverageScoreMeter score={coverageGapScore} />
            </div>

            {/* Main Recommendation */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 badge-blue mb-4">
                <span>🎯</span>
                <span>RECOMMENDED FOR YOU</span>
              </div>

              <h2 className="heading-1 mb-4">
                <InsuranceText text={recommendedInsurance} position="bottom" />
              </h2>

              <p className="body-text mb-6">
                <InsuranceText text={householdBreakdown} position="bottom" />
              </p>

              {/* Cost Display */}
              <div className="inline-flex items-baseline gap-3 bg-blue-50 border border-blue-200 px-6 py-4 rounded-lg mb-2">
                <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-600">
                  {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}
                </div>
                <div className="text-xl md:text-2xl text-gray-700 font-semibold">
                  /month
                </div>
              </div>

              {/* Inline Disclaimer */}
              <p className="text-xs text-gray-500 mt-2 italic">
                * Estimated range. Actual costs may vary based on specific plan selection and carrier.
              </p>
            </div>
          </div>

          {/* Why This Recommendation */}
          <div className="mt-8 lg:mt-10 pt-8 border-t border-gray-200">
            <div className="card-accent-left">
              <h3 className="heading-3 mb-4 flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <span>Why This Recommendation?</span>
              </h3>
              <p className="body-text">
                {reasoning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
