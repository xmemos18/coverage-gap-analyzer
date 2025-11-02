'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { analyzeInsurance } from '@/lib/calculator';
import { CalculatorFormData } from '@/types';
import RecommendationSummary from '@/components/results/RecommendationSummary';
import CurrentInsuranceComparison from '@/components/results/CurrentInsuranceComparison';
import PersonalizedSuggestions from '@/components/results/PersonalizedSuggestions';
import ReasoningSection from '@/components/results/ReasoningSection';
import CostBreakdown from '@/components/results/CostBreakdown';
import NextStepsSection from '@/components/results/NextStepsSection';
import AlternativeOptions from '@/components/results/AlternativeOptions';
import DisclaimerSection from '@/components/results/DisclaimerSection';
import ShareButtons from '@/components/ShareButtons';

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Print-only header */}
        <div className="hidden print:block mb-8">
          <div className="border-b-2 border-gray-300 pb-4 mb-4">
            <h1 className="text-2xl font-bold">Coverage Gap Analyzer Results</h1>
            <p className="text-sm text-gray-600">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-600">
              {window.location.href}
            </p>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Your Personalized Recommendations
          </h1>
          <p className="text-xl text-gray-600">
            Based on your multi-state lifestyle
          </p>
        </div>

        {/* Main Recommendation Summary */}
        <div className="print-no-break">
          <RecommendationSummary
            coverageGapScore={recommendation.coverageGapScore}
            recommendedInsurance={recommendation.recommendedInsurance}
            householdBreakdown={recommendation.householdBreakdown}
            estimatedMonthlyCost={recommendation.estimatedMonthlyCost}
          />
        </div>

        {/* Share & Export Buttons */}
        <ShareButtons
          data={{
            recommendation,
            formData,
            generatedDate: new Date().toISOString()
          }}
          summary={`${recommendation.recommendedInsurance} - Estimated Cost: $${recommendation.estimatedMonthlyCost.low}-${recommendation.estimatedMonthlyCost.high}/month`}
          filename="insurance-analysis"
        />

        {/* Current Insurance Comparison (if provided) */}
        {recommendation.currentInsuranceSummary && recommendation.costComparison && (
          <CurrentInsuranceComparison
            currentInsuranceSummary={recommendation.currentInsuranceSummary}
            costComparison={recommendation.costComparison}
            improvementAreas={recommendation.improvementAreas}
          />
        )}

        {/* Personalized Suggestions (if provided) */}
        {recommendation.suggestions && recommendation.suggestions.length > 0 && (
          <PersonalizedSuggestions suggestions={recommendation.suggestions} />
        )}

        {/* Why This Recommendation */}
        <ReasoningSection reasoning={recommendation.reasoning} />

        {/* Cost Breakdown */}
        <CostBreakdown monthlyCost={recommendation.estimatedMonthlyCost} />

        {/* Your Next Steps */}
        <NextStepsSection actionItems={recommendation.actionItems} />

        {/* Other Options to Consider */}
        <AlternativeOptions options={recommendation.alternativeOptions} />

        {/* Disclaimer & CTAs */}
        <DisclaimerSection />
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
