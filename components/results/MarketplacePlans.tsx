'use client';

import { useState } from 'react';

interface MarketplacePlan {
  id: string;
  name: string;
  issuer: string;
  type: string;
  metalLevel: string;
  premium: number;
  premiumAfterCredit?: number;
  deductible: number;
  outOfPocketMax: number;
  qualityRating?: number;
  hasNationalNetwork: boolean;
}

interface MarketplacePlansProps {
  plans: MarketplacePlan[];
}

export default function MarketplacePlans({ plans }: MarketplacePlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'premium' | 'deductible' | 'rating'>('premium');

  // Sort plans based on selected criteria
  const sortedPlans = [...plans].sort((a, b) => {
    switch (sortBy) {
      case 'premium':
        const aPremium = a.premiumAfterCredit || a.premium;
        const bPremium = b.premiumAfterCredit || b.premium;
        return aPremium - bPremium;
      case 'deductible':
        return a.deductible - b.deductible;
      case 'rating':
        const aRating = a.qualityRating || 0;
        const bRating = b.qualityRating || 0;
        return bRating - aRating;
      default:
        return 0;
    }
  });

  // Metal level colors
  const metalColors: Record<string, { bg: string; text: string; border: string }> = {
    Bronze: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    Silver: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' },
    Gold: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
    Platinum: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300' },
    Catastrophic: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  const getMetalColor = (level: string) => metalColors[level] || metalColors.Silver;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Real Marketplace Plans</h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing {plans.length} plan{plans.length !== 1 ? 's' : ''} available in your area
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-plans" className="text-sm font-medium text-gray-700">
            Sort by:
          </label>
          <select
            id="sort-plans"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="premium">💰 Premium (Low to High)</option>
            <option value="deductible">🏥 Deductible (Low to High)</option>
            <option value="rating">⭐ Quality Rating (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const metalColor = getMetalColor(plan.metalLevel);
          const hasSubsidy = plan.premiumAfterCredit && plan.premiumAfterCredit < plan.premium;

          return (
            <div
              key={plan.id}
              className={`
                border-2 rounded-xl overflow-hidden transition-all cursor-pointer
                ${isSelected ? 'border-blue-600 shadow-lg scale-[1.02]' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}
              `}
              onClick={() => setSelectedPlan(isSelected ? null : plan.id)}
            >
              {/* Header */}
              <div className={`${metalColor.bg} ${metalColor.border} border-b-2 p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 ${metalColor.bg} ${metalColor.text} ${metalColor.border} border rounded-md text-xs font-semibold`}>
                        {plan.metalLevel}
                      </span>
                      <span className="px-2 py-1 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700">
                        {plan.type}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                    <p className="text-sm text-gray-600">by {plan.issuer}</p>
                  </div>

                  {/* Quality Rating */}
                  {plan.qualityRating && (
                    <div className="flex flex-col items-center bg-white rounded-lg px-3 py-2 border border-gray-300">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-lg font-bold text-gray-900">{plan.qualityRating}</span>
                      </div>
                      <span className="text-xs text-gray-600">Rating</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 bg-white space-y-4">
                {/* Premium */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-600">
                      ${hasSubsidy ? plan.premiumAfterCredit!.toFixed(2) : plan.premium.toFixed(2)}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  {hasSubsidy && (
                    <div className="mt-1">
                      <span className="text-sm text-gray-500 line-through">${plan.premium.toFixed(2)}</span>
                      <span className="ml-2 text-sm font-medium text-green-600">
                        Save ${(plan.premium - plan.premiumAfterCredit!).toFixed(2)}/mo with tax credit
                      </span>
                    </div>
                  )}
                </div>

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-sm text-gray-600">Annual Deductible</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${plan.deductible.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Out-of-Pocket Max</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${plan.outOfPocketMax.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  {plan.hasNationalNetwork && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      🌎 National Network
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm">
                    📋 View Full Benefits
                  </span>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="pt-4 border-t border-gray-200 space-y-3 animate-fadeIn">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h5 className="text-sm font-semibold text-blue-900 mb-2">📋 Next Steps:</h5>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Visit Healthcare.gov to see full plan details</li>
                        <li>• Check if your doctors are in-network</li>
                        <li>• Review prescription drug coverage</li>
                        <li>• Compare total cost of care (not just premiums)</li>
                      </ul>
                    </div>

                    <a
                      href={`https://www.healthcare.gov/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Enroll on Healthcare.gov →
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> These are real marketplace plans available in your ZIP code.
          Premiums shown reflect your household size and income. Click any plan to see enrollment
          instructions. Final costs may vary based on tobacco use and exact birth dates.
        </p>
      </div>
    </div>
  );
}
