'use client';

interface CostItem {
  name: string;
  amount: {
    min: number;
    max: number;
  };
  required?: boolean;
  note?: string;
  tooltip?: string;
}

interface Budget {
  min: number;
  max: number;
}

interface CostBreakdownSectionProps {
  insuranceType: string;
  costs: CostItem[];
  userBudget?: Budget;
}

export default function CostBreakdownSection({
  insuranceType,
  costs,
  userBudget,
}: CostBreakdownSectionProps) {
  // Calculate total estimate
  const totalEstimate = costs.reduce(
    (acc, cost) => ({
      min: acc.min + cost.amount.min,
      max: acc.max + cost.amount.max,
    }),
    { min: 0, max: 0 }
  );

  const withinBudget = userBudget ? totalEstimate.max <= userBudget.max : null;

  const formatCostRange = (amount: { min: number; max: number }) => {
    if (amount.min === 0 && amount.max === 0) return '$0';
    if (amount.min === amount.max) return `$${amount.min.toLocaleString()}`;
    return `$${amount.min.toLocaleString()} - $${amount.max.toLocaleString()}`;
  };

  const getCostContextMessage = (type: string) => {
    const messages: Record<string, string> = {
      Medicare: 'Based on national averages. Actual costs vary by location, age, and carrier.',
      'ACA Marketplace':
        'Before subsidies. You may qualify for tax credits to reduce costs significantly.',
      Medicaid: 'Medicaid typically has $0 or minimal cost-sharing based on your income.',
      Employer: 'Based on typical employer contributions. Check with your HR for exact costs.',
    };
    return messages[type] || 'Estimated costs based on typical plans in your area.';
  };

  return (
    <section className="mt-8 md:mt-12">
      {/* Section Header */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Estimated {insuranceType} Costs
      </h2>
      <p className="text-sm md:text-base text-gray-600 mb-6">{getCostContextMessage(insuranceType)}</p>

      {/* Cost Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {costs.map((cost, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-6 shadow-sm border-2 transition-shadow hover:shadow-md ${
              idx % 2 === 0
                ? 'bg-white border-gray-200'
                : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{cost.name}</h3>
              {cost.required && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  Required
                </span>
              )}
            </div>

            <p className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
              {formatCostRange(cost.amount)}
            </p>

            {cost.note && <p className="text-xs text-gray-500 leading-relaxed">{cost.note}</p>}

            {cost.tooltip && (
              <button className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Learn more
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Total Estimate Card */}
      <div className="bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-100 rounded-2xl p-6 md:p-8 border-2 border-blue-300 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Total Cost */}
          <div>
            <p className="text-sm md:text-base font-semibold text-gray-700 mb-2">
              Estimated Total Monthly Cost
            </p>
            <p className="text-4xl md:text-5xl font-bold text-gray-900">
              {formatCostRange(totalEstimate)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Annual estimate: {formatCostRange({ min: totalEstimate.min * 12, max: totalEstimate.max * 12 })}
            </p>
          </div>

          {/* User Budget Comparison */}
          {userBudget && (
            <div className="text-left md:text-right">
              <p className="text-sm font-semibold text-gray-700 mb-2">Your Budget</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {formatCostRange(userBudget)}
              </p>
              <p className="text-sm text-gray-600 mt-1">/month</p>
            </div>
          )}
        </div>

        {/* Budget Comparison Alert */}
        {userBudget && withinBudget !== null && (
          <div
            className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${
              withinBudget
                ? 'bg-green-100 border-2 border-green-300'
                : 'bg-amber-100 border-2 border-amber-300'
            }`}
          >
            {withinBudget ? (
              <>
                <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-green-900 mb-1">Within Budget</p>
                  <p className="text-sm text-green-800">
                    This plan fits comfortably within your stated monthly budget.
                  </p>
                </div>
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6 text-amber-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 mb-1">Over Budget</p>
                  <p className="text-sm text-amber-800">
                    This plan may exceed your stated budget by ${Math.abs(totalEstimate.max - userBudget.max).toLocaleString()}/month. Consider alternatives or adjust your budget.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Subsidy Information (ACA Marketplace) */}
      {insuranceType === 'ACA Marketplace' && (
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-green-900 mb-2">💰 You May Qualify for Subsidies</p>
              <p className="text-sm text-green-800 leading-relaxed mb-3">
                Premium tax credits can significantly reduce your monthly costs. Many families see savings of
                50-80% on their monthly premiums.
              </p>
              <a
                href="https://www.healthcare.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold text-sm transition-colors"
              >
                <span>Check eligibility on Healthcare.gov</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Medicaid Low Cost Notice */}
      {insuranceType === 'Medicaid' && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-2">🎉 Minimal to No Costs</p>
              <p className="text-sm text-blue-800 leading-relaxed">
                Medicaid provides comprehensive coverage at little to no cost. Copays are typically $0-$4, and
                there are no monthly premiums for most enrollees.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
