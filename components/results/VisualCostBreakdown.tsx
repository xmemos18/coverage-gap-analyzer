import { CostRange } from '@/types';

interface VisualCostBreakdownProps {
  recommendedCost: CostRange;
  budget?: string;
  currentCost?: number;
  subsidyAmount?: number;
  costAfterSubsidy?: CostRange;
}

export default function VisualCostBreakdown({
  recommendedCost,
  budget,
  currentCost,
  subsidyAmount = 0,
  costAfterSubsidy,
}: VisualCostBreakdownProps) {
  // Parse budget range
  const getBudgetRange = (budgetStr?: string): { min: number; max: number } | null => {
    if (!budgetStr) return null;

    if (budgetStr === 'under-500') return { min: 0, max: 500 };
    if (budgetStr === '500-1000') return { min: 500, max: 1000 };
    if (budgetStr === '1000-2000') return { min: 1000, max: 2000 };
    if (budgetStr === '2000-3000') return { min: 2000, max: 3000 };
    if (budgetStr === 'over-3000') return { min: 3000, max: 5000 };

    return null;
  };

  const budgetRange = getBudgetRange(budget);
  const avgRecommendedCost = (recommendedCost.low + recommendedCost.high) / 2;
  const avgCostAfterSubsidy = costAfterSubsidy
    ? (costAfterSubsidy.low + costAfterSubsidy.high) / 2
    : avgRecommendedCost;

  // Determine affordability color
  const getAffordabilityColor = (): string => {
    if (!budgetRange) return 'text-gray-600';

    const costToCheck = subsidyAmount > 0 ? avgCostAfterSubsidy : avgRecommendedCost;

    if (costToCheck <= budgetRange.max) return 'text-green-600';
    if (costToCheck <= budgetRange.max * 1.2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAffordabilityLabel = (): string => {
    if (!budgetRange) return 'Budget not specified';

    const costToCheck = subsidyAmount > 0 ? avgCostAfterSubsidy : avgRecommendedCost;

    if (costToCheck <= budgetRange.max) return '✓ Within your budget';
    if (costToCheck <= budgetRange.max * 1.2) return '⚠ Slightly over budget';
    return '✗ Over budget';
  };

  const affordabilityColor = getAffordabilityColor();
  const affordabilityLabel = getAffordabilityLabel();

  // Calculate bar widths for comparison (max 100%)
  const maxCost = Math.max(
    currentCost || 0,
    recommendedCost.high,
    budgetRange?.max || 0
  );

  const currentCostPercent = currentCost ? (currentCost / maxCost) * 100 : 0;
  const recommendedCostPercent = (avgRecommendedCost / maxCost) * 100;
  const budgetPercent = budgetRange ? (budgetRange.max / maxCost) * 100 : 0;

  // Calculate insurance vs your cost split (rough estimate: 70/30 split after deductible)
  const insurancePayPercent = 70;
  const yourPayPercent = 30;

  return (
    <div className="space-y-8">
      {/* Affordability Indicator */}
      {budgetRange && (
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Affordability Check</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className={`text-2xl font-bold ${affordabilityColor}`}>
              {affordabilityLabel}
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Your budget:</span>
              <span className="font-semibold">${budgetRange.min}-${budgetRange.max}/month</span>
            </div>
            <div className="flex justify-between">
              <span>Recommended plan:</span>
              <span className="font-semibold">
                ${Math.round(subsidyAmount > 0 ? avgCostAfterSubsidy : avgRecommendedCost)}/month avg
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cost Comparison Bars */}
      <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Cost Comparison</h3>

        <div className="space-y-6">
          {/* Current vs Recommended */}
          {currentCost && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">Current Plan</span>
                <span className="font-bold text-gray-900">${currentCost}/month</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                  style={{ width: `${currentCostPercent}%` }}
                >
                  <span className="text-white text-xs font-bold">Current</span>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Plan */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-gray-700">Recommended Plan</span>
              <span className="font-bold text-blue-600">
                ${recommendedCost.low}-${recommendedCost.high}/month
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                style={{ width: `${recommendedCostPercent}%` }}
              >
                <span className="text-white text-xs font-bold">Recommended</span>
              </div>
            </div>
          </div>

          {/* Budget Line */}
          {budgetRange && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">Your Budget</span>
                <span className="font-bold text-green-600">${budgetRange.max}/month</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                  style={{ width: `${budgetPercent}%` }}
                >
                  <span className="text-white text-xs font-bold">Budget</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Savings indicator */}
        {currentCost && currentCost > avgRecommendedCost && (
          <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm font-semibold text-green-800">
              💰 Potential savings: ${Math.round(currentCost - avgRecommendedCost)}/month
              (${Math.round((currentCost - avgRecommendedCost) * 12)}/year)
            </p>
          </div>
        )}
      </div>

      {/* Before/After Subsidy */}
      {subsidyAmount > 0 && costAfterSubsidy && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Subsidy Impact</h3>

          <div className="space-y-6">
            {/* Before Subsidy */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">Before Subsidy</span>
                <span className="font-bold text-gray-900">
                  ${recommendedCost.low}-${recommendedCost.high}/month
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-gray-500 h-full rounded-full flex items-center justify-end pr-3"
                  style={{ width: '100%' }}
                >
                  <span className="text-white text-xs font-bold">Full Price</span>
                </div>
              </div>
            </div>

            {/* After Subsidy */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">After Subsidy</span>
                <span className="font-bold text-green-600">
                  ${costAfterSubsidy.low}-${costAfterSubsidy.high}/month
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                  style={{ width: `${(avgCostAfterSubsidy / avgRecommendedCost) * 100}%` }}
                >
                  <span className="text-white text-xs font-bold">Your Cost</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subsidy Amount */}
          <div className="mt-6 bg-white rounded-lg p-4 border border-blue-300">
            <p className="text-sm font-semibold text-blue-900">
              🎉 Estimated subsidy: ${Math.round(subsidyAmount)}/month
              (${Math.round(subsidyAmount * 12)}/year)
            </p>
          </div>
        </div>
      )}

      {/* Monthly vs Annual */}
      <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly vs Annual Cost</h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly */}
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-600 mb-2">Monthly</div>
            <div className="text-3xl font-bold text-blue-600">
              ${Math.round(subsidyAmount > 0 ? avgCostAfterSubsidy : avgRecommendedCost)}
            </div>
            <div className="text-xs text-gray-500 mt-1">per month</div>
          </div>

          {/* Annual */}
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-600 mb-2">Annual</div>
            <div className="text-3xl font-bold text-gray-900">
              ${Math.round((subsidyAmount > 0 ? avgCostAfterSubsidy : avgRecommendedCost) * 12).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">per year</div>
          </div>
        </div>
      </div>

      {/* Cost Split Visualization (Pie Chart) */}
      <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Cost Split After Deductible</h3>

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Pie Chart */}
          <div className="flex-shrink-0">
            <div
              className="w-40 h-40 rounded-full shadow-lg"
              style={{
                background: `conic-gradient(
                  #3b82f6 0% ${insurancePayPercent}%,
                  #10b981 ${insurancePayPercent}% 100%
                )`,
              }}
              aria-label={`Pie chart showing ${insurancePayPercent}% paid by insurance and ${yourPayPercent}% paid by you`}
            />
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded flex-shrink-0" />
              <div>
                <div className="font-semibold text-gray-900">Insurance Pays</div>
                <div className="text-sm text-gray-600">~{insurancePayPercent}% (after deductible)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded flex-shrink-0" />
              <div>
                <div className="font-semibold text-gray-900">You Pay</div>
                <div className="text-sm text-gray-600">~{yourPayPercent}% (copays, coinsurance)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 italic">
          * Typical split after meeting your deductible. Actual costs vary by service and plan.
        </div>
      </div>
    </div>
  );
}
