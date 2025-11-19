import { formatCost } from '@/lib/results-utils';
import CoverageScoreMeter from './CoverageScoreMeter';
import InsuranceText from '@/components/InsuranceText';
import { CostRange } from '@/types';

interface RecommendationSummaryProps {
  coverageGapScore: number;
  recommendedInsurance: string;
  planType?: string;
  householdBreakdown: string;
  estimatedMonthlyCost: CostRange;
}

export default function RecommendationSummary({
  coverageGapScore,
  recommendedInsurance,
  planType,
  householdBreakdown,
  estimatedMonthlyCost,
}: RecommendationSummaryProps) {
  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 md:p-10 mb-8 border-2 border-blue-600">
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-6">
        <CoverageScoreMeter score={coverageGapScore} />

        {/* Main Recommendation */}
        <div className="flex-1">
          <div className="inline-block bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
            RECOMMENDED FOR YOU
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            <InsuranceText text={recommendedInsurance} position="bottom" />
          </h2>
          {planType && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Plan Type: {planType}
              </span>
            </div>
          )}
          <p className="text-lg text-gray-700 mb-4">
            <InsuranceText text={householdBreakdown} position="bottom" />
          </p>
          <div className="flex items-baseline gap-3">
            <div className="text-5xl font-bold text-blue-600">
              {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}
            </div>
            <div className="text-xl text-gray-600 font-semibold">
              /month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
