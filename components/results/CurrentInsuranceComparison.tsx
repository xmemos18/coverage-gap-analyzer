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

// Helper function to categorize improvement areas
const categorizeImprovement = (area: string): { icon: string; category: string; priority: 'high' | 'medium' | 'low' } => {
  const lowerArea = area.toLowerCase();

  if (lowerArea.includes('coverage') || lowerArea.includes('gap') || lowerArea.includes('benefit')) {
    return { icon: '🏥', category: 'Coverage', priority: 'high' };
  }
  if (lowerArea.includes('cost') || lowerArea.includes('price') || lowerArea.includes('premium') || lowerArea.includes('expensive')) {
    return { icon: '💰', category: 'Cost', priority: 'high' };
  }
  if (lowerArea.includes('network') || lowerArea.includes('provider') || lowerArea.includes('doctor')) {
    return { icon: '🌐', category: 'Network', priority: 'medium' };
  }
  if (lowerArea.includes('deductible') || lowerArea.includes('out-of-pocket') || lowerArea.includes('copay')) {
    return { icon: '📊', category: 'Deductible', priority: 'medium' };
  }

  return { icon: '✨', category: 'Benefits', priority: 'low' };
};

export default function CurrentInsuranceComparison({
  currentInsuranceSummary,
  costComparison,
  improvementAreas,
}: CurrentInsuranceComparisonProps) {
  const hasSavings = costComparison.monthlySavings && costComparison.monthlySavings > 0;
  const savingsPercentage = hasSavings
    ? Math.round((costComparison.monthlySavings! / costComparison.current) * 100)
    : 0;
  const fiveYearSavings = hasSavings
    ? Math.round((costComparison.annualSavings || 0) * 5)
    : 0;

  // Categorize improvements
  const categorizedImprovements = improvementAreas?.map(area => ({
    text: area,
    ...categorizeImprovement(area)
  })) || [];

  const highPriorityCount = categorizedImprovements.filter(i => i.priority === 'high').length;

  return (
    <section className="mb-12 md:mb-16 animate-fadeIn">
      {/* Premium Gradient Header */}
      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 px-6 py-12 md:px-12 md:py-16">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(255, 255, 255) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative z-10">
          {/* Section Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-4xl shadow-xl rotate-3 hover:rotate-6 transition-transform duration-300 cursor-pointer">
              📊
            </div>
            <div className="flex-1">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Compare Your Coverage
              </h3>
              <p className="text-purple-100 text-sm md:text-base">
                See how your current plan stacks up against our recommendation
              </p>
            </div>

            {/* Coverage Change Indicator Badge */}
            {hasSavings && (
              <div className="hidden md:flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/30">
                <div className="text-xs font-semibold text-purple-100 uppercase tracking-wide mb-1">
                  Potential Savings
                </div>
                <div className="text-3xl font-bold text-white">
                  {savingsPercentage}%
                </div>
              </div>
            )}
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
        {/* Current Insurance Summary Card */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"></div>
            <h4 className="text-2xl md:text-3xl font-bold text-gray-900">Your Current Coverage</h4>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 p-8 md:p-12 border-2 border-amber-200 shadow-xl">
            {/* Current Plan Badge */}
            <div className="absolute top-6 right-6 md:top-8 md:right-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            {/* Decorative Quote Mark - Top Left */}
            <div className="absolute -top-4 -left-4 text-8xl md:text-9xl font-serif text-amber-200 opacity-30 leading-none select-none">
              &ldquo;
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(245, 158, 11) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}></div>

            <div className="relative z-10 pt-4">
              <div className="prose prose-lg md:prose-xl max-w-none">
                <p className="text-lg md:text-xl leading-relaxed text-gray-800 font-medium">
                  {currentInsuranceSummary}
                </p>
              </div>
            </div>

            {/* Decorative Quote Mark - Bottom Right */}
            <div className="absolute -bottom-4 -right-4 text-8xl md:text-9xl font-serif text-amber-200 opacity-30 leading-none select-none rotate-180">
              &rdquo;
            </div>
          </div>
        </div>

        {/* Cost Comparison Cards */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
            <h4 className="text-2xl md:text-3xl font-bold text-gray-900">Side-by-Side Comparison</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Current Cost Card */}
            <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 md:p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              {/* Subtle Background Pattern */}
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgb(107, 114, 128) 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }}></div>

              <div className="relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 text-3xl shadow-md mb-6 rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  💼
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Current Monthly Cost
                </div>
                <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                  ${costComparison.current.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-gray-600">per month</div>

                {/* Visual Cost Bar */}
                <div className="mt-6 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gray-400 to-gray-600 w-full"></div>
                </div>
              </div>
            </div>

            {/* Recommended Cost Card */}
            <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              {/* Recommended Badge */}
              <div className="absolute top-6 right-6">
                <div className="rounded-full bg-blue-500 px-4 py-1.5 text-xs font-bold text-white shadow-md">
                  RECOMMENDED
                </div>
              </div>

              {/* Subtle Background Pattern */}
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59, 130, 246) 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }}></div>

              <div className="relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl shadow-md mb-6 rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  ⭐
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                  Recommended Monthly Cost
                </div>
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {formatCost(costComparison.recommended.low, costComparison.recommended.high)}
                </div>
                <div className="text-sm font-medium text-gray-600">per month</div>

                {/* Visual Cost Bar */}
                <div className="mt-6 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{
                    width: `${Math.min(100, ((costComparison.recommended.low + costComparison.recommended.high) / 2 / costComparison.current) * 100)}%`
                  }}></div>
                </div>
              </div>

              {/* Comparison Arrow */}
              {hasSavings && (
                <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-green-500 shadow-lg">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </div>

            {/* Savings Card */}
            {hasSavings && (
              <div className="group relative overflow-hidden rounded-2xl border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 p-6 md:p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                {/* Savings Badge */}
                <div className="absolute top-6 right-6">
                  <div className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md">
                    SAVE {savingsPercentage}%
                  </div>
                </div>

                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgb(34, 197, 94) 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}></div>

                <div className="relative z-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-3xl shadow-md mb-6 rotate-3 group-hover:rotate-6 transition-transform duration-300">
                    💰
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                    Your Monthly Savings
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                    ${Math.round(costComparison.monthlySavings!).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-600 mb-6">
                    per month
                  </div>

                  {/* Annual Savings Callout */}
                  <div className="rounded-xl bg-white/80 backdrop-blur-sm border-2 border-green-200 p-4 mb-4 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600">Annual Savings</span>
                      <span className="text-2xl font-bold text-green-700">
                        ${Math.round(costComparison.annualSavings || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full"></div>
                    </div>
                  </div>

                  {/* 5-Year Projection */}
                  <div className="rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs font-bold text-green-800">
                        5-Year Total: ${fiveYearSavings.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Savings - Coverage Upgrade Card */}
            {!hasSavings && (
              <div className="group relative overflow-hidden rounded-2xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 md:p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                {/* Value Badge */}
                <div className="absolute top-6 right-6">
                  <div className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md">
                    BETTER VALUE
                  </div>
                </div>

                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgb(168, 85, 247) 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}></div>

                <div className="relative z-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 text-3xl shadow-md mb-6 rotate-3 group-hover:rotate-6 transition-transform duration-300">
                    ✨
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                    Coverage Upgrade
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-purple-900 mb-4">
                    Better Protection
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed mb-6">
                    While costs are similar, our recommendation provides enhanced coverage tailored to your needs
                  </div>

                  {/* Upgrade Benefits */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 flex-shrink-0 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Improved coverage benefits</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 flex-shrink-0 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Better suited to your situation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 flex-shrink-0 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Enhanced peace of mind</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Insight Callout */}
        {hasSavings && costComparison.monthlySavings! >= 50 && (
          <div className="mb-12 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 md:p-10 shadow-xl border-2 border-blue-200">
            <div className="flex items-start gap-6">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-gray-900 text-2xl mb-3">Key Insight</h5>
                <p className="text-lg text-gray-800 leading-relaxed">
                  By switching to our recommended plan, you could save <span className="font-bold text-blue-600">${Math.round(costComparison.monthlySavings!).toLocaleString()}/month</span> while maintaining or improving your coverage. That&apos;s <span className="font-bold text-green-600">${Math.round(costComparison.annualSavings || 0).toLocaleString()}</span> back in your pocket each year.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Improvement Areas */}
        {improvementAreas && improvementAreas.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 p-8 md:p-10 border-l-4 border-amber-500 shadow-xl">
            {/* Icon and Title */}
            <div className="flex items-center justify-between gap-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-3xl shadow-md rotate-3 hover:rotate-6 transition-transform duration-300 cursor-pointer">
                  🎯
                </div>
                <h4 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Areas We Can Improve
                </h4>
              </div>

              {/* Count Badge */}
              {highPriorityCount > 0 && (
                <div className="flex items-center gap-2 bg-red-100 border-2 border-red-300 rounded-full px-4 py-2 shadow-sm">
                  <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-bold text-red-900">
                    {highPriorityCount} Critical {highPriorityCount === 1 ? 'Area' : 'Areas'}
                  </span>
                </div>
              )}
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(245, 158, 11) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorizedImprovements.map((item, index) => {
                const priorityColors = {
                  high: {
                    border: 'border-red-300',
                    bg: 'bg-red-50',
                    icon: 'text-red-600',
                    badge: 'bg-red-100 text-red-800 border-red-300'
                  },
                  medium: {
                    border: 'border-orange-300',
                    bg: 'bg-orange-50',
                    icon: 'text-orange-600',
                    badge: 'bg-orange-100 text-orange-800 border-orange-300'
                  },
                  low: {
                    border: 'border-amber-200',
                    bg: 'bg-white',
                    icon: 'text-amber-600',
                    badge: 'bg-amber-100 text-amber-800 border-amber-200'
                  }
                };

                const colors = priorityColors[item.priority];

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${colors.bg} rounded-xl px-4 py-4 border-2 ${colors.border} shadow-md hover:shadow-lg transition-all duration-200 ${
                      item.priority === 'high' ? 'md:col-span-2' : ''
                    }`}
                  >
                    <div className={`text-2xl flex-shrink-0 ${colors.icon}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">
                          {item.text}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${colors.badge}`}>
                          {item.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {item.category}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
