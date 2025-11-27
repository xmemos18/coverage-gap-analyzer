'use client';

import { memo, useState, useMemo } from 'react';
import AddOnInsuranceCard from './AddOnInsuranceCard';
import CostComparisonView from './CostComparisonView';
import type { AddOnInsuranceAnalysis } from '@/types/addOnInsurance';
import { exportAndDownloadRecommendations, copyRecommendationsToClipboard } from '@/lib/exportUtils';

interface AddOnInsuranceSectionProps {
  analysis: AddOnInsuranceAnalysis;
}

/**
 * Main section component for displaying add-on insurance recommendations
 */
function AddOnInsuranceSection({ analysis }: AddOnInsuranceSectionProps) {
  const [showMediumPriority, setShowMediumPriority] = useState(false);
  const [showLowPriority, setShowLowPriority] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [sortBy, setSortBy] = useState<'priority' | 'cost' | 'score'>('priority');
  const [filterByCategory, setFilterByCategory] = useState<string>('all');

  const { totalMonthlyHighPriority, totalMonthlyAllRecommended, householdAgeGroups, recommendations, allRecommendations } = analysis;

  // Extract all household ages
  const householdAges = useMemo(() => {
    return householdAgeGroups.flatMap(group => group.ages);
  }, [householdAgeGroups]);

  // Get non-recommended options (below threshold)
  const nonRecommended = useMemo(() => {
    const recommendedIds = new Set(recommendations.map(r => r.insurance.id));
    return allRecommendations.filter(r => !recommendedIds.has(r.insurance.id));
  }, [recommendations, allRecommendations]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(allRecommendations.map(r => r.insurance.category));
    return ['all', ...Array.from(cats)];
  }, [allRecommendations]);

  // Apply filtering and sorting
  const filteredAndSorted = useMemo(() => {
    let filtered = showAllOptions ? allRecommendations : recommendations;

    // Apply category filter
    if (filterByCategory !== 'all') {
      filtered = filtered.filter(r => r.insurance.category === filterByCategory);
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'cost':
        sorted.sort((a, b) => b.householdCostPerMonth - a.householdCostPerMonth);
        break;
      case 'score':
        sorted.sort((a, b) => b.probabilityScore - a.probabilityScore);
        break;
      case 'priority':
      default:
        sorted.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return b.probabilityScore - a.probabilityScore;
        });
    }

    return sorted;
  }, [showAllOptions, allRecommendations, recommendations, filterByCategory, sortBy]);

  // Group filtered results by priority
  const filteredHighPriority = useMemo(() =>
    filteredAndSorted.filter(r => r.priority === 'high'),
    [filteredAndSorted]
  );
  const filteredMediumPriority = useMemo(() =>
    filteredAndSorted.filter(r => r.priority === 'medium'),
    [filteredAndSorted]
  );
  const filteredLowPriority = useMemo(() =>
    filteredAndSorted.filter(r => r.priority === 'low'),
    [filteredAndSorted]
  );

  // If no recommendations, don't render anything
  if (analysis.recommendations.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-dark-800 dark:to-dark-700 border-2 border-gray-200 dark:border-dark-600 shadow-2xl p-6 md:p-8 mb-12 md:mb-16">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }}
      ></div>

      {/* Premium Section Header */}
      <div className="relative mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-3xl md:text-4xl shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
                ➕
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Recommended Add-On Insurance
              </h3>
            </div>
            <p className="text-base text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
              Based on your household&apos;s age composition, we recommend these supplemental insurance options
              to fill coverage gaps and provide additional protection.
            </p>
          </div>

          {/* Premium Export Buttons */}
          <div className="flex gap-3">
            <button
              onClick={async () => {
                try {
                  await copyRecommendationsToClipboard(analysis);
                  alert('Recommendations copied to clipboard!');
                } catch {
                  alert('Failed to copy to clipboard. Please try again.');
                }
              }}
              className="px-5 py-3 bg-white dark:bg-dark-700 border-2 border-gray-300 dark:border-dark-500 hover:border-gray-400 dark:hover:border-dark-400 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all duration-300 flex items-center gap-2 text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5"
              title="Copy to clipboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
            <button
              onClick={() => {
                try {
                  exportAndDownloadRecommendations(analysis);
                } catch {
                  alert('Failed to export CSV. Please try again.');
                }
              }}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-lg text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-2 text-sm shadow-md hover:-translate-y-0.5"
              title="Export to CSV"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Premium Household Age Groups Summary */}
      {householdAgeGroups.length > 0 && (
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-l-4 border-blue-600 border-2 border-l-4 border-gray-200 dark:border-dark-600 dark:border-l-blue-600 rounded-r-xl p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl shadow-md rotate-3 flex-shrink-0">
              👥
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-base">Your Household</h4>
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                {householdAgeGroups.map((group, i) => (
                  <span key={i}>
                    {i > 0 && ' • '}
                    {group.memberCount} {group.groupName}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Premium Cost Summary */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm shadow-md rotate-3">
              ⭐
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">High Priority Add-Ons</div>
          </div>
          <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent mb-2">
            ${totalMonthlyHighPriority}/mo
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {analysis.highPriority.length} recommendation{analysis.highPriority.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-dark-700 dark:to-dark-600 border-2 border-gray-200 dark:border-dark-500 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gray-500 to-slate-600 text-white text-sm shadow-md rotate-3">
              📋
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">All Recommended Add-Ons</div>
          </div>
          <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-gray-700 to-slate-800 dark:from-gray-300 dark:to-slate-400 bg-clip-text text-transparent mb-2">
            ${totalMonthlyAllRecommended}/mo
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {analysis.recommendations.length} total recommendation{analysis.recommendations.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Premium Filtering Controls */}
      <div className="relative mb-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        {/* Filter by Category */}
        <select
          id="category-filter"
          value={filterByCategory}
          onChange={(e) => setFilterByCategory(e.target.value)}
          className="flex-1 px-5 py-3 border-2 border-gray-300 dark:border-dark-500 rounded-xl bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm hover:shadow-md transition-shadow"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? '📋 All Types' : `🔍 ${cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
            </option>
          ))}
        </select>

        {/* Sort Options */}
        <select
          id="sort-by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'priority' | 'cost' | 'score')}
          className="flex-1 sm:flex-none px-5 py-3 border-2 border-gray-300 dark:border-dark-500 rounded-xl bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm hover:shadow-md transition-shadow"
        >
          <option value="priority">⭐ Priority</option>
          <option value="cost">💰 Cost</option>
          <option value="score">📊 Score</option>
        </select>

        {/* Results Count */}
        <div className="text-sm text-gray-700 dark:text-gray-300 px-4 py-3 hidden sm:block bg-gray-50 dark:bg-dark-700 rounded-xl border-2 border-gray-200 dark:border-dark-600">
          <span className="font-bold text-gray-900 dark:text-white">{filteredAndSorted.length}</span> of {showAllOptions ? allRecommendations.length : recommendations.length}
        </div>
      </div>

      {/* Show All Options Toggle */}
      {nonRecommended.length > 0 && (
        <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border-2 border-gray-200 dark:border-dark-600">
          <div className="flex items-center gap-3">
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white text-sm">Show All Insurance Options</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                View all {allRecommendations.length} insurance types, including {nonRecommended.length} not recommended for your household
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAllOptions(!showAllOptions)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-dark-800 ${
              showAllOptions ? 'bg-blue-600' : 'bg-gray-300 dark:bg-dark-500'
            }`}
            aria-label="Toggle show all options"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showAllOptions ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      {/* Cost Comparison View */}
      <div className="mb-6">
        <CostComparisonView
          recommendations={filteredAndSorted}
          showAll={showAllOptions}
        />
      </div>

      {/* Premium High Priority Recommendations */}
      {filteredHighPriority.length > 0 && (
        <div className="relative mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-2 border-green-700 rounded-xl text-sm font-bold shadow-md">
              High Priority
            </span>
            <span className="text-gray-600 dark:text-gray-400 text-base md:text-lg font-medium">
              — Most relevant for your household
            </span>
          </div>
          <div className="space-y-6">
            {filteredHighPriority.map((rec) => (
              <AddOnInsuranceCard key={rec.insurance.id} recommendation={rec} householdAges={householdAges} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Recommendations */}
      {filteredMediumPriority.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowMediumPriority(!showMediumPriority)}
            className="w-full text-left mb-4 flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/40 dark:hover:to-orange-900/40 transition-all border-2 border-yellow-200 dark:border-yellow-800"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="px-3 py-1 bg-warning text-white rounded-full text-sm font-bold inline-block w-fit">
                Medium Priority
              </span>
              <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                Consider based on your needs • {filteredMediumPriority.length} {filteredMediumPriority.length === 1 ? 'option' : 'options'}
              </span>
            </div>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-dark-600 shadow-sm flex items-center justify-center">
              <svg
                className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform ${showMediumPriority ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showMediumPriority && (
            <div className="space-y-4">
              {filteredMediumPriority.map((rec) => (
                <AddOnInsuranceCard key={rec.insurance.id} recommendation={rec} householdAges={householdAges} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Low Priority Recommendations */}
      {filteredLowPriority.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowLowPriority(!showLowPriority)}
            className="w-full text-left mb-4 flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-all border-2 border-gray-200 dark:border-dark-600"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="px-3 py-1 bg-gray-200 dark:bg-dark-500 text-gray-700 dark:text-gray-200 rounded-full text-sm font-bold inline-block w-fit">
                Other Options
              </span>
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Additional coverage to consider • {filteredLowPriority.length} {filteredLowPriority.length === 1 ? 'option' : 'options'}
              </span>
            </div>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-dark-600 shadow-sm flex items-center justify-center">
              <svg
                className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform ${showLowPriority ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showLowPriority && (
            <div className="space-y-4">
              {filteredLowPriority.map((rec) => (
                                <AddOnInsuranceCard
                  key={rec.insurance.id}
                  recommendation={rec}
                  showDetails={false}
                  householdAges={householdAges}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Non-Recommended Options (shown when toggle is active) */}
      {showAllOptions && nonRecommended.length > 0 && (
        <div className="mb-6 border-2 border-dashed border-gray-300 dark:border-dark-500 rounded-lg p-6 bg-gray-50/50 dark:bg-dark-700/50">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-gray-200 dark:bg-dark-500 text-gray-600 dark:text-gray-300 border border-gray-400 dark:border-dark-400 rounded-full text-sm font-bold">
                Not Recommended
              </span>
              <span className="text-gray-600 dark:text-gray-400 text-base">
                — Low relevance for your household ({nonRecommended.length})
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              These insurance types have low probability scores for your household age composition and may not provide optimal value.
            </p>
          </div>
          <div className="space-y-4">
            {nonRecommended.map((rec) => (
                              <AddOnInsuranceCard
                key={rec.insurance.id}
                recommendation={rec}
                showDetails={false}
                  householdAges={householdAges}
              />
            ))}
          </div>
        </div>
      )}

      {/* Premium Bundle Discount Notice */}
      {analysis.recommendations.length >= 3 && (
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 mt-8 shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl shadow-md rotate-3 flex-shrink-0">
              💰
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-base md:text-lg">Bundle Discount Available</h4>
              <p className="text-sm md:text-base text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                Many insurance providers offer a 5% discount when you purchase 3 or more add-on policies together.
                Ask your insurance agent about multi-policy discounts!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Premium Important Notes */}
      <div className="relative mt-8 p-6 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-dark-700 dark:to-dark-600 border-2 border-gray-200 dark:border-dark-600 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gray-500 to-slate-600 text-white shadow-md rotate-3">
            ℹ️
          </div>
          <h5 className="font-bold text-gray-900 dark:text-white text-base">Important Notes:</h5>
        </div>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
              1
            </span>
            <span className="leading-relaxed">
              Costs shown are national averages adjusted for your state(s) and include family discounts where applicable.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
              2
            </span>
            <span className="leading-relaxed">
              Actual premiums vary by provider, coverage level, age, and health status. These are estimates only.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
              3
            </span>
            <span className="leading-relaxed">
              Add-on insurance recommendations are supplemental to your primary health insurance and address specific coverage gaps.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
              4
            </span>
            <span className="leading-relaxed">
              Consult with a licensed insurance agent to get personalized quotes and coverage details.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default memo(AddOnInsuranceSection);
