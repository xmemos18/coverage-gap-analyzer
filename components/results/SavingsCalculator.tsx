'use client';

import { useState } from 'react';
import { CostRange } from '@/types';

interface SavingsCalculatorProps {
  recommendedCost: CostRange;
  currentCost?: number;
  subsidyAmount?: number;
}

// Historical data shows health insurance premiums increase 5-8% annually
// Using 6% as a conservative average based on KFF data
const ANNUAL_INCREASE_RATE = 0.06;

/**
 * Calculate total cost over multiple years with annual increases
 * @param monthlyCost - Starting monthly cost
 * @param years - Number of years to project
 * @param increaseRate - Annual increase rate (default 6%)
 * @returns Object with total cost and year-by-year breakdown
 */
function calculateCostWithInflation(
  monthlyCost: number,
  years: number,
  increaseRate: number = ANNUAL_INCREASE_RATE
): { total: number; yearlyBreakdown: Array<{ year: number; monthlyCost: number; annualCost: number }> } {
  let total = 0;
  const yearlyBreakdown = [];

  for (let year = 1; year <= years; year++) {
    // Cost increases each year by the increase rate
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

export default function SavingsCalculator({
  recommendedCost,
  currentCost,
  subsidyAmount = 0
}: SavingsCalculatorProps) {
  const [yearsToProject, setYearsToProject] = useState(5);
  const [showInflation, setShowInflation] = useState(true);

  // Calculate effective recommended cost after subsidies
  const effectiveRecommendedLow = Math.max(0, recommendedCost.low - subsidyAmount);
  const effectiveRecommendedHigh = Math.max(0, recommendedCost.high - subsidyAmount);
  const effectiveRecommendedAvg = (effectiveRecommendedLow + effectiveRecommendedHigh) / 2;

  // Calculate projections with inflation
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

  // If no current cost provided, just show projections
  if (!currentCost || currentCost === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 print:shadow-none print:border-2">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-3xl">💵</span>
          Long-Term Cost Projection
        </h3>

        <div className="space-y-6">
          {/* Time Period Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project costs over how many years?
            </label>
            <div className="flex gap-2">
              {[1, 3, 5, 10].map(years => (
                <button
                  key={years}
                  onClick={() => setYearsToProject(years)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    yearsToProject === years
                      ? 'bg-blue-600 text-white'
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
                className="w-4 h-4 text-blue-600 focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">
                Include annual premium increases ({(ANNUAL_INCREASE_RATE * 100).toFixed(0)}% per year)
              </span>
            </label>
          </div>

          {/* Projection Results */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Total Cost Over {yearsToProject} {yearsToProject === 1 ? 'Year' : 'Years'}</div>
              <div className="text-3xl font-bold text-blue-600">
                ${Math.round(recommendedProjection.total).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Starting at ${effectiveRecommendedAvg.toFixed(0)}/month
                {subsidyAmount > 0 && ' (after subsidies)'}
                {showInflation && yearsToProject > 1 && (
                  <div className="mt-1">With {(ANNUAL_INCREASE_RATE * 100).toFixed(0)}% annual increases</div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <div className="text-sm text-gray-600 mb-1">First Year Cost</div>
              <div className="text-3xl font-bold text-gray-900">
                ${(effectiveRecommendedAvg * 12).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Range: ${(effectiveRecommendedLow * 12).toLocaleString()} - ${(effectiveRecommendedHigh * 12).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Cost Breakdown Over Time */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">Cost Breakdown by Year</h4>
            <div className="space-y-2">
              {recommendedProjection.yearlyBreakdown.slice(0, 5).map(({ year, annualCost, monthlyCost }) => (
                <div key={year} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Year {year}:</span>
                  <span className="font-semibold text-gray-900">
                    ${Math.round(annualCost).toLocaleString()}
                    {showInflation && year > 1 && (
                      <span className="text-xs text-gray-500 ml-2">(${Math.round(monthlyCost)}/mo)</span>
                    )}
                  </span>
                </div>
              ))}
              {yearsToProject > 5 && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-300">
                  <span className="text-gray-700">Years 6-{yearsToProject}:</span>
                  <span className="font-semibold text-gray-900">
                    ${Math.round(
                      recommendedProjection.yearlyBreakdown
                        .slice(5)
                        .reduce((sum, { annualCost }) => sum + annualCost, 0)
                    ).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate savings
  const monthlySavingsLow = currentCost - effectiveRecommendedHigh;
  const monthlySavingsHigh = currentCost - effectiveRecommendedLow;
  const monthlySavingsAvg = (monthlySavingsLow + monthlySavingsHigh) / 2;
  const isSaving = monthlySavingsAvg > 0;
  const isCosting = monthlySavingsAvg < 0;

  // Long-term projections with inflation
  const currentProjection = showInflation
    ? calculateCostWithInflation(currentCost, yearsToProject)
    : {
        total: currentCost * 12 * yearsToProject,
        yearlyBreakdown: Array.from({ length: yearsToProject }, (_, i) => ({
          year: i + 1,
          monthlyCost: currentCost,
          annualCost: currentCost * 12,
        })),
      };

  const currentTotalCost = currentProjection.total;
  const recommendedTotalCost = recommendedProjection.total;
  const totalSavings = currentTotalCost - recommendedTotalCost;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 print:shadow-none print:border-2">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-3xl">💰</span>
        Savings Calculator
      </h3>

      {/* Monthly Savings Summary */}
      <div className={`p-6 rounded-xl mb-6 border-2 ${
        isSaving
          ? 'bg-green-50 border-green-300'
          : isCosting
          ? 'bg-red-50 border-red-300'
          : 'bg-gray-50 border-gray-300'
      }`}>
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            {isSaving ? 'Potential Monthly Savings' : isCosting ? 'Additional Monthly Cost' : 'Similar Cost'}
          </div>
          <div className={`text-4xl font-bold ${
            isSaving ? 'text-green-700' : isCosting ? 'text-red-700' : 'text-gray-700'
          }`}>
            {isSaving ? '+' : ''}{isCosting ? '-' : ''}${Math.abs(monthlySavingsAvg).toFixed(0)}
            <span className="text-xl">/month</span>
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Current: ${currentCost}/mo → Recommended: ${effectiveRecommendedAvg.toFixed(0)}/mo
            {subsidyAmount > 0 && ' (after subsidies)'}
          </div>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Calculate savings over:
        </label>
        <div className="flex gap-2">
          {[1, 3, 5, 10].map(years => (
            <button
              key={years}
              onClick={() => setYearsToProject(years)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                yearsToProject === years
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {years} {years === 1 ? 'Year' : 'Years'}
            </button>
          ))}
        </div>
      </div>

      {/* Inflation Toggle */}
      <div className="mb-6 flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInflation}
            onChange={(e) => setShowInflation(e.target.checked)}
            className="w-4 h-4 text-blue-600 focus:ring-primary"
          />
          <span className="text-sm font-medium text-gray-700">
            Include annual premium increases ({(ANNUAL_INCREASE_RATE * 100).toFixed(0)}% per year)
          </span>
        </label>
      </div>

      {/* Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Current Plan */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <div className="text-xs text-gray-500 uppercase mb-1">Current Plan</div>
          <div className="text-2xl font-bold text-gray-900 mb-3">
            ${Math.round(currentTotalCost).toLocaleString()}
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Starting Monthly: ${currentCost}</div>
            <div>First Year: ${(currentCost * 12).toLocaleString()}</div>
            <div>{yearsToProject} Years: ${Math.round(currentTotalCost).toLocaleString()}</div>
            {showInflation && yearsToProject > 1 && (
              <div className="text-xs text-gray-500 mt-2">
                With {(ANNUAL_INCREASE_RATE * 100).toFixed(0)}% annual increases
              </div>
            )}
          </div>
        </div>

        {/* Recommended Plan */}
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="text-xs text-blue-600 uppercase mb-1">Recommended Plan</div>
          <div className="text-2xl font-bold text-blue-600 mb-3">
            ${Math.round(recommendedTotalCost).toLocaleString()}
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Starting Monthly: ${effectiveRecommendedAvg.toFixed(0)}</div>
            <div>First Year: ${(effectiveRecommendedAvg * 12).toLocaleString()}</div>
            <div>{yearsToProject} Years: ${Math.round(recommendedTotalCost).toLocaleString()}</div>
            {showInflation && yearsToProject > 1 && (
              <div className="text-xs text-gray-500 mt-2">
                With {(ANNUAL_INCREASE_RATE * 100).toFixed(0)}% annual increases
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Total Savings Callout */}
      {isSaving && (
        <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-lg border-2 border-green-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Savings Over {yearsToProject} Years</div>
              <div className="text-3xl font-bold text-green-700">
                ${Math.round(totalSavings).toLocaleString()}
              </div>
              {showInflation && yearsToProject > 1 && (
                <div className="text-xs text-gray-500 mt-1">
                  Including {(ANNUAL_INCREASE_RATE * 100).toFixed(0)}% annual increases
                </div>
              )}
            </div>
            <div className="text-5xl">🎉</div>
          </div>
          <div className="mt-4 text-sm text-gray-700">
            <strong>What you could do with ${Math.round(totalSavings).toLocaleString()}:</strong>
            <ul className="mt-2 space-y-1 ml-4">
              {totalSavings >= 5000 && <li>• Take a nice vacation</li>}
              {totalSavings >= 10000 && <li>• Build an emergency fund</li>}
              {totalSavings >= 20000 && <li>• Max out retirement contributions</li>}
              {totalSavings >= 50000 && <li>• Make a down payment on a home</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Year-by-Year Breakdown */}
      <div className="mt-6 bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Year-by-Year Savings Breakdown</h4>
        <div className="space-y-2">
          {currentProjection.yearlyBreakdown.slice(0, 5).map(({ year, annualCost: currentAnnual }) => {
            const recommendedAnnual = recommendedProjection.yearlyBreakdown[year - 1]?.annualCost ?? 0;
            const yearSavings = currentAnnual - recommendedAnnual;
            const cumulativeSavings = currentProjection.yearlyBreakdown
              .slice(0, year)
              .reduce((sum, c, idx) => {
                const rec = recommendedProjection.yearlyBreakdown[idx]?.annualCost ?? 0;
                return sum + (c.annualCost - rec);
              }, 0);

            return (
              <div key={year} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                <span className="text-gray-700">Year {year}:</span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {yearSavings >= 0 ? '+' : '-'}${Math.abs(Math.round(yearSavings)).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Cumulative: {cumulativeSavings >= 0 ? '+' : '-'}${Math.abs(Math.round(cumulativeSavings)).toLocaleString()}
                  </div>
                  {showInflation && year > 1 && (
                    <div className="text-xs text-gray-400">
                      Current: ${Math.round(currentAnnual).toLocaleString()} | Recommended: ${Math.round(recommendedAnnual).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {yearsToProject > 5 && (
            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-gray-700">Years 6-{yearsToProject}:</span>
              <span className="font-semibold text-gray-900">
                {(() => {
                  const remainingSavings = currentProjection.yearlyBreakdown
                    .slice(5)
                    .reduce((sum, c, idx) => {
                      const rec = recommendedProjection.yearlyBreakdown[idx + 5]?.annualCost ?? 0;
                      return sum + (c.annualCost - rec);
                    }, 0);
                  return `${remainingSavings >= 0 ? '+' : '-'}$${Math.abs(Math.round(remainingSavings)).toLocaleString()}`;
                })()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700">
        <strong>💡 Note:</strong> {showInflation
          ? `These calculations include estimated ${(ANNUAL_INCREASE_RATE * 100).toFixed(0)}% annual premium increases based on historical trends (Kaiser Family Foundation data). Actual increases may vary based on plan changes, subsidy eligibility, age, and market conditions.`
          : 'These calculations assume consistent premium costs. Actual costs may vary based on plan changes, subsidy eligibility, age, and annual premium adjustments.'
        } Always verify current rates when enrolling.
      </div>
    </div>
  );
}
