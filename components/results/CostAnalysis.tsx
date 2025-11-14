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
  const getAffordabilityStatus = (): { color: string; label: string; icon: string; level: 'good' | 'warning' | 'alert' } => {
    if (!budgetRange) return { color: 'text-gray-600', label: 'Budget not specified', icon: 'ℹ️', level: 'good' };
    const costToCheck = subsidyAmount > 0 ? avgCostAfterSubsidy : avgRecommendedCost;
    if (costToCheck <= budgetRange.max) {
      return { color: 'text-green-600', label: 'Within your budget', icon: '✓', level: 'good' };
    }
    if (costToCheck <= budgetRange.max * 1.2) {
      return { color: 'text-yellow-600', label: 'Slightly over budget', icon: '⚠', level: 'warning' };
    }
    return { color: 'text-red-600', label: 'Over budget', icon: '✗', level: 'alert' };
  };

  const affordabilityStatus = getAffordabilityStatus();

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
    <section className="mb-12 md:mb-16 animate-fadeIn">
      {/* Premium Gradient Header */}
      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 px-6 py-12 md:px-12 md:py-16">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(255, 255, 255) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative z-10">
          {/* Section Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-4xl shadow-xl rotate-3 hover:rotate-6 transition-transform duration-300 cursor-pointer">
              💰
            </div>
            <div className="flex-1">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Cost Analysis
              </h3>
              <p className="text-green-100 text-sm md:text-base">
                Complete breakdown of your insurance costs
              </p>
            </div>
          </div>
        </div>

        {/* Curved Bottom Edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 0L60 10C120 20 240 40 360 45C480 50 600 40 720 35C840 30 960 30 1080 35C1200 40 1320 50 1380 55L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="rounded-b-3xl bg-white px-6 py-8 md:px-12 md:py-12 shadow-xl">
        {/* Premium Tab Navigation */}
        <div className="mb-8">
          <div className="border-b-2 border-gray-200 overflow-x-auto">
            <div className="flex gap-2 md:gap-4 min-w-max md:min-w-0">
              <button
                onClick={() => setActiveTab('glance')}
                className={`relative px-6 py-4 font-semibold transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'glance'
                    ? 'text-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <span>At a Glance</span>
                </span>
                {activeTab === 'glance' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                )}
              </button>
              {currentCost && (
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`relative px-6 py-4 font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === 'comparison'
                      ? 'text-green-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl">📈</span>
                    <span>Comparison</span>
                  </span>
                  {activeTab === 'comparison' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                  )}
                </button>
              )}
              <button
                onClick={() => setActiveTab('savings')}
                className={`relative px-6 py-4 font-semibold transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'savings'
                    ? 'text-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">💵</span>
                  <span>{currentCost ? 'Savings' : 'Projections'}</span>
                </span>
                {activeTab === 'savings' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* AT A GLANCE TAB */}
          {activeTab === 'glance' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Key Costs Grid - Premium Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59, 130, 246) 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                  }}></div>

                  <div className="relative z-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl shadow-md mb-4 rotate-3 group-hover:rotate-6 transition-transform duration-300">
                      💳
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                      Monthly <InsuranceTerm term="Premium">Cost</InsuranceTerm>
                    </div>
                    <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                      {formatCost(monthlyCost.low, monthlyCost.high)}
                    </div>
                    {subsidyAmount > 0 && (
                      <div className="mt-4 text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-200">
                        <span className="font-medium">Before subsidy:</span> {formatCost(monthlyCost.low + subsidyAmount, monthlyCost.high + subsidyAmount)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgb(34, 197, 94) 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                  }}></div>

                  <div className="relative z-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-3xl shadow-md mb-4 rotate-3 group-hover:rotate-6 transition-transform duration-300">
                      📅
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                      Annual Cost
                    </div>
                    <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                      {formatCost(annualCost.low, annualCost.high)}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Per year for your household
                    </div>
                  </div>
                </div>
              </div>

              {/* Affordability Check - Premium Callout */}
              {budgetRange && (
                <div className={`relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-xl border-2 ${
                  affordabilityStatus.level === 'good' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' :
                  affordabilityStatus.level === 'warning' ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300' :
                  'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
                }`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${
                      affordabilityStatus.level === 'good' ? 'rgb(34, 197, 94)' :
                      affordabilityStatus.level === 'warning' ? 'rgb(234, 179, 8)' :
                      'rgb(239, 68, 68)'
                    } 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                  }}></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                        affordabilityStatus.level === 'good' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                        affordabilityStatus.level === 'warning' ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                        'bg-gradient-to-br from-red-500 to-orange-600'
                      } text-4xl shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300`}>
                        {affordabilityStatus.icon}
                      </div>
                      <div>
                        <h4 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Affordability Check</h4>
                        <div className={`text-2xl md:text-3xl font-bold ${affordabilityStatus.color}`}>
                          {affordabilityStatus.label}
                        </div>
                      </div>
                    </div>

                    {/* Budget Usage Meter */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">Budget Usage</span>
                        <span className="font-bold">
                          {Math.round(((subsidyAmount > 0 ? avgCostAfterSubsidy : avgRecommendedCost) / budgetRange.max) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            affordabilityStatus.level === 'good' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                            affordabilityStatus.level === 'warning' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                            'bg-gradient-to-r from-red-400 to-orange-500'
                          }`}
                          style={{ width: `${Math.min(100, ((subsidyAmount > 0 ? avgCostAfterSubsidy : avgRecommendedCost) / budgetRange.max) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="text-xs text-gray-600 mb-1">Your Budget</div>
                        <div className="text-lg font-bold text-gray-900">${budgetRange.min}-${budgetRange.max}/mo</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="text-xs text-gray-600 mb-1">Recommended Plan</div>
                        <div className="text-lg font-bold text-gray-900">
                          ${Math.round(subsidyAmount > 0 ? avgCostAfterSubsidy : avgRecommendedCost)}/mo avg
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subsidy Impact - Enhanced Visualization */}
              {subsidyAmount > 0 && costAfterSubsidy && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 md:p-8 border-2 border-blue-300 shadow-xl">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgb(99, 102, 241) 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                  }}></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
                        🎁
                      </div>
                      <h4 className="text-xl md:text-2xl font-bold text-gray-900">Subsidy Impact</h4>
                    </div>

                    <div className="space-y-6">
                      {/* Before Subsidy */}
                      <div>
                        <div className="flex justify-between items-center text-sm mb-3">
                          <span className="font-semibold text-gray-700">Before Subsidy</span>
                          <span className="text-lg font-bold text-gray-900">
                            ${monthlyCost.low}-${monthlyCost.high}/month
                          </span>
                        </div>
                        <div className="relative w-full h-10 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">Full Cost</span>
                          </div>
                        </div>
                      </div>

                      {/* After Subsidy */}
                      <div>
                        <div className="flex justify-between items-center text-sm mb-3">
                          <span className="font-semibold text-gray-700">After Subsidy</span>
                          <span className="text-lg font-bold text-green-600">
                            ${costAfterSubsidy.low}-${costAfterSubsidy.high}/month
                          </span>
                        </div>
                        <div className="relative w-full h-10 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                            style={{ width: `${(avgCostAfterSubsidy / avgRecommendedCost) * 100}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">You Pay</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subsidy Savings Callout */}
                    <div className="mt-6 rounded-xl bg-white/80 backdrop-blur-sm p-6 border-2 border-green-300 shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-2xl shadow-sm">
                          🎉
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Estimated Subsidy</p>
                          <p className="text-2xl font-bold text-green-700">
                            ${Math.round(subsidyAmount)}/month
                            <span className="text-lg text-gray-600"> (${Math.round(subsidyAmount * 12)}/year)</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 text-center italic">
                Costs are estimates and may vary based on your specific situation and chosen provider.
              </p>
            </div>
          )}

          {/* COMPARISON TAB */}
          {activeTab === 'comparison' && currentCost && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-6">
                {/* Current Plan Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="font-semibold text-gray-700">Current Plan</span>
                    <span className="text-lg font-bold text-gray-900">${currentCost}/month</span>
                  </div>
                  <div className="relative w-full h-12 md:h-14 bg-gray-200 rounded-full overflow-hidden shadow-md">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-end pr-4 transition-all duration-700"
                      style={{ width: `${currentCostPercent}%` }}
                    >
                      <span className="text-white text-sm md:text-base font-bold">Current</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Plan Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="font-semibold text-gray-700">Recommended Plan</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${monthlyCost.low}-${monthlyCost.high}/month
                    </span>
                  </div>
                  <div className="relative w-full h-12 md:h-14 bg-gray-200 rounded-full overflow-hidden shadow-md">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-end pr-4 transition-all duration-700"
                      style={{ width: `${recommendedCostPercent}%` }}
                    >
                      <span className="text-white text-sm md:text-base font-bold">Recommended</span>
                    </div>
                  </div>
                </div>

                {/* Budget Bar */}
                {budgetRange && (
                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="font-semibold text-gray-700">Your Budget</span>
                      <span className="text-lg font-bold text-green-600">${budgetRange.max}/month</span>
                    </div>
                    <div className="relative w-full h-12 md:h-14 bg-gray-200 rounded-full overflow-hidden shadow-md">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-end pr-4 transition-all duration-700"
                        style={{ width: `${budgetPercent}%` }}
                      >
                        <span className="text-white text-sm md:text-base font-bold">Budget</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Savings Indicator */}
              {isSaving && (
                <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 p-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-3xl shadow-md rotate-3 hover:rotate-6 transition-transform duration-300">
                      💰
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Potential Savings</p>
                      <p className="text-2xl font-bold text-green-700">
                        ${Math.round(monthlySavingsAvg)}/month
                        <span className="text-lg text-gray-600"> (${Math.round(monthlySavingsAvg * 12)}/year)</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SAVINGS/PROJECTIONS TAB */}
          {activeTab === 'savings' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Monthly Savings Summary */}
              {currentCost && (
                <div className={`relative overflow-hidden rounded-2xl p-8 border-2 shadow-xl ${
                  isSaving
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                    : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
                }`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${isSaving ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                  }}></div>

                  <div className="relative z-10 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full mx-auto mb-4 ${isSaving ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-orange-600'} text-5xl shadow-lg">
                      {isSaving ? '📈' : '📉'}
                    </div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                      {isSaving ? 'Potential Monthly Savings' : 'Additional Monthly Cost'}
                    </div>
                    <div className={`text-5xl md:text-6xl font-bold mb-2 ${
                      isSaving ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {isSaving ? '+' : '-'}${Math.abs(monthlySavingsAvg).toFixed(0)}
                      <span className="text-2xl">/mo</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Current: ${currentCost}/mo → Recommended: ${effectiveRecommendedAvg.toFixed(0)}/mo
                      {subsidyAmount > 0 && ' (after subsidies)'}
                    </div>
                  </div>
                </div>
              )}

              {/* Time Period Selector - Premium Buttons */}
              <div>
                <label className="block text-lg font-bold text-gray-900 mb-4">
                  {currentCost ? 'Calculate savings over:' : 'Project costs over how many years?'}
                </label>
                <div className="flex flex-wrap gap-3">
                  {[1, 3, 5, 10].map(years => (
                    <button
                      key={years}
                      onClick={() => setYearsToProject(years)}
                      className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-md ${
                        yearsToProject === years
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105'
                          : 'bg-gradient-to-br from-gray-50 to-white text-gray-700 hover:shadow-lg hover:scale-105 border-2 border-gray-200'
                      }`}
                    >
                      {years} {years === 1 ? 'Year' : 'Years'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inflation Toggle - Premium Design */}
              <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 border-2 border-gray-200 shadow-md">
                <label className="flex items-center gap-4 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showInflation}
                      onChange={(e) => setShowInflation(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-gray-300 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-600 transition-colors duration-300"></div>
                    <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 peer-checked:translate-x-6"></div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Include Annual Premium Increases</div>
                    <div className="text-xs text-gray-600">Estimated {(ANNUAL_INCREASE_RATE * 100).toFixed(0)}% per year based on historical trends</div>
                  </div>
                </label>
              </div>

              {/* Comparison Grid - Premium Cards */}
              {currentCost ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 md:p-8 border-2 border-gray-300 shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 text-2xl shadow-md mb-4 rotate-3">
                      📋
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Current Plan Total</div>
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                      ${Math.round(currentProjection?.total || 0).toLocaleString()}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Starting monthly:</span>
                        <span className="font-semibold">${currentCost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>First year:</span>
                        <span className="font-semibold">${(currentCost * 12).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{yearsToProject} years:</span>
                        <span className="font-semibold">${Math.round(currentProjection?.total || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-8 border-2 border-blue-400 shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl shadow-md mb-4 rotate-3">
                      ⭐
                    </div>
                    <div className="text-xs text-blue-600 uppercase tracking-wide mb-2 font-bold">Recommended Plan Total</div>
                    <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-4">
                      ${Math.round(recommendedProjection.total).toLocaleString()}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Starting monthly:</span>
                        <span className="font-semibold">${effectiveRecommendedAvg.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>First year:</span>
                        <span className="font-semibold">${(effectiveRecommendedAvg * 12).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{yearsToProject} years:</span>
                        <span className="font-semibold">${Math.round(recommendedProjection.total).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-8 border-2 border-blue-400 shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl shadow-md mb-4 rotate-3">
                      📊
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Total Over {yearsToProject} {yearsToProject === 1 ? 'Year' : 'Years'}</div>
                    <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                      ${Math.round(recommendedProjection.total).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Starting at ${effectiveRecommendedAvg.toFixed(0)}/month
                      {subsidyAmount > 0 && ' (after subsidies)'}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 md:p-8 border-2 border-green-300 shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-2xl shadow-md mb-4 rotate-3">
                      📅
                    </div>
                    <div className="text-sm text-gray-600 mb-2">First Year Cost</div>
                    <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                      ${Math.round(effectiveRecommendedAvg * 12).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Range: ${Math.round(effectiveRecommendedLow * 12).toLocaleString()} - ${Math.round(effectiveRecommendedHigh * 12).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Total Savings Callout - Premium Design */}
              {currentCost && isSaving && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 p-8 md:p-10 border-2 border-amber-300 shadow-xl">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgb(245, 158, 11) 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                  }}></div>

                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-5xl shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
                        🎉
                      </div>
                      <div className="text-center md:text-left flex-1">
                        <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Total Savings Over {yearsToProject} Years</div>
                        <div className="text-4xl md:text-5xl font-bold text-green-700">
                          ${Math.round(totalSavings).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {totalSavings >= 5000 && (
                      <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 border-2 border-amber-200">
                        <p className="text-sm font-bold text-gray-900 mb-3">💡 What you could do with ${Math.round(totalSavings).toLocaleString()}:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {totalSavings >= 5000 && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="text-xl">✈️</span>
                              <span>Take a nice vacation</span>
                            </div>
                          )}
                          {totalSavings >= 10000 && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="text-xl">🏦</span>
                              <span>Build an emergency fund</span>
                            </div>
                          )}
                          {totalSavings >= 20000 && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="text-xl">📈</span>
                              <span>Max out retirement contributions</span>
                            </div>
                          )}
                          {totalSavings >= 50000 && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="text-xl">🏡</span>
                              <span>Make a down payment on a home</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Year-by-Year Breakdown - Premium Table */}
              <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 md:p-8 border-2 border-gray-200 shadow-lg">
                <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 text-xl shadow-sm">
                    📋
                  </div>
                  {currentCost ? 'Year-by-Year Savings Breakdown' : 'Cost Breakdown by Year'}
                </h4>
                <div className="space-y-3">
                  {recommendedProjection.yearlyBreakdown.slice(0, 5).map(({ year, annualCost: recommendedAnnual }) => {
                    const currentAnnual = currentProjection?.yearlyBreakdown[year - 1]?.annualCost || 0;
                    const yearSavings = currentAnnual - recommendedAnnual;

                    return (
                      <div key={year} className="flex justify-between items-center p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-shadow">
                        <span className="font-semibold text-gray-700">Year {year}:</span>
                        <div className="text-right">
                          {currentCost ? (
                            <>
                              <div className={`text-lg font-bold ${yearSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {yearSavings >= 0 ? '+' : '-'}${Math.abs(Math.round(yearSavings)).toLocaleString()}
                              </div>
                              {showInflation && year > 1 && (
                                <div className="text-xs text-gray-500">
                                  Current: ${Math.round(currentAnnual).toLocaleString()} | Recommended: ${Math.round(recommendedAnnual).toLocaleString()}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              ${Math.round(recommendedAnnual).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Note Section */}
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-2 border-blue-200 shadow-md">
                <div className="flex gap-3">
                  <div className="text-2xl">💡</div>
                  <div className="text-sm text-gray-800 leading-relaxed">
                    <strong>Note:</strong> {showInflation
                      ? `These calculations include estimated ${(ANNUAL_INCREASE_RATE * 100).toFixed(0)}% annual premium increases based on historical trends. Actual increases may vary.`
                      : 'These calculations assume consistent premium costs. Actual costs may vary based on plan changes and market conditions.'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(CostAnalysis);
