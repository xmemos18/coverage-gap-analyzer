'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { InsuranceRecommendation, CalculatorFormData } from '@/types';
import { calculateScoreBreakdown, getConfidenceDetails } from '@/lib/scoreBreakdown';

interface EnhancedWhyRecommendationProps {
  recommendation: InsuranceRecommendation;
  formData: CalculatorFormData;
  currentInsuranceCost?: number;
}

export default function EnhancedWhyRecommendation({
  recommendation,
  formData,
  currentInsuranceCost,
}: EnhancedWhyRecommendationProps) {
  // Calculate score breakdown for visualization
  const scoreBreakdown = useMemo(
    () => calculateScoreBreakdown(recommendation, formData),
    [recommendation, formData]
  );

  const confidenceDetails = useMemo(
    () => getConfidenceDetails(recommendation.coverageGapScore),
    [recommendation.coverageGapScore]
  );

  // Prepare chart data
  const chartData = scoreBreakdown.categories.map(cat => ({
    name: cat.name,
    value: cat.score,
    color: cat.color,
  }));

  // Get alternative plans for comparison
  const topAlternative = recommendation.alternativeOptions?.[0];

  return (
    <section className="mt-6 md:mt-8">
      {/* Premium Gradient Header with Score Visualization */}
      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 px-6 py-12 md:px-12 md:py-16">
        <div className="relative z-10 grid gap-8 md:grid-cols-2 md:gap-12">
          {/* Left: Title and Tagline */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Why This Recommendation?
            </h2>
            <p className="mt-3 text-lg text-blue-100 md:text-xl">
              Personalized analysis based on your household situation and coverage needs
            </p>

            {/* Confidence Indicator */}
            <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/20 backdrop-blur-sm px-5 py-2.5 w-fit">
              <div className={`h-3 w-3 rounded-full bg-${confidenceDetails.color}-400 shadow-lg`}></div>
              <span className="text-sm font-semibold text-white">{confidenceDetails.label}</span>
            </div>
          </div>

          {/* Right: Score Breakdown Chart */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              {/* Chart Container */}
              <ResponsiveContainer width={280} height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => {
                      // Parse gradient color to solid color for chart
                      const colorMap: { [key: string]: string } = {
                        'from-green-400 to-green-600': '#22c55e',
                        'from-blue-400 to-blue-600': '#3b82f6',
                        'from-indigo-400 to-indigo-600': '#6366f1',
                        'from-purple-400 to-purple-600': '#a855f7',
                      };
                      return (
                        <Cell key={`cell-${index}`} fill={colorMap[entry.color] || '#3b82f6'} />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Score Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl font-bold text-white">{scoreBreakdown.totalScore}</div>
                <div className="text-sm font-medium text-blue-100">out of 100</div>
              </div>
            </div>

            {/* Score Legend */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              {scoreBreakdown.categories.map((category) => (
                <div key={category.name} className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-lg">
                    {category.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{category.name}</div>
                    <div className="text-sm font-bold text-blue-100">
                      {category.score}/{category.maxScore}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Curved Bottom Edge (SVG Wave) */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 0L60 10C120 20 240 40 360 45C480 50 600 40 720 35C840 30 960 30 1080 35C1200 40 1320 50 1380 55L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Main Content Area (White Background) */}
      <div className="rounded-b-3xl bg-white px-6 py-8 md:px-12 md:py-12 shadow-lg">
        {/* Full Explanation Section - Featured Quote Card */}
        <div className="mb-12 animate-fadeIn">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full"></div>
            <h3 className="text-3xl font-bold text-gray-900">Why We Chose This</h3>
          </div>

          {/* Featured Quote Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 md:p-12 shadow-xl border-2 border-blue-100">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59, 130, 246) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}></div>

            {/* Decorative Quote Mark - Top Left */}
            <div className="absolute -top-4 -left-4 text-8xl md:text-9xl font-serif text-blue-200 opacity-30 leading-none select-none">
              &ldquo;
            </div>

            {/* Premium Badge - Top Right */}
            <div className="absolute top-6 right-6 md:top-8 md:right-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Quote Content */}
            <div className="relative z-10 pt-8">
              <div className="prose prose-lg md:prose-xl max-w-none">
                <p className="text-lg md:text-xl leading-relaxed text-gray-800 font-medium">
                  {recommendation.reasoning.split('.').map((sentence, idx) => {
                    if (!sentence.trim()) return null;
                    // Highlight key phrases
                    const isFirstSentence = idx === 0;
                    return (
                      <span key={idx} className={isFirstSentence ? 'text-gray-900 font-semibold' : ''}>
                        {sentence.trim()}.{' '}
                      </span>
                    );
                  })}
                </p>
              </div>

              {/* Key Highlight Callout */}
              <div className="mt-8 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-blue-200 p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg mb-1">Perfect Match</p>
                    <p className="text-gray-700">
                      This plan scored <span className="font-bold text-blue-600">{scoreBreakdown.totalScore}/100</span> based on your unique situation and preferences.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Quote Mark - Bottom Right */}
            <div className="absolute -bottom-4 -right-4 text-8xl md:text-9xl font-serif text-blue-200 opacity-30 leading-none select-none rotate-180">
              &rdquo;
            </div>
          </div>
        </div>


        {/* Three-Column Benefits Grid */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"></div>
            <h3 className="text-2xl font-bold text-gray-900">Score Breakdown</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
          {scoreBreakdown.categories.map((category) => (
            <div
              key={category.name}
              className="group rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-gray-200 hover:shadow-lg"
            >
              {/* Icon Header */}
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} text-2xl shadow-md`}>
                {category.icon}
              </div>

              {/* Category Title */}
              <h3 className="mb-2 text-lg font-bold text-gray-900">{category.name}</h3>

              {/* Score Bar */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${category.color} transition-all duration-500`}
                    style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700">
                  {category.score}/{category.maxScore}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed">{category.description}</p>
            </div>
          ))}
          </div>
        </div>

        {/* Comparison Cards Section */}
        {(topAlternative || currentInsuranceCost) && (
          <div className="mb-12">
            <h3 className="mb-6 text-xl font-bold text-gray-900 md:text-2xl">
              How It Compares
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Recommended Plan Card */}
              <div className="relative overflow-hidden rounded-2xl border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-white p-6 shadow-md">
                {/* Recommended Badge */}
                <div className="absolute top-4 right-4 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  RECOMMENDED
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900">
                    {recommendation.recommendedInsurance}
                  </h4>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    ${recommendation.estimatedMonthlyCost.low}-${recommendation.estimatedMonthlyCost.high}
                    <span className="text-sm font-normal text-gray-600">/month</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Best overall coverage</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Fits your budget</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Covers all locations</span>
                  </div>
                </div>
              </div>

              {/* Alternative Plan Card */}
              {topAlternative && (
                <div className="rounded-2xl border-l-4 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 shadow-md">
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-gray-900">{topAlternative.name}</h4>
                    <p className="mt-1 text-2xl font-bold text-gray-700">
                      ${topAlternative.monthlyCost.low}-${topAlternative.monthlyCost.high}
                      <span className="text-sm font-normal text-gray-600">/month</span>
                    </p>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Trade-offs</span>
                  </div>

                  <div className="space-y-2">
                    {topAlternative.cons.slice(0, 3).map((con, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-700">{con}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Plan Card (if applicable) */}
              {currentInsuranceCost && recommendation.costComparison && (
                <div className="rounded-2xl border-l-4 border-amber-500 bg-gradient-to-br from-amber-50 to-white p-6 shadow-md">
                  <div className="absolute top-4 right-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    CURRENT
                  </div>

                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-gray-900">Your Current Plan</h4>
                    <p className="mt-1 text-2xl font-bold text-amber-600">
                      ${currentInsuranceCost}
                      <span className="text-sm font-normal text-gray-600">/month</span>
                    </p>
                  </div>

                  {recommendation.costComparison.monthlySavings && recommendation.costComparison.monthlySavings > 0 && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-sm font-semibold text-green-800">
                          Save ${recommendation.costComparison.monthlySavings}/month
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-700">
                    Switching could save you up to ${recommendation.costComparison.annualSavings || 0}/year
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trust & Transparency Panel */}
        <div className="mb-12 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 md:p-8 shadow-sm backdrop-blur-sm">
          <h3 className="mb-6 flex items-center gap-3 text-lg font-bold text-gray-900">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            How We Calculated This
          </h3>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Data Sources */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xl">
                📊
              </div>
              <div>
                <div className="font-semibold text-gray-900">CMS Data</div>
                <div className="text-sm text-gray-600">Centers for Medicare & Medicaid Services</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-xl">
                🏥
              </div>
              <div>
                <div className="font-semibold text-gray-900">Healthcare.gov</div>
                <div className="text-sm text-gray-600">Official marketplace data</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-xl">
                🔒
              </div>
              <div>
                <div className="font-semibold text-gray-900">Privacy First</div>
                <div className="text-sm text-gray-600">HIPAA compliant analysis</div>
              </div>
            </div>
          </div>

          {/* Confidence Bar */}
          <div className="mt-6 rounded-lg bg-white p-4 border border-gray-200">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Recommendation Confidence</span>
              <span className="text-sm font-bold text-gray-900">{confidenceDetails.label}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full bg-gradient-to-r from-${confidenceDetails.color}-400 to-${confidenceDetails.color}-600 transition-all duration-500`}
                style={{ width: `${scoreBreakdown.totalScore}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-600">{confidenceDetails.description}</p>
          </div>
        </div>

        {/* Enhanced "Best For" Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 md:p-8 border-l-4 border-blue-500 shadow-md">
          <div className="mb-4 flex items-center gap-3">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-blue-900">Best For</h3>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {formData.residences.length > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                🏠 Multi-State Living
              </span>
            )}
            {formData.hasMedicareEligible && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800">
                👴 Medicare Eligible
              </span>
            )}
            {formData.numChildren > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                👨‍👩‍👧‍👦 Families
              </span>
            )}
            {formData.hasChronicConditions && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                🏥 Ongoing Care Needs
              </span>
            )}
          </div>

          <p className="text-base leading-relaxed text-blue-900">
            {recommendation.reasoning.split('\n\n')[0]}
          </p>
        </div>
      </div>
    </section>
  );
}
