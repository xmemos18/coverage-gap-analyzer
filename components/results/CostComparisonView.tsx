'use client';

import { memo, useMemo } from 'react';
import type { AddOnRecommendation } from '@/types/addOnInsurance';

interface CostComparisonViewProps {
  recommendations: AddOnRecommendation[];
  showAll?: boolean;
}

/**
 * Visual cost comparison component for add-on insurance
 * Displays bar chart comparing costs across different insurance types
 */
function CostComparisonView({ recommendations, showAll = false }: CostComparisonViewProps) {
  // Sort by cost (highest to lowest) for visual clarity
  const sortedByPriority = useMemo(() => {
    return [...recommendations].sort((a, b) => {
      // Sort by priority first, then by cost
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.householdCostPerMonth - a.householdCostPerMonth;
    });
  }, [recommendations]);

  const sortedByCost = useMemo(() => {
    return [...recommendations].sort((a, b) => b.householdCostPerMonth - a.householdCostPerMonth);
  }, [recommendations]);

  // Use appropriate sort based on showAll flag
  const displayRecommendations = showAll ? sortedByCost : sortedByPriority;

  // Find max cost for scaling bars
  const maxCost = useMemo(() => {
    return Math.max(...recommendations.map(r => r.householdCostPerMonth), 1);
  }, [recommendations]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    return recommendations.reduce((sum, r) => sum + r.householdCostPerMonth, 0);
  }, [recommendations]);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span className="text-xl">📊</span>
          Cost Comparison
        </h4>
        <p className="text-sm text-gray-600">
          Monthly costs for {showAll ? 'all insurance options' : 'recommended add-ons'}
        </p>
      </div>

      {/* Comparison bars */}
      <div className="space-y-3 mb-4">
        {displayRecommendations.map((rec) => {
          const percentage = (rec.householdCostPerMonth / maxCost) * 100;
          const priorityColors = {
            high: 'bg-green-600',
            medium: 'bg-warning',
            low: 'bg-gray-400',
          };

          return (
            <div key={rec.insurance.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {rec.insurance.shortName}
                  </span>
                  {rec.priority === 'high' && (
                    <span className="px-2 py-0.5 bg-green-600/10 text-green-600 text-xs font-semibold rounded">
                      High Priority
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ${rec.householdCostPerMonth}/mo
                </span>
              </div>

              {/* Cost bar */}
              <div className="relative w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full ${priorityColors[rec.priority]} transition-all duration-300 group-hover:opacity-80 flex items-center justify-end pr-2`}
                  style={{ width: `${percentage}%` }}
                >
                  {rec.applicableMembers > 1 && (
                    <span className="text-xs text-white font-medium">
                      {rec.applicableMembers} members
                    </span>
                  )}
                </div>

                {/* Probability indicator overlay */}
                <div className="absolute top-0 left-0 h-full flex items-center pl-2 pointer-events-none">
                  <span className="text-xs font-semibold text-gray-700 bg-white/80 px-1.5 py-0.5 rounded">
                    {rec.probabilityScore}%
                  </span>
                </div>
              </div>

              {/* Per-person cost breakdown for families */}
              {rec.applicableMembers > 1 && (
                <div className="text-xs text-gray-500 mt-1 ml-1">
                  ${rec.adjustedCostPerMonth} per person
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total Cost Summary */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-700">Total Monthly Cost</div>
            <div className="text-xs text-gray-500">
              {recommendations.length} insurance type{recommendations.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${totalCost}/mo</div>
            <div className="text-xs text-gray-600">${totalCost * 12}/year</div>
          </div>
        </div>
      </div>

      {/* Cost breakdown by priority */}
      {!showAll && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {recommendations.filter(r => r.priority === 'high').length > 0 && (
            <div className="bg-green-600/5 border border-green-600/20 rounded p-2 text-center">
              <div className="text-xs text-gray-600 mb-0.5">High Priority</div>
              <div className="text-sm font-bold text-gray-900">
                ${recommendations.filter(r => r.priority === 'high').reduce((sum, r) => sum + r.householdCostPerMonth, 0)}
              </div>
            </div>
          )}
          {recommendations.filter(r => r.priority === 'medium').length > 0 && (
            <div className="bg-warning/5 border border-warning/20 rounded p-2 text-center">
              <div className="text-xs text-gray-600 mb-0.5">Medium</div>
              <div className="text-sm font-bold text-gray-900">
                ${recommendations.filter(r => r.priority === 'medium').reduce((sum, r) => sum + r.householdCostPerMonth, 0)}
              </div>
            </div>
          )}
          {recommendations.filter(r => r.priority === 'low').length > 0 && (
            <div className="bg-gray-100 border border-gray-200 rounded p-2 text-center">
              <div className="text-xs text-gray-600 mb-0.5">Low Priority</div>
              <div className="text-sm font-bold text-gray-900">
                ${recommendations.filter(r => r.priority === 'low').reduce((sum, r) => sum + r.householdCostPerMonth, 0)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Low Priority</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="font-medium">Score:</span>
            <span>Probability of need</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CostComparisonView);
