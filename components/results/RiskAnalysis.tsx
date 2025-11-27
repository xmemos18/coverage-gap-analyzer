'use client';

import { useMemo } from 'react';

// Types matching the Monte Carlo module
interface MonteCarloResult {
  median: number;
  mean: number;
  standardDeviation: number;
  percentiles: {
    p5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  probabilityOfExceedingDeductible: number;
  probabilityOfHittingOOPMax: number;
  expectedValueAtRisk: number;
  simulationCount: number;
  executionTimeMs: number;
}

interface MonteCarloInterpretation {
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  summary: string;
  insights: string[];
  recommendations: string[];
}

interface HistogramBucket {
  label: string;
  min: number;
  max: number;
  percentage: number;
}

interface MonteCarloAnalysis {
  result: MonteCarloResult;
  interpretation: MonteCarloInterpretation;
  histogramData: HistogramBucket[];
  inputParameters: {
    baseCost: number;
    deductible: number;
    outOfPocketMax: number;
    iterations: number;
  };
}

interface RiskAnalysisProps {
  analysis: MonteCarloAnalysis;
}

export default function RiskAnalysis({ analysis }: RiskAnalysisProps) {
  const { result, interpretation, histogramData, inputParameters } = analysis;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get risk level colors
  const getRiskColors = (level: string) => {
    switch (level) {
      case 'low':
        return {
          bg: 'bg-green-50 dark:bg-green-900/30',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-400',
          badge: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
        };
      case 'moderate':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/30',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-400',
          badge: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
        };
      case 'high':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/30',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-700 dark:text-orange-400',
          badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300',
        };
      case 'very-high':
        return {
          bg: 'bg-red-50 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-dark-700',
          border: 'border-gray-200 dark:border-dark-600',
          text: 'text-gray-700 dark:text-gray-400',
          badge: 'bg-gray-100 dark:bg-dark-600 text-gray-800 dark:text-gray-300',
        };
    }
  };

  const riskColors = getRiskColors(interpretation.riskLevel);

  // Calculate max histogram percentage for scaling
  const maxHistogramPercent = useMemo(() => {
    return Math.max(...histogramData.map((b) => b.percentage));
  }, [histogramData]);

  return (
    <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-dark-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl md:text-4xl shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
            🎲
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white">Risk Analysis</h3>
            <p className="text-purple-100 text-base font-medium">
              Monte Carlo simulation with {result.simulationCount.toLocaleString()} scenarios
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Risk Level Badge */}
        <div className={`rounded-xl p-4 ${riskColors.bg} ${riskColors.border} border-2 mb-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Level</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${riskColors.badge}`}>
              {interpretation.riskLevel.replace('-', ' ').toUpperCase()}
            </span>
          </div>
          <p className={`text-sm ${riskColors.text}`}>{interpretation.summary}</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 text-center border-2 border-purple-200 dark:border-purple-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Expected Cost</p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{formatCurrency(result.mean)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center border-2 border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Median Cost</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(result.median)}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-4 text-center border-2 border-orange-200 dark:border-orange-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">95% VaR</p>
            <p className="text-xl font-bold text-orange-700 dark:text-orange-400">
              {formatCurrency(result.expectedValueAtRisk)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4 text-center border-2 border-gray-200 dark:border-dark-600">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Std Deviation</p>
            <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
              {formatCurrency(result.standardDeviation)}
            </p>
          </div>
        </div>

        {/* Probability Stats */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Probability Analysis</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Exceed Deductible</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {result.probabilityOfExceedingDeductible}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${result.probabilityOfExceedingDeductible}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Hit Out-of-Pocket Max</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {result.probabilityOfHittingOOPMax}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${result.probabilityOfHittingOOPMax}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cost Distribution Histogram */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Cost Distribution</h4>
          <div className="space-y-2">
            {histogramData.map((bucket, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-28 text-xs text-gray-600 dark:text-gray-400 text-right">{bucket.label}</div>
                <div className="flex-1 relative">
                  <div className="h-6 bg-gray-100 dark:bg-dark-700 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded transition-all duration-500"
                      style={{ width: `${(bucket.percentage / maxHistogramPercent) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 text-xs font-medium text-gray-700 dark:text-gray-300 text-right">
                  {bucket.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Percentile Range */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Confidence Intervals</h4>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-700 dark:to-dark-600 rounded-xl p-4 border-2 border-gray-200 dark:border-dark-600">
            <div className="relative h-16">
              {/* Range bar */}
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 dark:bg-dark-500 rounded-full transform -translate-y-1/2">
                <div
                  className="absolute h-full bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 rounded-full"
                  style={{
                    left: `${(result.percentiles.p10 / inputParameters.outOfPocketMax) * 100}%`,
                    right: `${100 - (result.percentiles.p90 / inputParameters.outOfPocketMax) * 100}%`,
                  }}
                />
              </div>
              {/* Median marker */}
              <div
                className="absolute top-1/2 w-4 h-4 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-white dark:border-dark-800 shadow"
                style={{
                  left: `${(result.median / inputParameters.outOfPocketMax) * 100}%`,
                }}
              />
              {/* Labels */}
              <div className="absolute -bottom-1 left-0 text-xs text-gray-500 dark:text-gray-400">$0</div>
              <div className="absolute -bottom-1 right-0 text-xs text-gray-500 dark:text-gray-400">
                {formatCurrency(inputParameters.outOfPocketMax)}
              </div>
            </div>
            <div className="flex justify-between text-xs mt-4 text-gray-600 dark:text-gray-400">
              <span>10th: {formatCurrency(result.percentiles.p10)}</span>
              <span className="font-medium text-blue-700 dark:text-blue-400">
                Median: {formatCurrency(result.median)}
              </span>
              <span>90th: {formatCurrency(result.percentiles.p90)}</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        {interpretation.insights.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span>📊</span>
              <span>Key Insights</span>
            </h4>
            <ul className="space-y-2">
              {interpretation.insights.map((insight, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-purple-500 dark:text-purple-400 mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {interpretation.recommendations.length > 0 && (
          <div
            className={`rounded-xl p-4 ${riskColors.bg} border-2 ${riskColors.border}`}
          >
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <span>💡</span>
              <span>Recommendations</span>
            </h4>
            <ul className="space-y-2">
              {interpretation.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-500 dark:text-gray-500 text-center">
          * Based on {result.simulationCount.toLocaleString()} Monte Carlo simulations using
          lognormal distribution. Executed in {result.executionTimeMs}ms.
        </p>
      </div>
    </div>
  );
}
