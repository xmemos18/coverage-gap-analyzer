import { formatCost } from '@/lib/results-utils';
import { CostRange } from '@/types';

interface CostComparison {
  current: number;
  recommended: CostRange;
  monthlySavings?: number;
  annualSavings?: number;
}

interface CurrentInsuranceComparisonProps {
  currentInsuranceSummary: string;
  costComparison: CostComparison;
  improvementAreas?: string[];
}

export default function CurrentInsuranceComparison({
  currentInsuranceSummary,
  costComparison,
  improvementAreas,
}: CurrentInsuranceComparisonProps) {
  const hasSavings = costComparison.monthlySavings && costComparison.monthlySavings > 0;

  return (
    <section className="mb-8 md:mb-12">
      {/* Premium Gradient Header */}
      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 px-6 py-12 md:px-12 md:py-14">
        <div className="relative z-10">
          {/* Section Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-3xl shadow-lg">
              📊
            </div>
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-white">
                Compare Your Coverage
              </h3>
              <p className="text-purple-100 text-sm md:text-base mt-1">
                See how your current plan stacks up
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
      <div className="rounded-b-3xl bg-white px-6 py-8 md:px-12 md:py-12 shadow-lg">
        {/* Current Insurance Summary Card */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"></div>
            <h4 className="text-xl font-bold text-gray-900">Your Current Coverage</h4>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 p-6 md:p-8 border-2 border-amber-200 shadow-md">
            {/* Current Plan Badge */}
            <div className="absolute top-4 right-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
              CURRENT
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(245, 158, 11) 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}></div>

            <div className="relative z-10">
              <p className="text-base md:text-lg leading-relaxed text-gray-800">
                {currentInsuranceSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Cost Comparison Cards */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
            <h4 className="text-xl font-bold text-gray-900">Side-by-Side Comparison</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Cost Card */}
            <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 text-2xl shadow-md mb-4">
                💼
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Current Monthly Cost
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                ${costComparison.current.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">per month</div>
            </div>

            {/* Recommended Cost Card */}
            <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
              {/* Recommended Badge */}
              <div className="absolute top-4 right-4 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                RECOMMENDED
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl shadow-md mb-4">
                ⭐
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                Recommended Monthly Cost
              </div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">
                {formatCost(costComparison.recommended.low, costComparison.recommended.high)}
              </div>
              <div className="text-sm text-gray-600">per month</div>
            </div>

            {/* Savings Card */}
            {hasSavings && (
              <div className="group relative overflow-hidden rounded-2xl border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-2xl shadow-md mb-4">
                  💰
                </div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                  Potential Savings
                </div>
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1">
                  ${Math.round(costComparison.monthlySavings!).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  per month
                </div>
                <div className="mt-3 rounded-lg bg-green-100 border border-green-200 px-3 py-2">
                  <div className="text-xs font-semibold text-green-800">
                    💵 ${Math.round(costComparison.annualSavings || 0).toLocaleString()}/year saved
                  </div>
                </div>
              </div>
            )}

            {/* No Savings Message */}
            {!hasSavings && (
              <div className="group relative overflow-hidden rounded-2xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 text-2xl shadow-md mb-4">
                  ✨
                </div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                  Coverage Upgrade
                </div>
                <div className="text-lg font-bold text-purple-900 mb-2">
                  Better Protection
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  Our recommendation may cost similar but provides enhanced coverage for your needs
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Improvement Areas */}
        {improvementAreas && improvementAreas.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 p-6 md:p-8 border-l-4 border-amber-500 shadow-md">
            {/* Icon */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl shadow-md">
                🎯
              </div>
              <h4 className="text-xl font-bold text-gray-900">
                Areas We Can Improve
              </h4>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(245, 158, 11) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3">
              {improvementAreas.map((area, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-amber-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-800">
                    {area}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
