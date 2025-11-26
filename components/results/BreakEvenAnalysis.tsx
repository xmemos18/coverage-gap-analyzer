'use client';

import { useMemo } from 'react';

// Types matching the break-even calculator module
interface PlanDetails {
  name: string;
  monthlyPremium: number;
  deductible: number;
  coinsurance: number;
  outOfPocketMax: number;
  metalTier?: string;
}

interface CostAtUtilization {
  medicalExpense: number;
  plan1TotalCost: number;
  plan2TotalCost: number;
  cheaperPlan: '1' | '2' | 'equal';
  savingsWithPlan1: number;
}

interface BreakEvenAnalysis {
  summary: string;
  recommendedPlan: '1' | '2';
  confidence: 'high' | 'medium' | 'low';
  insights: string[];
  planStrengths: {
    plan1: string[];
    plan2: string[];
  };
}

interface BreakEvenResult {
  plan1: PlanDetails;
  plan2: PlanDetails;
  breakEvenPoint: number | null;
  betterPlanBelowBreakeven: '1' | '2' | 'always-1' | 'always-2';
  betterPlanAboveBreakeven: '1' | '2' | 'always-1' | 'always-2';
  costCurve: CostAtUtilization[];
  analysis: BreakEvenAnalysis;
}

interface BreakEvenAnalysisProps {
  result: BreakEvenResult;
}

export default function BreakEvenAnalysisComponent({ result }: BreakEvenAnalysisProps) {
  const { plan1, plan2, breakEvenPoint, costCurve, analysis } = result;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate max cost for chart scaling
  const maxCost = useMemo(() => {
    const allCosts = costCurve.flatMap((c) => [c.plan1TotalCost, c.plan2TotalCost]);
    return Math.max(...allCosts);
  }, [costCurve]);

  // Get confidence badge color
  const confidenceColor = useMemo(() => {
    switch (analysis.confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-orange-100 text-orange-800';
    }
  }, [analysis.confidence]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">
            📊
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Break-Even Analysis</h3>
            <p className="text-emerald-100 text-sm">
              {plan1.name} vs {plan2.name}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Break-Even Point Highlight */}
        <div
          className={`rounded-xl p-5 mb-6 ${
            breakEvenPoint
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
              : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
          }`}
        >
          {breakEvenPoint ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Break-Even Point</p>
              <p className="text-3xl font-bold text-blue-700">{formatCurrency(breakEvenPoint)}</p>
              <p className="text-sm text-gray-600 mt-2">in annual medical expenses</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-bold text-green-700">
                {analysis.recommendedPlan === '1' ? plan1.name : plan2.name} is always more
                cost-effective
              </p>
              <p className="text-sm text-gray-600 mt-1">No break-even point exists</p>
            </div>
          )}
        </div>

        {/* Summary with Confidence */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${confidenceColor}`}>
              {analysis.confidence.toUpperCase()} CONFIDENCE
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Plan Comparison Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Plan 1 */}
          <div
            className={`rounded-xl p-4 ${
              analysis.recommendedPlan === '1'
                ? 'bg-green-50 border-2 border-green-300'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {analysis.recommendedPlan === '1' && (
              <span className="inline-block bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold mb-2">
                Recommended
              </span>
            )}
            <h4 className="font-bold text-gray-900 mb-3">{plan1.name}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Premium:</span>
                <span className="font-semibold">{formatCurrency(plan1.monthlyPremium)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Deductible:</span>
                <span className="font-semibold">{formatCurrency(plan1.deductible)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Coinsurance:</span>
                <span className="font-semibold">{Math.round(plan1.coinsurance * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">OOP Max:</span>
                <span className="font-semibold">{formatCurrency(plan1.outOfPocketMax)}</span>
              </div>
            </div>
            {analysis.planStrengths.plan1.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Strengths:</p>
                <ul className="text-xs text-green-700">
                  {analysis.planStrengths.plan1.map((s, i) => (
                    <li key={i}>+ {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Plan 2 */}
          <div
            className={`rounded-xl p-4 ${
              analysis.recommendedPlan === '2'
                ? 'bg-green-50 border-2 border-green-300'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {analysis.recommendedPlan === '2' && (
              <span className="inline-block bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold mb-2">
                Recommended
              </span>
            )}
            <h4 className="font-bold text-gray-900 mb-3">{plan2.name}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Premium:</span>
                <span className="font-semibold">{formatCurrency(plan2.monthlyPremium)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Deductible:</span>
                <span className="font-semibold">{formatCurrency(plan2.deductible)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Coinsurance:</span>
                <span className="font-semibold">{Math.round(plan2.coinsurance * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">OOP Max:</span>
                <span className="font-semibold">{formatCurrency(plan2.outOfPocketMax)}</span>
              </div>
            </div>
            {analysis.planStrengths.plan2.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Strengths:</p>
                <ul className="text-xs text-green-700">
                  {analysis.planStrengths.plan2.map((s, i) => (
                    <li key={i}>+ {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Cost Curve Chart */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Cost at Different Utilization Levels</h4>
          <div className="space-y-3">
            {costCurve
              .filter((_, i) => i % 2 === 0) // Show every other point
              .map((point, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{formatCurrency(point.medicalExpense)}</span>
                    <span>
                      {point.cheaperPlan === '1'
                        ? plan1.name
                        : point.cheaperPlan === '2'
                        ? plan2.name
                        : 'Equal'}{' '}
                      is cheaper
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {/* Plan 1 Bar */}
                    <div className="flex-1 relative">
                      <div className="h-6 bg-gray-100 rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all duration-500 ${
                            point.cheaperPlan === '1'
                              ? 'bg-gradient-to-r from-green-400 to-green-500'
                              : 'bg-gradient-to-r from-blue-400 to-blue-500'
                          }`}
                          style={{ width: `${(point.plan1TotalCost / maxCost) * 100}%` }}
                        />
                      </div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700">
                        {formatCurrency(point.plan1TotalCost)}
                      </span>
                    </div>
                    {/* Plan 2 Bar */}
                    <div className="flex-1 relative">
                      <div className="h-6 bg-gray-100 rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all duration-500 ${
                            point.cheaperPlan === '2'
                              ? 'bg-gradient-to-r from-green-400 to-green-500'
                              : 'bg-gradient-to-r from-purple-400 to-purple-500'
                          }`}
                          style={{ width: `${(point.plan2TotalCost / maxCost) * 100}%` }}
                        />
                      </div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700">
                        {formatCurrency(point.plan2TotalCost)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>{plan1.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span>{plan2.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Cheaper</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        {analysis.insights.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <span>💡</span>
              <span>Key Insights</span>
            </h4>
            <ul className="space-y-2">
              {analysis.insights.map((insight, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-500 text-center">
          * Analysis based on plan parameters provided. Actual costs may vary based on specific
          healthcare services and network usage.
        </p>
      </div>
    </div>
  );
}
