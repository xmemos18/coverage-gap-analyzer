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
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-3xl">➕</span>
              Recommended Add-On Insurance
            </h3>
            <p className="text-gray-600">
              Based on your household&apos;s age composition, we recommend these supplemental insurance options
              to fill coverage gaps and provide additional protection.
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  await copyRecommendationsToClipboard(analysis);
                  alert('Recommendations copied to clipboard!');
                } catch {
                  alert('Failed to copy to clipboard. Please try again.');
                }
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
              title="Copy to clipboard"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
              className="px-4 py-2 bg-accent hover:bg-accent-light text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
              title="Export to CSV"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Household Age Groups Summary */}
      {householdAgeGroups.length > 0 && (
        <div className="bg-accent/5 border-l-4 border-accent rounded-r-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-accent text-xl flex-shrink-0">👥</span>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Your Household</h4>
              <p className="text-sm text-gray-700">
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

      {/* Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-success/10 border border-success/30 rounded-lg p-4">
          <div className="text-sm text-gray-700 mb-1">High Priority Add-Ons</div>
          <div className="text-2xl font-bold text-gray-900">
            ${totalMonthlyHighPriority}/mo
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {analysis.highPriority.length} recommendation{analysis.highPriority.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-700 mb-1">All Recommended Add-Ons</div>
          <div className="text-2xl font-bold text-gray-900">
            ${totalMonthlyAllRecommended}/mo
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {analysis.recommendations.length} total recommendation{analysis.recommendations.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Filtering and Sorting Controls */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Filter by Category */}
          <div className="flex-1 w-full md:w-auto">
            <label htmlFor="category-filter" className="block text-sm font-semibold text-gray-700 mb-1">
              Filter by Type
            </label>
            <select
              id="category-filter"
              value={filterByCategory}
              onChange={(e) => setFilterByCategory(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Types' : cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex-1 w-full md:w-auto">
            <label htmlFor="sort-by" className="block text-sm font-semibold text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'priority' | 'cost' | 'score')}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            >
              <option value="priority">Priority (High to Low)</option>
              <option value="cost">Cost (High to Low)</option>
              <option value="score">Probability Score (High to Low)</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600 mt-2 md:mt-6">
            Showing <span className="font-semibold text-gray-900">{filteredAndSorted.length}</span> of {showAllOptions ? allRecommendations.length : recommendations.length}
          </div>
        </div>
      </div>

      {/* Show All Options Toggle */}
      {nonRecommended.length > 0 && (
        <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div>
              <h5 className="font-semibold text-gray-900 text-sm">Show All Insurance Options</h5>
              <p className="text-xs text-gray-600 mt-0.5">
                View all {allRecommendations.length} insurance types, including {nonRecommended.length} not recommended for your household
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAllOptions(!showAllOptions)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
              showAllOptions ? 'bg-accent' : 'bg-gray-300'
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

      {/* High Priority Recommendations */}
      {filteredHighPriority.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-success/10 text-success border border-success/30 rounded-full text-sm">
              High Priority
            </span>
            <span className="text-gray-600 text-base font-normal">
              — Most relevant for your household
            </span>
          </h4>
          <div className="space-y-4">
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
            className="w-full text-left mb-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-warning/10 text-warning border border-warning/30 rounded-full text-sm font-bold">
                Medium Priority
              </span>
              <span className="text-gray-600 text-base">
                — Consider based on your needs ({filteredMediumPriority.length})
              </span>
            </div>
            <span className="text-gray-400 text-2xl">
              {showMediumPriority ? '−' : '+'}
            </span>
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
            className="w-full text-left mb-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded-full text-sm font-bold">
                Other Options
              </span>
              <span className="text-gray-600 text-base">
                — Additional coverage to consider ({filteredLowPriority.length})
              </span>
            </div>
            <span className="text-gray-400 text-2xl">
              {showLowPriority ? '−' : '+'}
            </span>
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
        <div className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50/50">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-gray-200 text-gray-600 border border-gray-400 rounded-full text-sm font-bold">
                Not Recommended
              </span>
              <span className="text-gray-600 text-base">
                — Low relevance for your household ({nonRecommended.length})
              </span>
            </div>
            <p className="text-xs text-gray-600">
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

      {/* Bundle Discount Notice */}
      {analysis.recommendations.length >= 3 && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-2">
            <span className="text-accent text-xl flex-shrink-0">💰</span>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Bundle Discount Available</h4>
              <p className="text-sm text-gray-700">
                Many insurance providers offer a 5% discount when you purchase 3 or more add-on policies together.
                Ask your insurance agent about multi-policy discounts!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h5 className="font-semibold text-gray-900 mb-2 text-sm">Important Notes:</h5>
        <ul className="text-xs text-gray-600 space-y-1">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">•</span>
            <span>
              Costs shown are national averages adjusted for your state(s) and include family discounts where applicable.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">•</span>
            <span>
              Actual premiums vary by provider, coverage level, age, and health status. These are estimates only.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">•</span>
            <span>
              Add-on insurance recommendations are supplemental to your primary health insurance and address specific coverage gaps.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">•</span>
            <span>
              Consult with a licensed insurance agent to get personalized quotes and coverage details.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default memo(AddOnInsuranceSection);
