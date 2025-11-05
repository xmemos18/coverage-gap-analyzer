'use client';

import { useState, memo } from 'react';
import { formatCost } from '@/lib/results-utils';
import { monthlyCostRangeToAnnual } from '@/lib/costUtils';
import InsuranceTerm from '@/components/InsuranceTerm';
import { CostRange } from '@/types';

interface CostAnalysisProps {
  monthlyCost: CostRange;
  budget?: string;
  currentCost?: number;
  subsidyAmount?: number;
  costAfterSubsidy?: CostRange;
}

const ANNUAL_INCREASE_RATE = 0.06;

function calculateCostWithInflation(
  monthlyCost: number,
  years: number,
  increaseRate: number = ANNUAL_INCREASE_RATE
): { total: number; yearlyBreakdown: Array<{ year: number; monthlyCost: number; annualCost: number }> } {
  let total = 0;
  const yearlyBreakdown = [];

  for (let year = 1; year <= years; year++) {
    const yearMonthlyCost = monthlyCost * Math.pow(1 + increaseRate, year - 1);
    const yearAnnualCost = yearMonthlyCost * 12;
    total += yearAnnualCost;

    yearlyBreakdown.push({
      year,
      monthlyCost: yearMonthlyCost,
      annualCost: yearAnnualCost,
    });
  }

  return { total, yearlyBreakdown };
}

function CostAnalysis({
  monthlyCost,
  budget,
  currentCost,
  subsidyAmount = 0,
  costAfterSubsidy,
}: CostAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'glance' | 'comparison' | 'savings'>('glance');
  const [yearsToProject, setYearsToProject] = useState(5);
  const [showInflation, setShowInflation] = useState(true);

  const annualCost = monthlyCostRangeToAnnual(monthlyCost);

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
  const avgRecommendedCost = (monthlyCost.low + monthlyCost.high) / 2;
  const avgCostAfterSubsidy = costAfterSubsidy
    ? (costAfterSubsidy.low + costAfterSubsidy.high) / 2
    : avgRecommendedCost;

  // Affordability check
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

  // Savings calculations
  const effectiveRecommendedLow = Math.max(0, monthlyCost.low - subsidyAmount);
  const effectiveRecommendedHigh = Math.max(0, monthlyCost.high - subsidyAmount);
  const effectiveRecommendedAvg = (effectiveRecommendedLow + effectiveRecommendedHigh) / 2;

  const monthlySavingsAvg = currentCost ? currentCost - effectiveRecommendedAvg : 0;
  const isSaving = monthlySavingsAvg > 0;

  // Projections
  const recommendedProjection = showInflation
    ? calculateCostWithInflation(effectiveRecommendedAvg, yearsToProject)
    : {
        total: effectiveRecommendedAvg * 12 * yearsToProject,
        yearlyBreakdown: Array.from({ length: yearsToProject }, (_, i) => ({
          year: i + 1,
          monthlyCost: effectiveRecommendedAvg,
          annualCost: effectiveRecommendedAvg * 12,
        })),
      };

  const currentProjection = currentCost && showInflation
    ? calculateCostWithInflation(currentCost, yearsToProject)
    : currentCost
    ? {
        total: currentCost * 12 * yearsToProject,
        yearlyBreakdown: Array.from({ length: yearsToProject }, (_, i) => ({
          year: i + 1,
          monthlyCost: currentCost,
          annualCost: currentCost * 12,
        })),
      }
    : null;

  const totalSavings = currentProjection ? currentProjection.total - recommendedProjection.total : 0;

  // Calculate bar widths for comparison charts
  const maxCost = Math.max(
    currentCost || 0,
    monthlyCost.high,
    budgetRange?.max || 0
  );
  const currentCostPercent = currentCost ? (currentCost / maxCost) * 100 : 0;
  const recommendedCostPercent = (avgRecommendedCost / maxCost) * 100;
  const budgetPercent = budgetRange ? (budgetRange.max / maxCost) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
      <div className="p-6 md:p-8">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span className="text-3xl">💰</span>
          Cost Analysis
        </h3>
        <p className="text-gray-600 mb-6">Complete breakdown of your insurance costs</p>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-2 md:gap-4 min-w-max md:min-w-0">
            <button
              onClick={() => setActiveTab('glance')}
              className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'glance'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 At a Glance
            </button>
            {currentCost && (
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'comparison'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                📈 Comparison
              </button>
            )}
            <button
              onClick={() => setActiveTab('savings')}
              className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'savings'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              💵 {currentCost ? 'Savings' : 'Projections'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* AT A GLANCE TAB */}
          {activeTab === 'glance' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Key Costs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border-2 border-blue-200">
                  <div className="text-sm font-semibold text-gray-600 mb-2">
                    Monthly <InsuranceTerm term="Premium">Cost</InsuranceTerm>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">
                    {formatCost(monthlyCost.low, monthlyCost.high)}
                  </div>
                  {subsidyAmount > 0 && (
                    <div className="text-sm text-gray-600 mt-2">
                      Before subsidy: {formatCost(monthlyCost.low + subsidyAmount, monthlyCost.high + subsidyAmount)}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg border-2 border-green-200">
                  <div className="text-sm font-semibold text-gray-600 mb-2">Annual Cost</div>
                  <div className="text-3xl md:text-4xl font-bold text-success">
                    {formatCost(annualCost.low, annualCost.high)}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Per year for your household
                  </div>
                </div>
              </div>

              {/* Affordability Check */}
              {budgetRange && (
                <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Affordability Check</h4>
                  <div className={`text-2xl font-bold mb-4 ${getAffordabilityColor()}`}>
                    {getAffordabilityLabel()}
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

              {/* Subsidy Impact */}
              {subsidyAmount > 0 && costAfterSubsidy && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Subsidy Impact</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-gray-700">Before Subsidy</span>
                        <span className="font-bold text-gray-900">
                          ${monthlyCost.low}-${monthlyCost.high}/month
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-8">
                        <div className="bg-gray-500 h-full rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-gray-700">After Subsidy</span>
                        <span className="font-bold text-green-600">
                          ${costAfterSubsidy.low}-${costAfterSubsidy.high}/month
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-8">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(avgCostAfterSubsidy / avgRecommendedCost) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-white rounded-lg p-4 border border-blue-300">
                    <p className="text-sm font-semibold text-blue-900">
                      🎉 Estimated subsidy: ${Math.round(subsidyAmount)}/month
                      (${Math.round(subsidyAmount * 12)}/year)
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 text-center">
                Costs are estimates and may vary based on your specific situation and chosen provider.
              </p>
            </div>
          )}

          {/* COMPARISON TAB */}
          {activeTab === 'comparison' && currentCost && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-6">
                {/* Current vs Recommended */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-700">Current Plan</span>
                    <span className="font-bold text-gray-900">${currentCost}/month</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-10 md:h-12 relative overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{ width: `${currentCostPercent}%` }}
                    >
                      <span className="text-white text-xs md:text-sm font-bold">Current</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-700">Recommended Plan</span>
                    <span className="font-bold text-accent">
                      ${monthlyCost.low}-${monthlyCost.high}/month
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-10 md:h-12 relative overflow-hidden">
                    <div
                      className="bg-accent h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{ width: `${recommendedCostPercent}%` }}
                    >
                      <span className="text-white text-xs md:text-sm font-bold">Recommended</span>
                    </div>
                  </div>
                </div>

                {budgetRange && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-gray-700">Your Budget</span>
                      <span className="font-bold text-green-600">${budgetRange.max}/month</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-10 md:h-12 relative overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${budgetPercent}%` }}
                      >
                        <span className="text-white text-xs md:text-sm font-bold">Budget</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Savings indicator */}
              {isSaving && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-sm font-semibold text-green-800">
                    💰 Potential savings: ${Math.round(monthlySavingsAvg)}/month
                    (${Math.round(monthlySavingsAvg * 12)}/year)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SAVINGS/PROJECTIONS TAB */}
          {activeTab === 'savings' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Monthly Savings Summary (if applicable) */}
              {currentCost && (
                <div className={`p-6 rounded-xl border-2 ${
                  isSaving
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      {isSaving ? 'Potential Monthly Savings' : 'Additional Monthly Cost'}
                    </div>
                    <div className={`text-3xl md:text-4xl font-bold ${
                      isSaving ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {isSaving ? '+' : '-'}${Math.abs(monthlySavingsAvg).toFixed(0)}
                      <span className="text-xl">/month</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Current: ${currentCost}/mo → Recommended: ${effectiveRecommendedAvg.toFixed(0)}/mo
                      {subsidyAmount > 0 && ' (after subsidies)'}
                    </div>
                  </div>
                </div>
              )}

              {/* Time Period Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentCost ? 'Calculate savings over:' : 'Project costs over how many years?'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 5, 10].map(years => (
                    <button
                      key={years}
                      onClick={() => setYearsToProject(years)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        yearsToProject === years
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {years} {years === 1 ? 'Year' : 'Years'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inflation Toggle */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInflation}
                    onChange={(e) => setShowInflation(e.target.checked)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Include annual premium increases ({(ANNUAL_INCREASE_RATE * 100).toFixed(0)}% per year)
                  </span>
                </label>
              </div>

              {/* Comparison Grid */}
              {currentCost ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-6 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase mb-1">Current Plan</div>
                    <div className="text-2xl font-bold text-gray-900 mb-3">
                      ${Math.round(currentProjection?.total || 0).toLocaleString()}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Starting Monthly: ${currentCost}</div>
                      <div>First Year: ${(currentCost * 12).toLocaleString()}</div>
                      <div>{yearsToProject} Years: ${Math.round(currentProjection?.total || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                    <div className="text-xs text-blue-600 uppercase mb-1">Recommended Plan</div>
                    <div className="text-2xl font-bold text-primary mb-3">
                      ${Math.round(recommendedProjection.total).toLocaleString()}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Starting Monthly: ${effectiveRecommendedAvg.toFixed(0)}</div>
                      <div>First Year: ${(effectiveRecommendedAvg * 12).toLocaleString()}</div>
                      <div>{yearsToProject} Years: ${Math.round(recommendedProjection.total).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                    <div className="text-sm text-gray-600 mb-1">Total Cost Over {yearsToProject} {yearsToProject === 1 ? 'Year' : 'Years'}</div>
                    <div className="text-3xl font-bold text-primary">
                      ${Math.round(recommendedProjection.total).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Starting at ${effectiveRecommendedAvg.toFixed(0)}/month
                      {subsidyAmount > 0 && ' (after subsidies)'}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">First Year Cost</div>
                    <div className="text-3xl font-bold text-gray-900">
                      ${Math.round(effectiveRecommendedAvg * 12).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Range: ${Math.round(effectiveRecommendedLow * 12).toLocaleString()} - ${Math.round(effectiveRecommendedHigh * 12).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Total Savings Callout */}
              {currentCost && isSaving && (
                <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-lg border-2 border-green-300">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Savings Over {yearsToProject} Years</div>
                      <div className="text-3xl font-bold text-green-700">
                        ${Math.round(totalSavings).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-5xl">🎉</div>
                  </div>
                  {totalSavings >= 5000 && (
                    <div className="mt-4 text-sm text-gray-700">
                      <strong>What you could do with ${Math.round(totalSavings).toLocaleString()}:</strong>
                      <ul className="mt-2 space-y-1 ml-4">
                        {totalSavings >= 5000 && <li>• Take a nice vacation</li>}
                        {totalSavings >= 10000 && <li>• Build an emergency fund</li>}
                        {totalSavings >= 20000 && <li>• Max out retirement contributions</li>}
                        {totalSavings >= 50000 && <li>• Make a down payment on a home</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Year-by-Year Breakdown */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {currentCost ? 'Year-by-Year Savings Breakdown' : 'Cost Breakdown by Year'}
                </h4>
                <div className="space-y-2">
                  {recommendedProjection.yearlyBreakdown.slice(0, 5).map(({ year, annualCost: recommendedAnnual }) => {
                    const currentAnnual = currentProjection?.yearlyBreakdown[year - 1]?.annualCost || 0;
                    const yearSavings = currentAnnual - recommendedAnnual;

                    return (
                      <div key={year} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-700">Year {year}:</span>
                        <div className="text-right">
                          {currentCost ? (
                            <>
                              <div className="font-semibold text-gray-900">
                                {yearSavings >= 0 ? '+' : '-'}${Math.abs(Math.round(yearSavings)).toLocaleString()}
                              </div>
                              {showInflation && year > 1 && (
                                <div className="text-xs text-gray-400">
                                  Current: ${Math.round(currentAnnual).toLocaleString()} | Recommended: ${Math.round(recommendedAnnual).toLocaleString()}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="font-semibold text-gray-900">
                              ${Math.round(recommendedAnnual).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700">
                <strong>💡 Note:</strong> {showInflation
                  ? `These calculations include estimated ${(ANNUAL_INCREASE_RATE * 100).toFixed(0)}% annual premium increases based on historical trends. Actual increases may vary.`
                  : 'These calculations assume consistent premium costs. Actual costs may vary based on plan changes and market conditions.'
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(CostAnalysis);
