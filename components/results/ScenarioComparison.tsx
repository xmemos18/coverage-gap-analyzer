'use client';

import { useMemo } from 'react';

// Types matching the scenario comparison module
interface ScenarioDifference {
  field: string;
  label: string;
  scenario1Value: string | number;
  scenario2Value: string | number;
  changeType: 'increase' | 'decrease' | 'change';
}

interface CostComparison {
  monthlyPremiumDiff: {
    low: number;
    high: number;
    averageDiff: number;
  };
  annualCostDiff: {
    low: number;
    high: number;
  };
  cheaperScenario: '1' | '2' | 'equal';
  potentialAnnualSavings: number;
}

interface RiskComparison {
  coverageScoreDiff: number;
  betterCoverageScenario: '1' | '2' | 'equal';
  riskNotes: string[];
}

interface ScenarioData {
  id: string;
  name: string;
  description: string;
}

interface RecommendationData {
  estimatedMonthlyCost: { low: number; high: number };
  coverageGapScore: number;
  recommendedInsurance: string;
}

interface ScenarioComparisonProps {
  scenario1: { scenario: ScenarioData; recommendation: RecommendationData };
  scenario2: { scenario: ScenarioData; recommendation: RecommendationData };
  differences: ScenarioDifference[];
  costComparison: CostComparison;
  riskComparison: RiskComparison;
  insights: string[];
  recommendation: string;
}

export default function ScenarioComparison({
  scenario1,
  scenario2,
  differences,
  costComparison,
  riskComparison,
  insights,
  recommendation,
}: ScenarioComparisonProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value >= 0 ? '' : '-';
    return `${sign}$${absValue.toLocaleString()}`;
  };

  // Get change indicator
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <span className="text-red-500">↑</span>;
      case 'decrease':
        return <span className="text-green-500">↓</span>;
      default:
        return <span className="text-blue-500">↔</span>;
    }
  };

  // Calculate which scenario wins in each category
  const costWinner = useMemo(() => {
    if (costComparison.cheaperScenario === '1') return scenario1.scenario.name;
    if (costComparison.cheaperScenario === '2') return scenario2.scenario.name;
    return 'Tied';
  }, [costComparison, scenario1, scenario2]);

  const coverageWinner = useMemo(() => {
    if (riskComparison.betterCoverageScenario === '1') return scenario1.scenario.name;
    if (riskComparison.betterCoverageScenario === '2') return scenario2.scenario.name;
    return 'Tied';
  }, [riskComparison, scenario1, scenario2]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">
            ⚖️
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Scenario Comparison</h3>
            <p className="text-indigo-100 text-sm">
              {scenario1.scenario.name} vs {scenario2.scenario.name}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Side-by-Side Summary */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Scenario 1 */}
          <div className={`rounded-xl p-4 ${costComparison.cheaperScenario === '1' ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {costComparison.cheaperScenario === '1' && (
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  Best Value
                </span>
              )}
              <h4 className="font-bold text-gray-900">{scenario1.scenario.name}</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">{scenario1.scenario.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Monthly Cost:</span>
                <span className="font-semibold">
                  ${scenario1.recommendation.estimatedMonthlyCost.low}-${scenario1.recommendation.estimatedMonthlyCost.high}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Coverage Score:</span>
                <span className="font-semibold">{scenario1.recommendation.coverageGapScore}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Recommendation:</span>
                <span className="font-semibold text-xs">{scenario1.recommendation.recommendedInsurance}</span>
              </div>
            </div>
          </div>

          {/* Scenario 2 */}
          <div className={`rounded-xl p-4 ${costComparison.cheaperScenario === '2' ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {costComparison.cheaperScenario === '2' && (
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  Best Value
                </span>
              )}
              <h4 className="font-bold text-gray-900">{scenario2.scenario.name}</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">{scenario2.scenario.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Monthly Cost:</span>
                <span className="font-semibold">
                  ${scenario2.recommendation.estimatedMonthlyCost.low}-${scenario2.recommendation.estimatedMonthlyCost.high}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Coverage Score:</span>
                <span className="font-semibold">{scenario2.recommendation.coverageGapScore}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Recommendation:</span>
                <span className="font-semibold text-xs">{scenario2.recommendation.recommendedInsurance}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Differences */}
        {differences.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Key Differences</h4>
            <div className="space-y-2">
              {differences.slice(0, 6).map((diff, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-gray-700">{diff.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{diff.scenario1Value}</span>
                    <span className="text-lg">{getChangeIcon(diff.changeType)}</span>
                    <span className="text-sm font-semibold text-gray-900">{diff.scenario2Value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost & Coverage Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Lower Cost</p>
            <p className="text-lg font-bold text-blue-700">{costWinner}</p>
            {costComparison.potentialAnnualSavings > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Save ${costComparison.potentialAnnualSavings.toLocaleString()}/year
              </p>
            )}
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Better Coverage</p>
            <p className="text-lg font-bold text-purple-700">{coverageWinner}</p>
            {Math.abs(riskComparison.coverageScoreDiff) > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {Math.abs(riskComparison.coverageScoreDiff)} points difference
              </p>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Cost Difference</h4>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Monthly Difference</p>
                <p className={`text-lg font-bold ${costComparison.monthlyPremiumDiff.averageDiff > 0 ? 'text-red-600' : costComparison.monthlyPremiumDiff.averageDiff < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {formatCurrency(costComparison.monthlyPremiumDiff.averageDiff)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Annual Difference</p>
                <p className={`text-lg font-bold ${costComparison.annualCostDiff.low > 0 ? 'text-red-600' : costComparison.annualCostDiff.low < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {formatCurrency(costComparison.monthlyPremiumDiff.averageDiff * 12)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Potential Savings</p>
                <p className="text-lg font-bold text-green-600">
                  ${costComparison.potentialAnnualSavings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Notes */}
        {riskComparison.riskNotes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>⚠️</span>
              <span>Risk Considerations</span>
            </h4>
            <ul className="space-y-2">
              {riskComparison.riskNotes.map((note, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>💡</span>
              <span>Key Insights</span>
            </h4>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200">
          <h4 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
            <span>🎯</span>
            <span>Our Recommendation</span>
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-500 text-center">
          * Comparison based on estimated costs and coverage scores. Actual results may vary.
        </p>
      </div>
    </div>
  );
}
