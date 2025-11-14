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
      className={`relative overflow-hidden rounded-xl p-6 md:p-8 border-2 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 ${
        priority === 'high'
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-600'
          : priority === 'medium'
          ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-warning'
          : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}
      ></div>

      {/* Premium Header with name and cost */}
      <div className="relative flex flex-col md:flex-row justify-between items-start mb-5">
        <div className="flex-1 mb-4 md:mb-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h4 className="text-xl md:text-2xl font-bold text-gray-900">
              <Tooltip content={tooltipInfo.description} example={tooltipInfo.example}>
                <InsuranceText text={insurance.name} position="bottom" />
              </Tooltip>
            </h4>
            <span
              className={`px-4 py-1.5 text-xs font-bold rounded-xl border-2 shadow-sm ${priorityStyles[priority]}`}
            >
              {priorityLabels[priority]}
            </span>
          </div>
          <p className="text-sm md:text-base text-gray-700 mb-3 leading-relaxed font-medium">{insurance.description}</p>
          <div className="text-xs md:text-sm text-gray-600 font-medium">
            Recommended for: <span className="font-bold text-gray-900">{ageGroup}</span>
            {applicableMembers > 1 && (
              <span> • {applicableMembers} household members</span>
            )}
          </div>
        </div>

        <div className="text-right bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
          <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-gray-900 to-slate-800 bg-clip-text text-transparent">
            ${householdCostPerMonth}
          </div>
          <div className="text-sm text-gray-600 font-semibold">per month</div>
          {applicableMembers > 1 && (
            <div className="text-xs text-gray-500 mt-2 font-medium">
              ${recommendation.adjustedCostPerMonth} per person
            </div>
          )}
        </div>
      </div>

      {/* Premium Probability indicator */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-700 font-semibold">Recommendation Score</span>
          <span className="font-bold text-gray-900 text-base">{probabilityScore}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
          <div
            className={`h-3 rounded-full transition-all shadow-sm ${
              priority === 'high'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                : priority === 'medium'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600'
                : 'bg-gradient-to-r from-gray-400 to-slate-500'
            }`}
            style={{ width: `${probabilityScore}%` }}
          />
        </div>
      </div>

      {/* Premium Benefits and Coverage (collapsible in detailed view) */}
      {showDetails && (
        <div className="relative space-y-5 border-t-2 border-gray-200 pt-6">
          {/* Premium Why Recommended */}
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm shadow-sm rotate-3">
                💡
              </div>
              Why Recommended
            </h5>
            <ul className="space-y-2">
              {reasons.map((reason, i) => (
                <li key={i} className="text-sm text-gray-800 flex items-start gap-2.5 leading-relaxed">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="font-medium">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Key Benefits */}
          <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
            <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm shadow-sm rotate-3">
                ✓
              </div>
              Key Benefits
            </h5>
            <ul className="space-y-2">
              {insurance.benefits.slice(0, 4).map((benefit, i) => (
                <li key={i} className="text-sm text-gray-800 flex items-start gap-2.5 leading-relaxed">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Typical Coverage */}
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
              Typical Coverage
            </div>
            <div className="text-sm text-gray-900 leading-relaxed font-medium">{insurance.typicalCoverage}</div>
          </div>

          {/* Premium Best For */}
          <div>
            <h5 className="font-bold text-gray-900 mb-3 text-sm">Best For:</h5>
            <div className="flex flex-wrap gap-2">
              {insurance.bestFor.map((item, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-white text-xs font-semibold text-gray-700 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Premium Why this recommendation button */}
          <div className="pt-4 border-t-2 border-gray-200">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-lg text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
