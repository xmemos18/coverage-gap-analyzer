'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useEffect, lazy } from 'react';
import { CalculatorFormData } from '@/types';
import { useInsuranceAnalysis } from '@/hooks/useInsuranceAnalysis';
import RecommendationSummary from '@/components/results/RecommendationSummary';
import CurrentInsuranceComparison from '@/components/results/CurrentInsuranceComparison';
import PersonalizedSuggestions from '@/components/results/PersonalizedSuggestions';
import ReasoningSection from '@/components/results/ReasoningSection';
import CostBreakdown from '@/components/results/CostBreakdown';
import VisualCostBreakdown from '@/components/results/VisualCostBreakdown';
import NextStepsSection from '@/components/results/NextStepsSection';
import AlternativeOptions from '@/components/results/AlternativeOptions';
import AddOnInsuranceSection from '@/components/results/AddOnInsuranceSection';
import DisclaimerSection from '@/components/results/DisclaimerSection';
import ShareButtons from '@/components/ShareButtons';
import ResultsSkeleton from '@/components/results/ResultsSkeleton';
import ValidationError from '@/components/results/ValidationError';
import { trackEvent, trackCalculatorCompleted } from '@/lib/analytics';
import { validateURLParameters, getValidationSummary } from '@/lib/urlValidation';
import { logger, devLogger } from '@/lib/logger';
import { PDFDownloadButton } from '@/components/PDFReport';
import CostComparisonChart from '@/components/charts/CostComparisonChart';

// Lazy load heavy components that are conditionally rendered
const PlanComparisonTable = lazy(() => import('@/components/results/PlanComparisonTable'));
const SavingsCalculator = lazy(() => import('@/components/results/SavingsCalculator'));

function ResultsContent() {
  const searchParams = useSearchParams();

  // Parse URL parameters - NEW FORMAT (array-based)
  const residenceZipsStr = searchParams.get('residenceZips') || '';
  const residenceStatesStr = searchParams.get('residenceStates') || '';

  // Parse all URL parameters in a single useMemo for better performance
  const parsedParams = useMemo(() => {
    const residenceZips = residenceZipsStr ? residenceZipsStr.split(',') : [];
    const residenceStates = residenceStatesStr ? residenceStatesStr.split(',') : [];
    const adultAgesStr = searchParams.get('adultAges') || '';
    const adultAges = adultAgesStr ? adultAgesStr.split(',').map(Number).filter(n => !isNaN(n)) : [];
    const childAgesStr = searchParams.get('childAges') || '';
    const childAges = childAgesStr ? childAgesStr.split(',').map(Number).filter(n => !isNaN(n)) : [];
    const chronicConditionsStr = searchParams.get('chronicConditions') || '';
    const chronicConditions = chronicConditionsStr ? chronicConditionsStr.split(',') : [];

    // Reconstruct residences array
    const residences = residenceZips.map((zip, index) => ({
      zip: zip || '',
      state: residenceStates[index] || '',
      isPrimary: index === 0,
      monthsPerYear: 0,
    }));

    return {
      residenceZips,
      residenceStates,
      residences,
      adultAges,
      childAges,
      chronicConditions,
    };
  }, [residenceZipsStr, residenceStatesStr, searchParams]);

  const { residenceZips, residenceStates, residences, adultAges, childAges, chronicConditions } = parsedParams;

  // Parse household parameters with validation
  const numAdults = parseInt(searchParams.get('numAdults') || '0') || 0;
  const numChildren = parseInt(searchParams.get('numChildren') || '0') || 0;
  const hasMedicareEligible = searchParams.get('hasMedicareEligible') === 'true';

  // Parse employment & coverage parameters with validation
  const hasEmployerInsurance = searchParams.get('hasEmployerInsurance') === 'true';
  const employerContribution = parseInt(searchParams.get('employerContribution') || '0') || 0;

  // Parse health profile parameters
  const hasChronicConditions = searchParams.get('hasChronicConditions') === 'true';
  const prescriptionCount = searchParams.get('prescriptionCount') || '';
  const providerPreference = searchParams.get('providerPreference') || '';

  // Parse budget & income parameters
  const budget = searchParams.get('budget') || '';
  const incomeRange = searchParams.get('incomeRange') || '';

  // Parse UI mode
  const simpleMode = searchParams.get('simpleMode') === 'true';

  // Parse current insurance parameters with validation
  const hasCurrentInsurance = searchParams.get('hasCurrentInsurance') === 'true';
  const currentCarrier = searchParams.get('currentCarrier') || '';
  const currentPlanType = searchParams.get('currentPlanType') || '';
  const currentMonthlyCost = parseFloat(searchParams.get('currentMonthlyCost') || '0') || 0;
  const currentDeductible = parseFloat(searchParams.get('currentDeductible') || '0') || 0;
  const currentOutOfPocketMax = parseFloat(searchParams.get('currentOutOfPocketMax') || '0') || 0;
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
      devLogger.log('🔍 URL Validation', summary);

      if (!validationResult.isValid) {
        logger.error('Validation errors', validationResult.errors);
      }

      if (validationResult.warnings.length > 0) {
        logger.warn('Validation warnings', validationResult.warnings);
      }
    }
  }, [validationResult]);

  // Check if required data is present and valid
  const hasRequiredData = validationResult.isValid;

  // Reconstruct form data for recommendation engine
  const formData: CalculatorFormData = useMemo(() => ({
    residences,
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
    interestedInAddOns: true, // Always show add-on recommendations on results page
  }), [residences, numAdults, adultAges, numChildren, childAges, hasMedicareEligible, hasEmployerInsurance, employerContribution, hasChronicConditions, chronicConditions, prescriptionCount, providerPreference, hasCurrentInsurance, currentCarrier, currentPlanType, currentMonthlyCost, currentDeductible, currentOutOfPocketMax, currentCoverageNotes, budget, incomeRange, simpleMode]);

  // Get all insurance analysis using custom hook
  const { recommendation, medicareAdvantageAnalysis, cobraAnalysis, hsaAnalysis } = useInsuranceAnalysis({
    formData,
    adultAges,
    numAdults,
    numChildren,
    residenceStates,
    hasEmployerInsurance,
    currentMonthlyCost,
    employerContribution,
    hasChronicConditions,
    prescriptionCount,
    incomeRange,
    hasRequiredData,
  });

  // Track analytics when results are viewed
  useEffect(() => {
    if (hasRequiredData && recommendation) {
      // Track results viewed
      trackEvent('results_viewed');

      // Track calculator completion with household details
      trackCalculatorCompleted(
        numAdults,
        adultAges.length,
        numChildren,
        hasMedicareEligible
      );
    }
  }, [hasRequiredData, recommendation, numAdults, adultAges, numChildren, hasMedicareEligible]);

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
              {typeof window !== 'undefined' ? window.location.href : ''}
            </p>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4">
            Your Personalized Recommendations
          </h1>
          <p className="text-xl text-gray-600">
            Based on your multi-state lifestyle
          </p>

          {/* Mode Badge */}
          {simpleMode && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600/10 border border-blue-600/30 rounded-lg">
              <span className="text-sm font-semibold text-blue-600 mr-2">🎯</span>
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
          <PDFDownloadButton
            recommendation={recommendation}
            formData={{
              residences: residences.map(r => ({ zip: r.zip, state: r.state })),
              numAdults,
              numChildren,
              adultAges,
              childAges,
              budget,
              incomeRange,
            }}
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
            improvementAreas={recommendation.improvementAreas || []}
          />
        )}

        {/* Personalized Suggestions (if provided) */}
        {recommendation.suggestions && recommendation.suggestions.length > 0 && (
          <PersonalizedSuggestions suggestions={recommendation.suggestions} />
        )}

        {/* Why This Recommendation */}
        <ReasoningSection reasoning={recommendation.reasoning} />

        {/* Cost Comparison Chart */}
        {recommendation.alternativeOptions && recommendation.alternativeOptions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 print:break-inside-avoid">
            <CostComparisonChart
              data={[
                {
                  name: 'Recommended',
                  cost: recommendation.estimatedMonthlyCost,
                  color: '#3b82f6',
                },
                ...recommendation.alternativeOptions.slice(0, 3).map((alt, idx) => ({
                  name: alt.name,
                  cost: alt.monthlyCost,
                  color: ['#10b981', '#f59e0b', '#ef4444'][idx] || '#6b7280',
                })),
              ]}
              title="Monthly Premium Comparison"
              height={350}
            />
            <p className="text-sm text-gray-600 text-center mt-4">
              * Costs shown are estimates. Actual premiums may vary based on plan details and subsidies.
            </p>
          </div>
        )}

        {/* Medicare Advantage Comparison (for Medicare-eligible users) */}
        {medicareAdvantageAnalysis && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 md:p-8 mb-8 print:break-inside-avoid">
            <h3 className="text-2xl md:text-3xl font-bold text-blue-900 mb-4 flex items-center gap-3">
              <span className="text-3xl md:text-4xl">🏥</span>
              Medicare vs Medicare Advantage
            </h3>

            <p className="text-gray-700 mb-6">
              Since you&apos;re Medicare-eligible, you have the choice between Original Medicare with Medigap or Medicare Advantage. Here&apos;s what you should know:
            </p>

            {/* Analysis Overview */}
            <div className="bg-white rounded-lg p-6 mb-6 border border-blue-200">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">
                  {medicareAdvantageAnalysis.analysis.isGoodFit ? '✅' : '⚠️'}
                </span>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-gray-900 mb-2">
                    Medicare Advantage {medicareAdvantageAnalysis.analysis.isGoodFit ? 'May Work For You' : 'May Not Be Ideal'}
                  </h4>
                  <p className="text-gray-600 mb-2">
                    Confidence: <span className="font-semibold capitalize">{medicareAdvantageAnalysis.analysis.confidenceLevel}</span>
                  </p>
                  <ul className="text-gray-700 space-y-1">
                    {medicareAdvantageAnalysis.analysis.reasoning.map((reason, idx) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Pros and Cons */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Pros */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <span>✅</span> Medicare Advantage Benefits
                </h5>
                <ul className="space-y-2 text-sm text-gray-700">
                  {medicareAdvantageAnalysis.analysis.pros.map((pro, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-green-600 flex-shrink-0">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h5 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Potential Drawbacks
                </h5>
                <ul className="space-y-2 text-sm text-gray-700">
                  {medicareAdvantageAnalysis.analysis.cons.map((con, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-orange-600 flex-shrink-0">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Red Flags */}
            {medicareAdvantageAnalysis.analysis.redFlags.length > 0 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
                <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <span>🚨</span> Important Considerations
                </h5>
                <ul className="space-y-2 text-sm text-gray-800">
                  {medicareAdvantageAnalysis.analysis.redFlags.map((flag, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-red-600 flex-shrink-0">•</span>
                      <span className="font-medium">{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Comparison */}
            <div className="bg-white rounded-lg p-6 mb-6 border border-blue-200">
              <h5 className="font-semibold text-lg text-gray-900 mb-4">Quick Comparison</h5>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h6 className="font-semibold text-blue-900 mb-2">Original Medicare + Medigap</h6>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {medicareAdvantageAnalysis.comparison.medigapAdvantages.map((adv, idx) => (
                      <li key={idx}>• {adv}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h6 className="font-semibold text-indigo-900 mb-2">Medicare Advantage</h6>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {medicareAdvantageAnalysis.comparison.medicareAdvantageAdvantages.map((adv, idx) => (
                      <li key={idx}>• {adv}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-gray-800 bg-blue-50 p-3 rounded border border-blue-200">
                <strong>Recommendation:</strong> {medicareAdvantageAnalysis.comparison.recommendation}
              </p>
            </div>

            {/* Shopping Tips */}
            <div className="bg-white rounded-lg p-6 border border-blue-200">
              <h5 className="font-semibold text-lg text-gray-900 mb-4">💡 Shopping Tips</h5>
              <ul className="space-y-2 text-sm text-gray-700">
                {medicareAdvantageAnalysis.shoppingTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* COBRA Analysis Section */}
        {cobraAnalysis && (
          <div className="mb-8 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-8 border-2 border-orange-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-3xl">💼</span>
              COBRA Continuation Coverage Analysis
            </h3>

            <div className="bg-white rounded-lg p-6 mb-6 border border-orange-200">
              <p className="text-sm text-gray-600 mb-4">
                Since you have employer insurance, you may be eligible for COBRA continuation coverage if you lose your job or change employment.
                Here&apos;s what you need to know about whether COBRA is worth it:
              </p>

              {/* Warnings */}
              {cobraAnalysis.analysis.warnings.length > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  {cobraAnalysis.analysis.warnings.map((warning, idx) => (
                    <p key={idx} className="text-red-800 font-semibold">{warning}</p>
                  ))}
                </div>
              )}

              {/* Recommendation */}
              <div className={`mb-6 rounded-lg p-5 border-2 ${
                cobraAnalysis.analysis.isWorthIt
                  ? 'bg-green-50 border-green-300'
                  : 'bg-yellow-50 border-yellow-300'
              }`}>
                <h4 className="font-bold text-lg mb-2">
                  {cobraAnalysis.analysis.isWorthIt ? '✅ COBRA May Be Worth It' : '⚠️ Consider Alternatives to COBRA'}
                </h4>
                <p className="text-gray-800">{cobraAnalysis.analysis.recommendation}</p>
              </div>

              {/* Cost Estimate */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-lg mb-2">Estimated COBRA Cost</h5>
                <p className="text-3xl font-bold text-orange-600">
                  ${cobraAnalysis.analysis.estimatedMonthlyCost.low.toFixed(0)} - ${cobraAnalysis.analysis.estimatedMonthlyCost.high.toFixed(0)}
                  <span className="text-base text-gray-600 font-normal"> per month</span>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {cobraAnalysis.analysis.monthsRemaining} months of COBRA eligibility remaining (18 months total)
                </p>
              </div>

              {/* Pros and Cons Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Pros */}
                <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                  <h5 className="font-semibold text-lg text-green-900 mb-3">✅ Pros of COBRA</h5>
                  <ul className="space-y-2">
                    {cobraAnalysis.analysis.pros.map((pro, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div className="bg-red-50 rounded-lg p-5 border border-red-200">
                  <h5 className="font-semibold text-lg text-red-900 mb-3">❌ Cons of COBRA</h5>
                  <ul className="space-y-2">
                    {cobraAnalysis.analysis.cons.map((con, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Decision Flowchart */}
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-200 mb-6">
                <h5 className="font-semibold text-lg text-blue-900 mb-4">🗺️ COBRA Decision Guide</h5>
                <div className="space-y-4">
                  {cobraAnalysis.flowchart.map((step, idx) => (
                    <div key={idx} className="bg-white rounded p-4 border border-blue-200">
                      <p className="font-semibold text-gray-900 mb-2">{step.question}</p>
                      <div className="grid md:grid-cols-2 gap-3 mt-2 text-sm">
                        <div className="text-green-700 bg-green-50 rounded p-2">
                          <strong>Yes:</strong> {step.yesPath}
                        </div>
                        <div className="text-gray-700 bg-gray-50 rounded p-2">
                          <strong>No:</strong> {step.noPath}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternatives */}
              <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
                <h5 className="font-semibold text-lg text-purple-900 mb-3">🔄 Alternatives to COBRA</h5>
                <ul className="space-y-2">
                  {cobraAnalysis.analysis.alternatives.map((alt, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">→</span>
                      <span>{alt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* HSA Analysis Section */}
        {hsaAnalysis && (
          <div className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-8 border-2 border-green-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-3xl">💰</span>
              HSA (Health Savings Account) Tax Benefits
            </h3>

            <div className="bg-white rounded-lg p-6 mb-6 border border-green-200">
              <p className="text-sm text-gray-600 mb-6">
                Since you have low medical needs, you&apos;re an excellent candidate for a High-Deductible Health Plan (HDHP) with a Health Savings Account (HSA).
                HSAs offer the best tax benefits of any savings account - the &quot;triple tax advantage&quot;:
              </p>

              {/* Triple Tax Advantage */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 mb-6 border border-blue-200">
                <h4 className="font-bold text-lg mb-3">🎯 Triple Tax Advantage</h4>
                <div className="space-y-2">
                  {hsaAnalysis.analysis.tripleTaxAdvantage.map((advantage, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">{advantage.split(' ')[0]}</span>
                      <span className="text-gray-800">{advantage.substring(advantage.indexOf(' ') + 1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contribution Limits & Tax Savings */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Contribution Limits */}
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                  <h5 className="font-semibold text-lg text-blue-900 mb-3">📊 2024 Contribution Limits</h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Individual Coverage</p>
                      <p className="text-2xl font-bold text-blue-600">${hsaAnalysis.analysis.contributionLimits.individual.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Family Coverage</p>
                      <p className="text-2xl font-bold text-blue-600">${hsaAnalysis.analysis.contributionLimits.family.toLocaleString()}</p>
                    </div>
                    {hsaAnalysis.analysis.maxContribution > hsaAnalysis.analysis.contributionLimits.family && (
                      <div className="bg-green-100 rounded p-2">
                        <p className="text-sm text-gray-600">Catch-Up (Age 55+)</p>
                        <p className="text-xl font-bold text-green-600">+${hsaAnalysis.analysis.contributionLimits.catchUp.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tax Savings */}
                <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                  <h5 className="font-semibold text-lg text-green-900 mb-3">💵 Your Annual Tax Savings</h5>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Federal Tax:</span>
                      <span className="font-semibold">${hsaAnalysis.analysis.taxSavings.federal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">FICA Tax:</span>
                      <span className="font-semibold">${hsaAnalysis.analysis.taxSavings.fica.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">State Tax:</span>
                      <span className="font-semibold">${hsaAnalysis.analysis.taxSavings.state.toLocaleString()}</span>
                    </div>
                    <div className="border-t-2 border-green-300 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Total Savings:</span>
                        <span className="text-2xl font-bold text-green-600">${hsaAnalysis.analysis.taxSavings.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Per year at max contribution (${hsaAnalysis.analysis.maxContribution.toLocaleString()})</p>
                </div>
              </div>

              {/* Growth Projections */}
              <div className="bg-purple-50 rounded-lg p-5 mb-6 border border-purple-200">
                <h5 className="font-semibold text-lg text-purple-900 mb-4">📈 Long-Term Growth Potential</h5>
                <p className="text-sm text-gray-600 mb-4">
                  If you invest your HSA contributions (7% annual return):
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Year 1</p>
                    <p className="text-lg font-bold text-purple-600">${hsaAnalysis.analysis.projections.year1.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Year 5</p>
                    <p className="text-lg font-bold text-purple-600">${hsaAnalysis.analysis.projections.year5.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Year 10</p>
                    <p className="text-lg font-bold text-purple-600">${hsaAnalysis.analysis.projections.year10.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded p-3 text-center border-2 border-purple-300">
                    <p className="text-xs text-gray-600 mb-1">Retirement</p>
                    <p className="text-lg font-bold text-purple-600">${hsaAnalysis.analysis.projections.retirement.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-yellow-50 rounded-lg p-5 mb-6 border-2 border-yellow-300">
                <h5 className="font-bold text-lg mb-2">💡 Recommendation for You</h5>
                <p className="text-gray-800">{hsaAnalysis.analysis.recommendation}</p>
              </div>

              {/* Benefits and Considerations Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Benefits */}
                <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                  <h5 className="font-semibold text-lg text-green-900 mb-3">✅ HSA Benefits</h5>
                  <ul className="space-y-2">
                    {hsaAnalysis.analysis.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Considerations */}
                <div className="bg-orange-50 rounded-lg p-5 border border-orange-200">
                  <h5 className="font-semibold text-lg text-orange-900 mb-3">⚠️ Important Considerations</h5>
                  <ul className="space-y-2">
                    {hsaAnalysis.analysis.considerations.map((consideration, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5">→</span>
                        <span>{consideration}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* HSA Strategies */}
              <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-200">
                <h5 className="font-semibold text-lg text-indigo-900 mb-4">🎯 HSA Usage Strategies</h5>
                <div className="space-y-4">
                  {hsaAnalysis.strategies.map((strategy, idx) => (
                    <div key={idx} className="bg-white rounded p-4 border border-indigo-200">
                      <h6 className="font-semibold text-gray-900 mb-1">{strategy.strategy}</h6>
                      <p className="text-sm text-gray-700 mb-2">{strategy.description}</p>
                      <p className="text-xs text-indigo-600 font-semibold">Best for: {strategy.bestFor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
        <Suspense fallback={<div className="bg-white rounded-xl shadow-lg p-8 mb-8 animate-pulse h-64" />}>
          <SavingsCalculator
            recommendedCost={recommendation.estimatedMonthlyCost}
            currentCost={hasCurrentInsurance ? currentMonthlyCost : undefined}
            subsidyAmount={recommendation.subsidyAnalysis?.estimatedMonthlySubsidy}
          />
        </Suspense>

        {/* Your Next Steps */}
        <NextStepsSection actionItems={recommendation.actionItems} />

        {/* Other Options to Consider */}
        <AlternativeOptions options={recommendation.alternativeOptions} />

        {/* Add-On Insurance Recommendations */}
        {recommendation.addOnInsuranceAnalysis && (
          <AddOnInsuranceSection analysis={recommendation.addOnInsuranceAnalysis} />
        )}

        {/* Plan Comparison Table */}
        {recommendation.alternativeOptions && recommendation.alternativeOptions.length > 0 && (
          <Suspense fallback={<div className="bg-white rounded-xl shadow-lg p-8 mb-8 animate-pulse h-96" />}>
            <PlanComparisonTable
              recommended={recommendation}
              alternatives={recommendation.alternativeOptions}
            />
          </Suspense>
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
