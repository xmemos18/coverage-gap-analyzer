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
import VisualCostBreakdown from '@/components/results/VisualCostBreakdown';
import NextStepsSection from '@/components/results/NextStepsSection';
import AlternativeOptions from '@/components/results/AlternativeOptions';
import PlanComparisonTable from '@/components/results/PlanComparisonTable';
import SavingsCalculator from '@/components/results/SavingsCalculator';
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
    isPrimary: index === 0, // First residence is considered primary by default
    monthsPerYear: 0, // Default value, can be enhanced later to read from URL params
  }));

  // Parse household parameters
  const numAdults = parseInt(searchParams.get('numAdults') || '0');
  const adultAgesStr = searchParams.get('adultAges') || '';
  const adultAges = adultAgesStr ? adultAgesStr.split(',').map(Number).filter(n => !isNaN(n)) : [];
  const numChildren = parseInt(searchParams.get('numChildren') || '0');
  const childAgesStr = searchParams.get('childAges') || '';
  const childAges = childAgesStr ? childAgesStr.split(',').map(Number).filter(n => !isNaN(n)) : [];
  const hasMedicareEligible = searchParams.get('hasMedicareEligible') === 'true';

  // Parse employment & coverage parameters
  const hasEmployerInsurance = searchParams.get('hasEmployerInsurance') === 'true';
  const employerContribution = parseInt(searchParams.get('employerContribution') || '0');

  // Parse health profile parameters
  const hasChronicConditions = searchParams.get('hasChronicConditions') === 'true';
  const chronicConditionsStr = searchParams.get('chronicConditions') || '';
  const chronicConditions = chronicConditionsStr ? chronicConditionsStr.split(',') : [];
  const prescriptionCount = searchParams.get('prescriptionCount') || '';
  const providerPreference = searchParams.get('providerPreference') || '';

  // Parse budget & income parameters
  const budget = searchParams.get('budget') || '';
  const incomeRange = searchParams.get('incomeRange') || '';

  // Parse UI mode
  const simpleMode = searchParams.get('simpleMode') === 'true';

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
    primaryResidence: residences[0] || { zip: '', state: '', isPrimary: true, monthsPerYear: 0 },
    secondaryResidence: residences[1] || { zip: '', state: '', isPrimary: false, monthsPerYear: 0 },
    hasThirdHome: residences.length > 2,
    thirdResidence: residences[2] || { zip: '', state: '', isPrimary: false, monthsPerYear: 0 },
    numAdults,
    adultAges,
    numChildren,
    childAges,
    hasMedicareEligible,
    hasEmployerInsurance,
    employerContribution,
    hasChronicConditions,
    chronicConditions,
    prescriptionCount,
    providerPreference,
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
    incomeRange,
    currentStep: 5,
    simpleMode,
  }), [residences, numAdults, adultAges, numChildren, childAges, hasMedicareEligible, hasEmployerInsurance, employerContribution, hasChronicConditions, chronicConditions, prescriptionCount, providerPreference, hasCurrentInsurance, currentCarrier, currentPlanType, currentMonthlyCost, currentDeductible, currentOutOfPocketMax, currentCoverageNotes, budget, incomeRange, simpleMode]);

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

          {/* Mode Badge */}
          {simpleMode && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg">
              <span className="text-sm font-semibold text-accent mr-2">🎯</span>
              <span className="text-sm font-semibold text-gray-700">
                Simple Mode Results
              </span>
            </div>
          )}
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
        <div className="flex flex-wrap gap-4 justify-center print:hidden">
          <ShareButtons
            data={{
              recommendation,
              formData,
              generatedDate: new Date().toISOString()
            }}
            summary={`${recommendation.recommendedInsurance} - Estimated Cost: $${recommendation.estimatedMonthlyCost.low}-${recommendation.estimatedMonthlyCost.high}/month`}
            filename="insurance-analysis"
          />
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <span>🖨️</span>
            Print Results
          </button>
        </div>

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

        {/* Visual Cost Breakdown */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            Visual Cost Analysis
          </h3>
          <VisualCostBreakdown
            recommendedCost={recommendation.estimatedMonthlyCost}
            budget={budget}
            currentCost={hasCurrentInsurance ? currentMonthlyCost : undefined}
            subsidyAmount={recommendation.subsidyAnalysis?.estimatedMonthlySubsidy}
            costAfterSubsidy={recommendation.subsidyAnalysis?.estimatedAfterSubsidyCost}
          />
        </div>

        {/* Savings Calculator */}
        <SavingsCalculator
          recommendedCost={recommendation.estimatedMonthlyCost}
          currentCost={hasCurrentInsurance ? currentMonthlyCost : undefined}
          subsidyAmount={recommendation.subsidyAnalysis?.estimatedMonthlySubsidy}
        />

        {/* Your Next Steps */}
        <NextStepsSection actionItems={recommendation.actionItems} />

        {/* Other Options to Consider */}
        <AlternativeOptions options={recommendation.alternativeOptions} />

        {/* Plan Comparison Table */}
        {recommendation.alternativeOptions && recommendation.alternativeOptions.length > 0 && (
          <PlanComparisonTable
            recommended={recommendation}
            alternatives={recommendation.alternativeOptions}
          />
        )}

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
