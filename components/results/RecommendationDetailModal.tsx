'use client';

import { memo, useEffect } from 'react';
import type { AddOnRecommendation } from '@/types/addOnInsurance';
import { getAgeSpecificInsights } from '@/lib/addOnInsuranceTooltips';

interface RecommendationDetailModalProps {
  recommendation: AddOnRecommendation;
  householdAges: number[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal showing detailed age-specific insights for insurance recommendations
 */
function RecommendationDetailModal({
  recommendation,
  householdAges,
  isOpen,
  onClose
}: RecommendationDetailModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { insurance, priority, probabilityScore, householdCostPerMonth, reasons } = recommendation;

  // Get age-specific insights for the oldest household member (highest risk)
  const oldestAge = Math.max(...householdAges);
  const insights = getAgeSpecificInsights(insurance.category, oldestAge);

  // Priority styling
  const priorityStyles = {
    high: 'bg-success/10 text-success border-success',
    medium: 'bg-warning/10 text-warning border-warning',
    low: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const priorityLabels = {
    high: 'Highly Recommended',
    medium: 'Consider This',
    low: 'Optional',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Modal content */}
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                {insurance.name}
              </h2>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${priorityStyles[priority]}`}>
                {priorityLabels[priority]}
              </span>
            </div>
            <p className="text-gray-600">{insurance.description}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score and Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Recommendation Score</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-gray-900">{probabilityScore}%</div>
                <div className="text-sm text-gray-600">match for your household</div>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    priority === 'high' ? 'bg-success' :
                    priority === 'medium' ? 'bg-warning' : 'bg-gray-400'
                  }`}
                  style={{ width: `${probabilityScore}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Estimated Monthly Cost</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-gray-900">${householdCostPerMonth}</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
              {recommendation.applicableMembers > 1 && (
                <div className="mt-2 text-xs text-gray-600">
                  ${recommendation.adjustedCostPerMonth} per person × {recommendation.applicableMembers} members
                </div>
              )}
            </div>
          </div>

          {/* Key Factor */}
          <div className="bg-accent/10 border-l-4 border-accent rounded-r-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-accent text-xl">🎯</span>
              {insights.keyFactor}
            </h3>
            <div className="space-y-2">
              {insights.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-accent flex-shrink-0 mt-0.5">•</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Why Recommended for Your Household */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-success text-xl">💡</span>
              Why Recommended for Your Household
            </h3>
            <ul className="space-y-2">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  <span className="text-success flex-shrink-0 mt-0.5">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Statistics */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Key Statistics
            </h3>
            <ul className="space-y-2">
              {insights.statistics.map((stat, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-accent flex-shrink-0 mt-1">▸</span>
                  <span>{stat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Benefits */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-xl">✨</span>
              Key Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insurance.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-success/5 rounded-lg p-3 border border-success/20">
                  <span className="text-success flex-shrink-0 mt-0.5">✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Typical Coverage */}
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Typical Coverage Example</h4>
            <p className="text-sm text-gray-700">{insurance.typicalCoverage}</p>
          </div>

          {/* Best For */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Best For:</h4>
            <div className="flex flex-wrap gap-2">
              {insurance.bestFor.map((item, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full border border-accent/20 font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <strong>Next step:</strong> Consult with a licensed insurance agent for personalized quotes
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-light transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(RecommendationDetailModal);
