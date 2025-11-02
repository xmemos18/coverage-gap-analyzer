import { formatCost } from '@/lib/results-utils';
import CoverageScoreMeter from './CoverageScoreMeter';
import InsuranceText from '@/components/InsuranceText';
import { CostRange } from '@/types';

interface RecommendationSummaryProps {
  coverageGapScore: number;
  recommendedInsurance: string;
  householdBreakdown: string;
  estimatedMonthlyCost: CostRange;
}

export default function RecommendationSummary({
  coverageGapScore,
  recommendedInsurance,
  householdBreakdown,
  estimatedMonthlyCost,
}: RecommendationSummaryProps) {
  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 md:p-10 mb-8 border-2 border-accent">
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-6">
        <CoverageScoreMeter score={coverageGapScore} />

        {/* Main Recommendation */}
        <div className="flex-1">
          <div className="inline-block bg-accent text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
            RECOMMENDED FOR YOU
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            <InsuranceText text={recommendedInsurance} position="bottom" />
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            <InsuranceText text={householdBreakdown} position="bottom" />
          </p>
          <div className="flex items-baseline gap-3">
            <div className="text-5xl font-bold text-accent">
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
