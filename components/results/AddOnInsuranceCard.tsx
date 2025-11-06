import { memo, useState } from 'react';
import InsuranceText from '@/components/InsuranceText';
import Tooltip from '@/components/Tooltip';
import RecommendationDetailModal from './RecommendationDetailModal';
import type { AddOnRecommendation } from '@/types/addOnInsurance';
import { ADD_ON_TOOLTIPS } from '@/lib/addOnInsuranceTooltips';

interface AddOnInsuranceCardProps {
  recommendation: AddOnRecommendation;
  householdAges?: number[];
  showDetails?: boolean;
}

/**
 * Individual card for displaying an add-on insurance recommendation
 */
function AddOnInsuranceCard({
  recommendation,
  householdAges = [],
  showDetails = true,
}: AddOnInsuranceCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { insurance, priority, probabilityScore, householdCostPerMonth, applicableMembers, reasons, ageGroup } = recommendation;

  const tooltipInfo = ADD_ON_TOOLTIPS[insurance.category];

  // Priority badge styling
  const priorityStyles = {
    high: 'bg-green-600/10 text-green-600 border-green-600',
    medium: 'bg-warning/10 text-warning border-warning',
    low: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const priorityLabels = {
    high: 'Highly Recommended',
    medium: 'Consider This',
    low: 'Optional',
  };

  return (
    <div
      className={`bg-gray-50 rounded-lg p-6 border-2 transition-all ${
        priority === 'high'
          ? 'border-green-600/30 hover:border-green-600'
          : priority === 'medium'
          ? 'border-warning/30 hover:border-warning'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header with name and cost */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-4">
        <div className="flex-1 mb-3 md:mb-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xl font-bold text-gray-900">
              <Tooltip content={tooltipInfo.description} example={tooltipInfo.example}>
                <InsuranceText text={insurance.name} position="bottom" />
              </Tooltip>
            </h4>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${priorityStyles[priority]}`}
            >
              {priorityLabels[priority]}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{insurance.description}</p>
          <div className="text-xs text-gray-500">
            Recommended for: <span className="font-medium">{ageGroup}</span>
            {applicableMembers > 1 && (
              <span> • {applicableMembers} household members</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${householdCostPerMonth}
          </div>
          <div className="text-sm text-gray-600">per month</div>
          {applicableMembers > 1 && (
            <div className="text-xs text-gray-500 mt-1">
              ${recommendation.adjustedCostPerMonth} per person
            </div>
          )}
        </div>
      </div>

      {/* Probability indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Recommendation Score</span>
          <span className="font-semibold text-gray-900">{probabilityScore}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              priority === 'high'
                ? 'bg-green-600'
                : priority === 'medium'
                ? 'bg-warning'
                : 'bg-gray-400'
            }`}
            style={{ width: `${probabilityScore}%` }}
          />
        </div>
      </div>

      {/* Benefits and Coverage (collapsible in detailed view) */}
      {showDetails && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          {/* Why Recommended */}
          <div>
            <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-blue-600">💡</span>
              Why Recommended
            </h5>
            <ul className="space-y-1">
              {reasons.map((reason, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-600 flex-shrink-0 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Benefits */}
          <div>
            <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Key Benefits
            </h5>
            <ul className="space-y-1">
              {insurance.benefits.slice(0, 4).map((benefit, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0 mt-0.5">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Typical Coverage */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-xs font-semibold text-gray-600 mb-1">
              TYPICAL COVERAGE
            </div>
            <div className="text-sm text-gray-900">{insurance.typicalCoverage}</div>
          </div>

          {/* Best For */}
          <div>
            <h5 className="font-semibold text-gray-900 mb-2 text-sm">Best For:</h5>
            <div className="flex flex-wrap gap-2">
              {insurance.bestFor.map((item, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white text-xs text-gray-700 rounded-full border border-gray-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Why this recommendation button */}
          <div className="pt-3 border-t border-gray-200">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Why this recommendation?
            </button>
          </div>
        </div>
      )}

      {/* Recommendation Detail Modal */}
      {householdAges.length > 0 && (
        <RecommendationDetailModal
          recommendation={recommendation}
          householdAges={householdAges}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default memo(AddOnInsuranceCard);
