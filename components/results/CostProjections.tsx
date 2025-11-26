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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">
            📈
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">5-Year Cost Projection</h3>
            <p className="text-blue-100 text-sm">See how your healthcare costs may change over time</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Total 5-Year Cost</p>
            <p className="text-xl md:text-2xl font-bold text-blue-700">
              {formatCurrency(totalProjectedCost)}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Average Annual</p>
            <p className="text-xl md:text-2xl font-bold text-green-700">
              {formatCurrency(averageAnnualCost)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Best Case (P10)</p>
            <p className="text-xl md:text-2xl font-bold text-purple-700">
              {formatCurrency(confidenceRange.optimistic)}
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Worst Case (P90)</p>
            <p className="text-xl md:text-2xl font-bold text-orange-700">
              {formatCurrency(confidenceRange.pessimistic)}
            </p>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Annual Cost by Year</h4>
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
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Important Life Transitions</h4>
            <div className="space-y-3">
              {transitions.map((transition, index) => (
                <TransitionCard key={index} transition={transition} />
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
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

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-gray-500 text-center">
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
      <div className="w-16 text-sm font-medium text-gray-600">
        {projection.calendarYear}
      </div>
      <div className="flex-1 relative">
        <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
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
          <span className="absolute right-0 top-0 -mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            Transition
          </span>
        )}
      </div>
      <div className="w-24 text-right">
        <span className="text-sm font-semibold text-gray-800">
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
        return 'bg-blue-50 border-blue-200';
      case 'age-26-off-parents':
        return 'bg-green-50 border-green-200';
      case 'early-retirement':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`rounded-xl p-4 border ${getColor(transition.type)}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getIcon(transition.type)}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">{transition.description}</span>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              Age {transition.age} • {transition.year}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{transition.impact}</p>
          <p className="text-sm text-blue-700 font-medium">
            💡 {transition.recommendedAction}
          </p>
        </div>
      </div>
    </div>
  );
}
