'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useEffect } from 'react';
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
import ResultsSkeleton from '@/components/results/ResultsSkeleton';
import ValidationError from '@/components/results/ValidationError';
import { trackEvent, trackCalculatorCompleted } from '@/lib/analytics';
import { validateURLParameters, getValidationSummary } from '@/lib/urlValidation';

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

  // Validate all URL parameters
  const validationResult = useMemo(() => {
    return validateURLParameters({
      residenceZips,
      residenceStates,
      numAdults,
      adultAges,
      numChildren,
      childAges,
      hasMedicareEligible,
      hasCurrentInsurance,
      budget,
    });
  }, [residenceZips, residenceStates, numAdults, adultAges, numChildren, childAges, hasMedicareEligible, hasCurrentInsurance, budget]);

  // Log validation results in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const summary = getValidationSummary(validationResult);
      console.log('🔍 URL Validation:', summary);

      if (!validationResult.isValid) {
        console.error('Validation errors:', validationResult.errors);
      }

      if (validationResult.warnings.length > 0) {
        console.warn('Validation warnings:', validationResult.warnings);
      }
    }
  }, [validationResult]);

  // Check if required data is present and valid
  const hasRequiredData = validationResult.isValid;

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

  // Track analytics when results are viewed
  useEffect(() => {
    if (hasRequiredData && recommendation) {
      // Track results viewed
      trackEvent('results_viewed');

      // Track calculator completion with household details
      trackCalculatorCompleted(
        numAdults,
        numAdults,
        numChildren,
        hasMedicareEligible
      );
    }
  }, [hasRequiredData, recommendation, numAdults, numChildren, hasMedicareEligible]);

  // Error state - invalid or missing data
  if (!hasRequiredData) {
    return <ValidationError errors={validationResult.errors} warnings={validationResult.warnings} />;
  }

  if (!recommendation) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Print-only header */}
        <div className="hidden print:block mb-8">
          <div className="border-b-2 border-gray-300 pb-4 mb-4">
            <h1 className="text-2xl font-bold">Key Insurance Matters Results</h1>
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
    <Suspense fallback={<ResultsSkeleton />}>
      <ResultsContent />
    </Suspense>
  );
}
