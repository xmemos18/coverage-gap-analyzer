'use client';

import { useMemo } from 'react';
import { CostProjectionSummary, YearlyProjection, ProjectionTransition } from '@/types';

interface CostProjectionsProps {
  projections: CostProjectionSummary;
}

export default function CostProjections({ projections }: CostProjectionsProps) {
  const {
    yearlyProjections,
    totalProjectedCost,
    averageAnnualCost,
    transitions,
    insights,
    confidenceRange,
  } = projections;

  // Calculate max cost for chart scaling
  const maxCost = useMemo(() => {
    const maxYearly = Math.max(...yearlyProjections.map(p => p.totalAnnualCost));
    return Math.ceil(maxYearly / 1000) * 1000;
  }, [yearlyProjections]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-dark-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl md:text-4xl shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
            📈
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white">5-Year Cost Projection</h3>
            <p className="text-blue-100 text-base font-medium">See how your healthcare costs may change over time</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center border-2 border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total 5-Year Cost</p>
            <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(totalProjectedCost)}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 text-center border-2 border-green-200 dark:border-green-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Average Annual</p>
            <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(averageAnnualCost)}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 text-center border-2 border-purple-200 dark:border-purple-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Best Case (P10)</p>
            <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-400">
              {formatCurrency(confidenceRange.optimistic)}
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-4 text-center border-2 border-orange-200 dark:border-orange-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Worst Case (P90)</p>
            <p className="text-xl md:text-2xl font-bold text-orange-700 dark:text-orange-400">
              {formatCurrency(confidenceRange.pessimistic)}
            </p>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Annual Cost by Year</h4>
          <div className="space-y-3">
            {yearlyProjections.map((projection, index) => (
              <ProjectionBar
                key={index}
                projection={projection}
                maxCost={maxCost}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        </div>

        {/* Transitions */}
        {transitions.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Important Life Transitions</h4>
            <div className="space-y-3">
              {transitions.map((transition, index) => (
                <TransitionCard key={index} transition={transition} />
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
              <span>💡</span>
              <span>Key Insights</span>
            </h4>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-gray-500 dark:text-gray-500 text-center">
          * Projections based on historical inflation rates and ACA age-rating curves.
          Actual costs may vary based on plan selection, health status, and market conditions.
        </p>
      </div>
    </div>
  );
}

// Bar component for the chart
function ProjectionBar({
  projection,
  maxCost,
  formatCurrency,
}: {
  projection: YearlyProjection;
  maxCost: number;
  formatCurrency: (value: number) => string;
}) {
  const widthPercent = (projection.totalAnnualCost / maxCost) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">
        {projection.calendarYear}
      </div>
      <div className="flex-1 relative">
        <div className="h-8 bg-gray-100 dark:bg-dark-700 rounded-lg overflow-hidden">
          <div
            className={`h-full rounded-lg transition-all duration-500 ${
              projection.hasTransition
                ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                : 'bg-gradient-to-r from-blue-400 to-blue-500'
            }`}
            style={{ width: `${widthPercent}%` }}
          />
        </div>
        {projection.hasTransition && (
          <span className="absolute right-0 top-0 -mt-1 text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
            Transition
          </span>
        )}
      </div>
      <div className="w-24 text-right">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {formatCurrency(projection.totalAnnualCost)}
        </span>
      </div>
    </div>
  );
}

// Transition card component
function TransitionCard({ transition }: { transition: ProjectionTransition }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'medicare-eligible':
        return '🏥';
      case 'age-26-off-parents':
        return '🎓';
      case 'early-retirement':
        return '🏖️';
      default:
        return '📅';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'medicare-eligible':
        return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
      case 'age-26-off-parents':
        return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
      case 'early-retirement':
        return 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-50 dark:bg-dark-700 border-gray-200 dark:border-dark-600';
    }
  };

  return (
    <div className={`rounded-xl p-4 border-2 ${getColor(transition.type)}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getIcon(transition.type)}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 dark:text-white">{transition.description}</span>
            <span className="text-xs bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
              Age {transition.age} • {transition.year}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{transition.impact}</p>
          <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
            💡 {transition.recommendedAction}
          </p>
        </div>
      </div>
    </div>
  );
}
