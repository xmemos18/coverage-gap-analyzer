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
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl mb-8 border-2 border-accent overflow-hidden">
      {/* Collapsed State */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-6 text-left hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Mini Score Badge */}
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                <div className="text-white text-xl font-bold">{coverageGapScore}</div>
              </div>

              {/* Summary Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-accent font-bold mb-1">YOUR RECOMMENDATION</div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                  {recommendedInsurance}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-2xl md:text-3xl font-bold text-accent">
                    {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}/mo
                  </span>
                </div>
              </div>
            </div>

            {/* Expand button */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="p-6 md:p-10">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-10 h-10 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors"
              aria-label="Collapse summary"
            >
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
            {/* Coverage Score */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <CoverageScoreMeter score={coverageGapScore} />
            </div>

            {/* Main Recommendation */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-block bg-accent text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
                RECOMMENDED FOR YOU
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                <InsuranceText text={recommendedInsurance} position="bottom" />
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                <InsuranceText text={householdBreakdown} position="bottom" />
              </p>
              <div className="flex items-baseline gap-3 justify-center md:justify-start">
                <div className="text-4xl md:text-5xl font-bold text-accent">
                  {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}
                </div>
                <div className="text-xl text-gray-600 font-semibold">
                  /month
                </div>
              </div>
            </div>
          </div>

          {/* Why This Recommendation */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>💡</span>
              Why This Recommendation?
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
