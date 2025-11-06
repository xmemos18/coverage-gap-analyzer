import { formatCost } from '@/lib/results-utils';
import { CostRange } from '@/types';

interface CostComparison {
  current: number;
  recommended: CostRange;
  monthlySavings?: number;
  annualSavings?: number;
}

interface CurrentInsuranceComparisonProps {
  currentInsuranceSummary: string;
  costComparison: CostComparison;
  improvementAreas?: string[];
}

export default function CurrentInsuranceComparison({
  currentInsuranceSummary,
  costComparison,
  improvementAreas,
}: CurrentInsuranceComparisonProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-blue-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-3xl">📊</span>
        Your Current Insurance vs Our Recommendation
      </h3>

      {/* Current Insurance Details */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Current Insurance</h4>
        <p className="text-gray-700">{currentInsuranceSummary}</p>
      </div>

      {/* Cost Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border-2 border-gray-300">
          <div className="text-sm font-semibold text-gray-600 mb-2">Current Monthly Cost</div>
          <div className="text-3xl font-bold text-gray-700">
            ${costComparison.current.toLocaleString()}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border-2 border-blue-600">
          <div className="text-sm font-semibold text-gray-600 mb-2">Recommended Monthly Cost</div>
          <div className="text-3xl font-bold text-blue-600">
            {formatCost(costComparison.recommended.low, costComparison.recommended.high)}
          </div>
        </div>
        {costComparison.monthlySavings && costComparison.monthlySavings > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg border-2 border-green-600">
            <div className="text-sm font-semibold text-gray-600 mb-2">Potential Savings</div>
            <div className="text-3xl font-bold text-green-600">
              ${Math.round(costComparison.monthlySavings).toLocaleString()}/mo
            </div>
            <div className="text-sm text-gray-600 mt-1">
              ${Math.round(costComparison.annualSavings || 0).toLocaleString()}/year
            </div>
          </div>
        )}
      </div>

      {/* Improvement Areas */}
      {improvementAreas && improvementAreas.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-warning">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Areas for Improvement</h4>
          <div className="flex flex-wrap gap-2">
            {improvementAreas.map((area, index) => (
              <span
                key={index}
                className="bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-700 border border-gray-300"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
