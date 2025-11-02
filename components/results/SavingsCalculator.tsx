'use client';

import { useState } from 'react';
import { CostRange } from '@/types';

interface SavingsCalculatorProps {
  recommendedCost: CostRange;
  currentCost?: number;
  subsidyAmount?: number;
}

export default function SavingsCalculator({
  recommendedCost,
  currentCost,
  subsidyAmount = 0
}: SavingsCalculatorProps) {
  const [yearsToProject, setYearsToProject] = useState(5);

  // Calculate effective recommended cost after subsidies
  const effectiveRecommendedLow = Math.max(0, recommendedCost.low - subsidyAmount);
  const effectiveRecommendedHigh = Math.max(0, recommendedCost.high - subsidyAmount);
  const effectiveRecommendedAvg = (effectiveRecommendedLow + effectiveRecommendedHigh) / 2;

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
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {years} {years === 1 ? 'Year' : 'Years'}
                </button>
              ))}
            </div>
          </div>

          {/* Projection Results */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Total Cost Over {yearsToProject} {yearsToProject === 1 ? 'Year' : 'Years'}</div>
              <div className="text-3xl font-bold text-primary">
                ${(effectiveRecommendedAvg * 12 * yearsToProject).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Based on ${effectiveRecommendedAvg.toFixed(0)}/month average
                {subsidyAmount > 0 && ' (after subsidies)'}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Annual Cost</div>
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
              {Array.from({ length: Math.min(yearsToProject, 5) }, (_, i) => i + 1).map(year => (
                <div key={year} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Year {year}:</span>
                  <span className="font-semibold text-gray-900">
                    ${(effectiveRecommendedAvg * 12).toLocaleString()}
                  </span>
                </div>
              ))}
              {yearsToProject > 5 && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-300">
                  <span className="text-gray-700">Years 6-{yearsToProject}:</span>
                  <span className="font-semibold text-gray-900">
                    ${(effectiveRecommendedAvg * 12 * (yearsToProject - 5)).toLocaleString()}
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

  // Long-term projections
  const currentTotalCost = currentCost * 12 * yearsToProject;
  const recommendedTotalCost = effectiveRecommendedAvg * 12 * yearsToProject;
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
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {years} {years === 1 ? 'Year' : 'Years'}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Current Plan */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <div className="text-xs text-gray-500 uppercase mb-1">Current Plan</div>
          <div className="text-2xl font-bold text-gray-900 mb-3">
            ${currentTotalCost.toLocaleString()}
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Monthly: ${currentCost}</div>
            <div>Annual: ${(currentCost * 12).toLocaleString()}</div>
            <div>{yearsToProject} Years: ${currentTotalCost.toLocaleString()}</div>
          </div>
        </div>

        {/* Recommended Plan */}
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="text-xs text-blue-600 uppercase mb-1">Recommended Plan</div>
          <div className="text-2xl font-bold text-primary mb-3">
            ${recommendedTotalCost.toLocaleString()}
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Monthly: ${effectiveRecommendedAvg.toFixed(0)}</div>
            <div>Annual: ${(effectiveRecommendedAvg * 12).toLocaleString()}</div>
            <div>{yearsToProject} Years: ${recommendedTotalCost.toLocaleString()}</div>
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
                ${totalSavings.toLocaleString()}
              </div>
            </div>
            <div className="text-5xl">🎉</div>
          </div>
          <div className="mt-4 text-sm text-gray-700">
            <strong>What you could do with ${totalSavings.toLocaleString()}:</strong>
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
          {Array.from({ length: Math.min(yearsToProject, 5) }, (_, i) => i + 1).map(year => {
            const yearSavings = monthlySavingsAvg * 12;
            const cumulativeSavings = yearSavings * year;
            return (
              <div key={year} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                <span className="text-gray-700">Year {year}:</span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {isSaving ? '+' : isCosting ? '-' : ''}${Math.abs(yearSavings).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Cumulative: {isSaving ? '+' : isCosting ? '-' : ''}${Math.abs(cumulativeSavings).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
          {yearsToProject > 5 && (
            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-gray-700">Years 6-{yearsToProject}:</span>
              <span className="font-semibold text-gray-900">
                {isSaving ? '+' : isCosting ? '-' : ''}${Math.abs(monthlySavingsAvg * 12 * (yearsToProject - 5)).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700">
        <strong>💡 Note:</strong> These calculations assume consistent premium costs. Actual costs may vary based
        on plan changes, subsidy eligibility, age, and annual premium adjustments. Always verify current rates
        when enrolling.
      </div>
    </div>
  );
}
