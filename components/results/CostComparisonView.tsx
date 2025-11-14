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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-lg">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }}
      ></div>

      <div className="relative p-6 md:p-8">
        {/* Premium Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl shadow-md rotate-2 hover:rotate-6 transition-transform duration-300">
              📊
            </div>
            <div>
              <h4 className="text-xl md:text-2xl font-bold text-gray-900">
                Cost Comparison
              </h4>
              <p className="text-sm text-gray-600 font-medium">
                Monthly costs for {showAll ? 'all insurance options' : 'recommended add-ons'}
              </p>
            </div>
          </div>
        </div>

        {/* Premium Comparison Bars */}
        <div className="space-y-4 mb-6">
          {displayRecommendations.map((rec) => {
            const percentage = (rec.householdCostPerMonth / maxCost) * 100;
            const priorityColors = {
              high: {
                gradient: 'from-green-500 to-emerald-600',
                bg: 'bg-green-600',
                badgeBg: 'bg-green-50',
                badgeText: 'text-green-700',
                badgeBorder: 'border-green-200',
              },
              medium: {
                gradient: 'from-yellow-500 to-amber-600',
                bg: 'bg-yellow-600',
                badgeBg: 'bg-yellow-50',
                badgeText: 'text-yellow-700',
                badgeBorder: 'border-yellow-200',
              },
              low: {
                gradient: 'from-gray-400 to-slate-500',
                bg: 'bg-gray-500',
                badgeBg: 'bg-gray-50',
                badgeText: 'text-gray-700',
                badgeBorder: 'border-gray-200',
              },
            };
            const colors = priorityColors[rec.priority];

            return (
              <div key={rec.insurance.id} className="group">
                {/* Label Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {rec.insurance.shortName}
                    </span>
                    {rec.priority === 'high' && (
                      <span className={`px-3 py-1 ${colors.badgeBg} ${colors.badgeText} border-2 ${colors.badgeBorder} text-xs font-bold rounded-lg shadow-sm`}>
                        ⭐ High Priority
                      </span>
                    )}
                  </div>
                  <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                    ${rec.householdCostPerMonth}/mo
                  </span>
                </div>

                {/* Premium Cost Bar with Gradient */}
                <div className="relative w-full bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl h-8 overflow-hidden border-2 border-gray-200 shadow-sm">
                  <div
                    className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500 group-hover:shadow-lg flex items-center justify-end pr-3 relative`}
                    style={{ width: `${percentage}%` }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    {rec.applicableMembers > 1 && (
                      <span className="relative text-xs text-white font-bold drop-shadow-md">
                        👥 {rec.applicableMembers} members
                      </span>
                    )}
                  </div>

                  {/* Probability Score Badge */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-800 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg border-2 border-gray-300 shadow-sm">
                      <span className="text-blue-600">{rec.probabilityScore}%</span>
                      <span className="text-gray-500">likely</span>
                    </span>
                  </div>
                </div>

                {/* Per-person Cost Breakdown */}
                {rec.applicableMembers > 1 && (
                  <div className="text-xs text-gray-600 mt-2 ml-1 flex items-center gap-1">
                    <span className="font-semibold">Per person:</span>
                    <span className="font-bold text-gray-900">${rec.adjustedCostPerMonth}/mo</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Premium Total Cost Summary */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 p-5 shadow-md mb-5">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}
          ></div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl shadow-lg rotate-3">
                💵
              </div>
              <div>
                <div className="text-sm font-bold text-blue-900 mb-0.5">Total Monthly Cost</div>
                <div className="text-xs text-blue-700 font-medium">
                  {recommendations.length} insurance type{recommendations.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                ${totalCost}
              </div>
              <div className="text-xs text-blue-700 font-semibold">${totalCost * 12}/year</div>
            </div>
          </div>
        </div>

        {/* Premium Priority Breakdown Grid */}
        {!showAll && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {recommendations.filter(r => r.priority === 'high').length > 0 && (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-4 text-center shadow-sm">
                <div className="absolute top-2 right-2 text-xl opacity-20">⭐</div>
                <div className="text-xs text-green-700 font-bold mb-1">High Priority</div>
                <div className="text-xl font-bold text-green-900">
                  ${recommendations.filter(r => r.priority === 'high').reduce((sum, r) => sum + r.householdCostPerMonth, 0)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {recommendations.filter(r => r.priority === 'high').length} type{recommendations.filter(r => r.priority === 'high').length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
            {recommendations.filter(r => r.priority === 'medium').length > 0 && (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 p-4 text-center shadow-sm">
                <div className="absolute top-2 right-2 text-xl opacity-20">⚡</div>
                <div className="text-xs text-yellow-700 font-bold mb-1">Medium Priority</div>
                <div className="text-xl font-bold text-yellow-900">
                  ${recommendations.filter(r => r.priority === 'medium').reduce((sum, r) => sum + r.householdCostPerMonth, 0)}
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  {recommendations.filter(r => r.priority === 'medium').length} type{recommendations.filter(r => r.priority === 'medium').length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
            {recommendations.filter(r => r.priority === 'low').length > 0 && (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 p-4 text-center shadow-sm">
                <div className="absolute top-2 right-2 text-xl opacity-20">📋</div>
                <div className="text-xs text-gray-700 font-bold mb-1">Low Priority</div>
                <div className="text-xl font-bold text-gray-900">
                  ${recommendations.filter(r => r.priority === 'low').reduce((sum, r) => sum + r.householdCostPerMonth, 0)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {recommendations.filter(r => r.priority === 'low').length} type{recommendations.filter(r => r.priority === 'low').length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Premium Legend */}
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-sm"></div>
              <span className="font-semibold text-gray-700">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 shadow-sm"></div>
              <span className="font-semibold text-gray-700">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-400 to-slate-500 shadow-sm"></div>
              <span className="font-semibold text-gray-700">Low Priority</span>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="font-bold text-blue-600">Score:</span>
              <span className="text-gray-600">Probability of need</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CostComparisonView);
