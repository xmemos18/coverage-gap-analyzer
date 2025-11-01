'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { analyzeInsurance } from '@/lib/calculator';
import { CalculatorFormData } from '@/types';

function ResultsContent() {
  const searchParams = useSearchParams();

  // Parse URL parameters - NEW FORMAT (array-based)
  const residenceZipsStr = searchParams.get('residenceZips') || '';
  const residenceStatesStr = searchParams.get('residenceStates') || '';

  // Parse residences from comma-separated strings
  const residenceZips = residenceZipsStr ? residenceZipsStr.split(',') : [];
  const residenceStates = residenceStatesStr ? residenceStatesStr.split(',') : [];

  // Reconstruct residences array
  const residences = residenceZips.map((zip, index) => ({
    zip: zip || '',
    state: residenceStates[index] || '',
  }));

  // Parse household parameters
  const numAdults = parseInt(searchParams.get('numAdults') || '0');
  const adultAgesStr = searchParams.get('adultAges') || '';
  const adultAges = adultAgesStr ? adultAgesStr.split(',').map(Number).filter(n => !isNaN(n)) : [];
  const numChildren = parseInt(searchParams.get('numChildren') || '0');
  const childAgesStr = searchParams.get('childAges') || '';
  const childAges = childAgesStr ? childAgesStr.split(',').map(Number).filter(n => !isNaN(n)) : [];
  const hasMedicareEligible = searchParams.get('hasMedicareEligible') === 'true';
  const budget = searchParams.get('budget') || '';

  // Parse current insurance parameters
  const hasCurrentInsurance = searchParams.get('hasCurrentInsurance') === 'true';
  const currentCarrier = searchParams.get('currentCarrier') || '';
  const currentPlanType = searchParams.get('currentPlanType') || '';
  const currentMonthlyCost = parseFloat(searchParams.get('currentMonthlyCost') || '0');
  const currentDeductible = parseFloat(searchParams.get('currentDeductible') || '0');
  const currentOutOfPocketMax = parseFloat(searchParams.get('currentOutOfPocketMax') || '0');
  const currentCoverageNotes = searchParams.get('currentCoverageNotes') || '';

  // Check if required data is present
  const hasRequiredData = residences.length >= 2 &&
                          residences.every(r => r.state) &&
                          numAdults > 0 &&
                          adultAges.length > 0;

  // Reconstruct form data for recommendation engine
  const formData: CalculatorFormData = useMemo(() => ({
    // New array-based residences
    residences,
    // Legacy fields for backward compatibility
    primaryResidence: residences[0] || { zip: '', state: '' },
    secondaryResidence: residences[1] || { zip: '', state: '' },
    hasThirdHome: residences.length > 2,
    thirdResidence: residences[2] || { zip: '', state: '' },
    numAdults,
    adultAges,
    numChildren,
    childAges,
    hasMedicareEligible,
    hasCurrentInsurance,
    currentInsurance: {
      carrier: currentCarrier,
      planType: currentPlanType,
      monthlyCost: currentMonthlyCost,
      deductible: currentDeductible,
      outOfPocketMax: currentOutOfPocketMax,
      coverageNotes: currentCoverageNotes,
    },
    budget,
    currentStep: 4,
  }), [residences, numAdults, adultAges, numChildren, childAges, hasMedicareEligible, hasCurrentInsurance, currentCarrier, currentPlanType, currentMonthlyCost, currentDeductible, currentOutOfPocketMax, currentCoverageNotes, budget]);

  // Get recommendations from the engine
  const recommendation = useMemo(() => {
    if (!hasRequiredData) return null;
    return analyzeInsurance(formData);
  }, [formData, hasRequiredData]);

  // Format cost for display
  const formatCost = (low: number, high: number) => {
    if (low === high) {
      return `$${low.toLocaleString()}`;
    }
    return `$${low.toLocaleString()}-$${high.toLocaleString()}`;
  };

  // Coverage score color and label
  const getScoreColor = (score: number) => {
    if (score >= 90) return { bg: 'bg-success', text: 'text-success', label: 'Excellent' };
    if (score >= 75) return { bg: 'bg-warning', text: 'text-warning', label: 'Good' };
    return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Fair' };
  };

  // Error state - no data
  if (!hasRequiredData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-lg p-12">
            <div className="text-6xl mb-6">📋</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Please Complete the Calculator First
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              We need your information to provide personalized insurance recommendations.
            </p>
            <Link
              href="/calculator"
              className="inline-block px-8 py-4 bg-accent text-white rounded-lg font-semibold text-lg hover:bg-accent-light shadow-lg transition-all"
            >
              Start Calculator
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendation) return null;

  const scoreColor = getScoreColor(recommendation.coverageGapScore);
  const annualCostLow = recommendation.estimatedMonthlyCost.low * 12;
  const annualCostHigh = recommendation.estimatedMonthlyCost.high * 12;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Your Personalized Recommendations
          </h1>
          <p className="text-xl text-gray-600">
            Based on your multi-state lifestyle
          </p>
        </div>

        {/* SECTION 1: SUMMARY CARD */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 md:p-10 mb-8 border-2 border-accent">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-6">
            {/* Coverage Score Meter */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full ${scoreColor.bg} flex items-center justify-center`}>
                  <div className="bg-white w-24 h-24 rounded-full flex flex-col items-center justify-center">
                    <div className={`text-3xl font-bold ${scoreColor.text}`}>
                      {recommendation.coverageGapScore}
                    </div>
                    <div className="text-xs text-gray-600 font-semibold">
                      {scoreColor.label}
                    </div>
                  </div>
                </div>
                <div className="text-center mt-2 text-sm font-semibold text-gray-600">
                  Coverage Score
                </div>
              </div>
            </div>

            {/* Main Recommendation */}
            <div className="flex-1">
              <div className="inline-block bg-accent text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
                RECOMMENDED FOR YOU
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {recommendation.recommendedInsurance}
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                {recommendation.householdBreakdown}
              </p>
              <div className="flex items-baseline gap-3">
                <div className="text-5xl font-bold text-accent">
                  {formatCost(recommendation.estimatedMonthlyCost.low, recommendation.estimatedMonthlyCost.high)}
                </div>
                <div className="text-xl text-gray-600 font-semibold">
                  /month
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: CURRENT INSURANCE COMPARISON (if provided) */}
        {recommendation.currentInsuranceSummary && recommendation.costComparison && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">📊</span>
              Your Current Insurance vs Our Recommendation
            </h3>

            {/* Current Insurance Details */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Current Insurance</h4>
              <p className="text-gray-700">{recommendation.currentInsuranceSummary}</p>
            </div>

            {/* Cost Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border-2 border-gray-300">
                <div className="text-sm font-semibold text-gray-600 mb-2">Current Monthly Cost</div>
                <div className="text-3xl font-bold text-gray-700">
                  ${recommendation.costComparison.current.toLocaleString()}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border-2 border-accent">
                <div className="text-sm font-semibold text-gray-600 mb-2">Recommended Monthly Cost</div>
                <div className="text-3xl font-bold text-accent">
                  {formatCost(recommendation.costComparison.recommended.low, recommendation.costComparison.recommended.high)}
                </div>
              </div>
              {recommendation.costComparison.monthlySavings && recommendation.costComparison.monthlySavings > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg border-2 border-success">
                  <div className="text-sm font-semibold text-gray-600 mb-2">Potential Savings</div>
                  <div className="text-3xl font-bold text-success">
                    ${Math.round(recommendation.costComparison.monthlySavings).toLocaleString()}/mo
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    ${Math.round(recommendation.costComparison.annualSavings || 0).toLocaleString()}/year
                  </div>
                </div>
              )}
            </div>

            {/* Improvement Areas */}
            {recommendation.improvementAreas && recommendation.improvementAreas.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-warning">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Areas for Improvement</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.improvementAreas.map((area, index) => (
                    <span
                      key={index}
                      className="bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-700 border border-gray-300"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: PERSONALIZED SUGGESTIONS (if provided) */}
        {recommendation.suggestions && recommendation.suggestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">💡</span>
              Personalized Suggestions
            </h3>
            <div className="space-y-4">
              {recommendation.suggestions.map((suggestion, index) => {
                const priorityColors = {
                  high: 'border-red-300 bg-red-50',
                  medium: 'border-yellow-300 bg-yellow-50',
                  low: 'border-blue-300 bg-blue-50',
                };
                const priorityBadges = {
                  high: 'bg-red-500 text-white',
                  medium: 'bg-yellow-500 text-white',
                  low: 'bg-blue-500 text-white',
                };
                const typeIcons = {
                  'cost-savings': '💰',
                  'coverage-improvement': '🛡️',
                  'network-expansion': '🌐',
                  'plan-change': '🔄',
                };

                return (
                  <div
                    key={index}
                    className={`rounded-lg p-6 border-2 ${priorityColors[suggestion.priority]}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeIcons[suggestion.type]}</span>
                        <h4 className="text-lg font-bold text-gray-900">{suggestion.title}</h4>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${priorityBadges[suggestion.priority]}`}>
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-2">{suggestion.description}</p>
                    {suggestion.potentialSavings && suggestion.potentialSavings > 0 && (
                      <div className="mt-3 inline-block bg-success text-white px-4 py-2 rounded-lg font-semibold">
                        Save ${Math.round(suggestion.potentialSavings)}/month
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: WHY THIS RECOMMENDATION */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-3xl">💡</span>
            Why This Recommendation?
          </h3>
          <p className="text-lg text-gray-700 leading-relaxed">
            {recommendation.reasoning}
          </p>
        </div>

        {/* SECTION 5: COST BREAKDOWN */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-3xl">💰</span>
            Cost Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border-2 border-blue-200">
              <div className="text-sm font-semibold text-gray-600 mb-2">Monthly Cost</div>
              <div className="text-4xl font-bold text-primary">
                {formatCost(recommendation.estimatedMonthlyCost.low, recommendation.estimatedMonthlyCost.high)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg border-2 border-green-200">
              <div className="text-sm font-semibold text-gray-600 mb-2">Annual Cost</div>
              <div className="text-4xl font-bold text-success">
                {formatCost(annualCostLow, annualCostHigh)}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            Costs are estimates and may vary based on your specific situation and chosen provider.
          </p>
        </div>

        {/* SECTION 6: YOUR NEXT STEPS */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-3xl">✅</span>
            Your Next Steps
          </h3>
          <div className="space-y-4">
            {recommendation.actionItems.map((item, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-lg border-l-4 border-accent hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <p className="text-gray-800 text-lg flex-1 pt-0.5">
                    {item}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 7: OTHER OPTIONS TO CONSIDER */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-3xl">🔍</span>
            Other Options to Consider
          </h3>
          <div className="space-y-6">
            {recommendation.alternativeOptions.map((option, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 hover:border-accent transition-colors"
              >
                <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                  <h4 className="text-xl font-bold text-gray-900 mb-2 md:mb-0">
                    {option.name}
                  </h4>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-700">
                      {formatCost(option.monthlyCost.low, option.monthlyCost.high)}
                    </div>
                    <div className="text-sm text-gray-600">per month</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pros */}
                  <div>
                    <h5 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <span>✓</span> Pros
                    </h5>
                    <ul className="space-y-2">
                      {option.pros.map((pro, i) => (
                        <li key={i} className="text-gray-700 flex items-start gap-2">
                          <span className="text-success flex-shrink-0 mt-1">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span>−</span> Cons
                    </h5>
                    <ul className="space-y-2">
                      {option.cons.map((con, i) => (
                        <li key={i} className="text-gray-600 flex items-start gap-2">
                          <span className="text-gray-400 flex-shrink-0 mt-1">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 8: DISCLAIMER & CTAS */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <p className="text-sm text-gray-600 leading-relaxed max-w-3xl mx-auto">
              <strong>Important:</strong> These are estimates only. Actual costs and coverage may vary based on your specific circumstances,
              health status, and chosen providers. We strongly recommend consulting with a licensed insurance advisor
              to discuss your individual needs and ensure proper coverage across all your residences.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/calculator"
              className="px-8 py-4 border-2 border-accent text-accent font-bold rounded-lg hover:bg-accent hover:text-white transition-colors text-lg w-full sm:w-auto"
            >
              ← Start Over
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors text-lg shadow-lg w-full sm:w-auto"
            >
              Contact Us →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-2xl font-semibold text-gray-700">Loading your recommendations...</div>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
