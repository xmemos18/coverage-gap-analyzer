'use client';

import { useState } from 'react';
import { getMarketplaceEnrollmentUrl, getMarketplaceName } from '@/lib/enrollmentUrls';

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
  zipCode?: string;
  state?: string;
}

export default function MarketplacePlans({ plans, zipCode, state }: MarketplacePlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'premium' | 'deductible' | 'rating'>('premium');
  const marketplaceName = getMarketplaceName(state);

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

  // Premium metal level gradients and styling
  const metalColors: Record<string, {
    gradient: string;
    badgeGradient: string;
    text: string;
    border: string;
    iconBg: string;
  }> = {
    Bronze: {
      gradient: 'from-orange-600 via-amber-600 to-orange-700',
      badgeGradient: 'from-orange-500 to-amber-600',
      text: 'text-amber-800',
      border: 'border-amber-300',
      iconBg: 'bg-amber-100'
    },
    Silver: {
      gradient: 'from-gray-600 via-slate-600 to-gray-700',
      badgeGradient: 'from-gray-500 to-slate-600',
      text: 'text-slate-800',
      border: 'border-slate-300',
      iconBg: 'bg-slate-100'
    },
    Gold: {
      gradient: 'from-yellow-600 via-amber-500 to-yellow-600',
      badgeGradient: 'from-yellow-500 to-amber-600',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      iconBg: 'bg-yellow-100'
    },
    Platinum: {
      gradient: 'from-purple-600 via-indigo-600 to-purple-700',
      badgeGradient: 'from-purple-500 to-indigo-600',
      text: 'text-purple-800',
      border: 'border-purple-300',
      iconBg: 'bg-purple-100'
    },
    Catastrophic: {
      gradient: 'from-red-600 via-rose-600 to-red-700',
      badgeGradient: 'from-red-500 to-rose-600',
      text: 'text-red-800',
      border: 'border-red-300',
      iconBg: 'bg-red-100'
    },
  };

  const getMetalColor = (level: string): {
    gradient: string;
    badgeGradient: string;
    text: string;
    border: string;
    iconBg: string;
  } => metalColors[level] ?? metalColors.Silver ?? {
    gradient: 'from-gray-600 via-slate-600 to-gray-700',
    badgeGradient: 'from-gray-500 to-slate-600',
    text: 'text-slate-800',
    border: 'border-slate-300',
    iconBg: 'bg-slate-100'
  };

  return (
    <div className="space-y-8">
      {/* Premium Header with Healthcare.gov branding */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 py-8 md:px-8 md:py-10 shadow-xl">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        ></div>

        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Healthcare.gov badge */}
            <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-3xl md:text-4xl shadow-xl rotate-3 hover:rotate-6 transition-transform duration-300">
              🏥
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
                Real Marketplace Plans
              </h3>
              <p className="text-sm md:text-base text-blue-100">
                Showing {plans.length} plan{plans.length !== 1 ? 's' : ''} available in your area
              </p>
            </div>
          </div>

          {/* Premium Sort Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="sort-plans" className="text-sm font-semibold text-white whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="sort-plans"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="flex-1 sm:flex-none px-4 py-2.5 border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-white focus:border-white transition-all hover:bg-white/20 cursor-pointer"
            >
              <option value="premium" className="text-gray-900">💰 Premium (Low to High)</option>
              <option value="deductible" className="text-gray-900">🏥 Deductible (Low to High)</option>
              <option value="rating" className="text-gray-900">⭐ Quality Rating (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const metalColor = getMetalColor(plan.metalLevel);
          const hasSubsidy = plan.premiumAfterCredit && plan.premiumAfterCredit < plan.premium;
          const subsidySavings = hasSubsidy ? plan.premium - plan.premiumAfterCredit! : 0;

          return (
            <div
              key={plan.id}
              className={`
                group relative border-2 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer
                ${isSelected
                  ? 'border-blue-600 shadow-2xl scale-[1.02] ring-4 ring-blue-100'
                  : 'border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1'
                }
              `}
              onClick={() => setSelectedPlan(isSelected ? null : plan.id)}
            >
              {/* Premium Metal Level Header with gradient */}
              <div className={`relative overflow-hidden bg-gradient-to-br ${metalColor.gradient} px-5 py-6`}>
                {/* Subtle pattern overlay */}
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '30px 30px'
                  }}
                ></div>

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Metal level badge with gradient */}
                      <span className={`px-3 py-1.5 bg-gradient-to-r ${metalColor.badgeGradient} text-white border-2 border-white/30 rounded-lg text-xs font-bold shadow-lg`}>
                        {plan.metalLevel}
                      </span>
                      <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-lg text-xs font-semibold">
                        {plan.type}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-1 drop-shadow-md">{plan.name}</h4>

                    {/* Issuer badge with rotating icon */}
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-sm rotate-2 group-hover:rotate-6 transition-transform duration-300">
                        🏢
                      </div>
                      <p className="text-sm text-white/90 font-medium">{plan.issuer}</p>
                    </div>
                  </div>

                  {/* Premium Quality Rating */}
                  {plan.qualityRating && (
                    <div className="flex flex-col items-center bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 border-2 border-white/50 shadow-lg">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl bg-gradient-to-br from-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow">⭐</span>
                        <span className="text-xl font-bold bg-gradient-to-br from-amber-600 to-yellow-700 bg-clip-text text-transparent">
                          {plan.qualityRating}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 font-semibold mt-0.5">Quality</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Premium Card Body */}
              <div className="p-6 bg-white space-y-5">
                {/* Premium Pricing Display */}
                <div className="relative">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                      ${hasSubsidy ? plan.premiumAfterCredit!.toFixed(2) : plan.premium.toFixed(2)}
                    </span>
                    <span className="text-lg text-gray-600 font-medium">/month</span>
                  </div>

                  {/* Premium Subsidy Savings Callout */}
                  {hasSubsidy && (
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-4 mt-3">
                      <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                          backgroundImage: `radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)`,
                          backgroundSize: '20px 20px'
                        }}
                      ></div>
                      <div className="relative flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xl shadow-lg rotate-3">
                          💰
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-700 mb-0.5">
                            <span className="line-through">${plan.premium.toFixed(2)}/mo</span>
                            <span className="mx-2">→</span>
                            <span className="font-bold text-green-700">${plan.premiumAfterCredit!.toFixed(2)}/mo</span>
                          </div>
                          <div className="text-xs font-semibold text-green-800">
                            Save ${subsidySavings.toFixed(2)}/month (${(subsidySavings * 12).toFixed(0)}/year) with tax credit
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Premium Key Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 p-4">
                    <div className="text-sm font-semibold text-gray-600 mb-1">Annual Deductible</div>
                    <div className="text-xl font-bold text-gray-900">
                      ${plan.deductible.toLocaleString()}
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 p-4">
                    <div className="text-sm font-semibold text-gray-600 mb-1">Out-of-Pocket Max</div>
                    <div className="text-xl font-bold text-gray-900">
                      ${plan.outOfPocketMax.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Premium Feature Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {plan.hasNationalNetwork && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-800 rounded-xl text-sm font-semibold shadow-sm">
                      <span className="rotate-3">🌎</span>
                      National Network
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-shadow">
                    <span className="rotate-3">📋</span>
                    Full Benefits
                  </span>
                </div>

                {/* Premium Expanded Details */}
                {isSelected && (
                  <div className="pt-5 border-t-2 border-gray-200 space-y-4 animate-fadeIn">
                    {/* Next Steps Card */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 p-5">
                      <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                          backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
                          backgroundSize: '20px 20px'
                        }}
                      ></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg shadow-md rotate-3">
                            📋
                          </div>
                          <h5 className="text-base font-bold text-blue-900">Next Steps to Enroll</h5>
                        </div>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2 text-sm text-blue-800">
                            <span className="text-blue-500 font-bold mt-0.5">✓</span>
                            <span>Visit Healthcare.gov to see full plan details and benefits</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm text-blue-800">
                            <span className="text-blue-500 font-bold mt-0.5">✓</span>
                            <span>Check if your doctors and hospitals are in-network</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm text-blue-800">
                            <span className="text-blue-500 font-bold mt-0.5">✓</span>
                            <span>Review prescription drug coverage and pharmacy network</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm text-blue-800">
                            <span className="text-blue-500 font-bold mt-0.5">✓</span>
                            <span>Compare total cost of care including copays and deductibles</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Premium Enroll Button */}
                    <a
                      href={getMarketplaceEnrollmentUrl(state, zipCode, plan.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn relative block w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-4 text-center font-bold text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative flex items-center justify-center gap-2">
                        <span className="text-lg">
                          {zipCode && state ? `View & Enroll via ${marketplaceName}` : `Enroll on ${marketplaceName}`}
                        </span>
                        <span className="text-xl transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium Footer Note */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 p-6 shadow-md">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}
        ></div>
        <div className="relative flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl shadow-sm rotate-2">
            ℹ️
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900 mb-1">Important Information</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              These are real marketplace plans available in your ZIP code. Premiums shown reflect your household size and income. Click any plan to see enrollment instructions. Final costs may vary based on tobacco use and exact birth dates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
