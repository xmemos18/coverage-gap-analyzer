'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useEffect, lazy, useState } from 'react';
import { CalculatorFormData } from '@/types';
import { useInsuranceAnalysis } from '@/hooks/useInsuranceAnalysis';
import CollapsibleHeroSummary from '@/components/results/CollapsibleHeroSummary';
import CurrentInsuranceComparison from '@/components/results/CurrentInsuranceComparison';
import PersonalizedSuggestions from '@/components/results/PersonalizedSuggestions';
import CostAnalysis from '@/components/results/CostAnalysis';
import NextStepsSection from '@/components/results/NextStepsSection';
import AlternativeOptions from '@/components/results/AlternativeOptions';
import AddOnInsuranceSection from '@/components/results/AddOnInsuranceSection';
import DisclaimerSection from '@/components/results/DisclaimerSection';
import ResultsSkeleton from '@/components/results/ResultsSkeleton';
import ValidationError from '@/components/results/ValidationError';
import { trackEvent, trackCalculatorCompleted } from '@/lib/analytics';
import { validateURLParameters, getValidationSummary } from '@/lib/urlValidation';
import { logger, devLogger } from '@/lib/logger';
import { safeParseInt, safeParseFloat, getAverageCost } from '@/lib/urlUtils';
import { ANIMATION_DELAYS, CHART_CONFIG, DATE_FORMAT_LOCALE } from '@/lib/resultsConstants';
import CostComparisonChart from '@/components/charts/CostComparisonChart';
import CollapsibleSection from '@/components/results/CollapsibleSection';
import ResultsActions from '@/components/results/ResultsActions';
import { TabNavigation, TabPanel, TabId } from '@/components/results/TabNavigation';
import MarketplacePlans from '@/components/results/MarketplacePlans';
import MedicarePlanFinderLink from '@/components/results/MedicarePlanFinderLink';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy load heavy components
const PlanComparisonTable = lazy(() => import('@/components/results/PlanComparisonTable'));
const MedicareAdvantageDetails = lazy(() => import('@/components/results/specialized/MedicareAdvantageDetails'));
const COBRADetails = lazy(() => import('@/components/results/specialized/COBRADetails'));
const HSADetails = lazy(() => import('@/components/results/specialized/HSADetails'));

function ResultsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'summary';
  const [activeTab, setActiveTab] = useState<TabId>(tabParam as TabId);

  // Parse URL parameters
  const residenceZipsStr = searchParams.get('residenceZips') || '';
  const residenceStatesStr = searchParams.get('residenceStates') || '';
  const adultAgesStr = searchParams.get('adultAges') || '';
  const childAgesStr = searchParams.get('childAges') || '';
  const chronicConditionsStr = searchParams.get('chronicConditions') || '';

  const parsedParams = useMemo(() => {
    const residenceZips = residenceZipsStr ? residenceZipsStr.split(',').filter(s => s.trim() !== '') : [];
    const residenceStates = residenceStatesStr ? residenceStatesStr.split(',').filter(s => s.trim() !== '') : [];
    const adultAges = adultAgesStr ? adultAgesStr.split(',').filter(s => s.trim() !== '').map(Number).filter(n => !isNaN(n) && n > 0) : [];
    const childAges = childAgesStr ? childAgesStr.split(',').filter(s => s.trim() !== '').map(Number).filter(n => !isNaN(n) && n >= 0) : [];
    const chronicConditions = chronicConditionsStr ? chronicConditionsStr.split(',').filter(s => s.trim() !== '') : [];

    const residences = residenceZips.map((zip, index) => ({
      zip: zip || '',
      state: residenceStates[index] || residenceStates[0] || '',
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
  }, [residenceZipsStr, residenceStatesStr, adultAgesStr, childAgesStr, chronicConditionsStr]);

  const { residenceZips, residenceStates, residences, adultAges, childAges, chronicConditions } = parsedParams;

  // Parse other parameters with proper NaN handling
  const numAdults = safeParseInt(searchParams.get('numAdults'), 0);
  const numChildren = safeParseInt(searchParams.get('numChildren'), 0);
  const hasMedicareEligible = searchParams.get('hasMedicareEligible') === 'true';
  const hasEmployerInsurance = searchParams.get('hasEmployerInsurance') === 'true';
  const employerContribution = safeParseInt(searchParams.get('employerContribution'), 0);
  const hasChronicConditions = searchParams.get('hasChronicConditions') === 'true';
  const prescriptionCount = searchParams.get('prescriptionCount') || '';
  const providerPreference = searchParams.get('providerPreference') || '';
  const budget = searchParams.get('budget') || '';
  const incomeRange = searchParams.get('incomeRange') || '';
  const simpleMode = searchParams.get('simpleMode') === 'true';
  const hasCurrentInsurance = searchParams.get('hasCurrentInsurance') === 'true';
  const currentCarrier = searchParams.get('currentCarrier') || '';
  const currentPlanType = searchParams.get('currentPlanType') || '';
  const currentMonthlyCost = safeParseFloat(searchParams.get('currentMonthlyCost'), 0);
  const currentDeductible = safeParseFloat(searchParams.get('currentDeductible'), 0);
  const currentOutOfPocketMax = safeParseFloat(searchParams.get('currentOutOfPocketMax'), 0);
  const currentCoverageNotes = searchParams.get('currentCoverageNotes') || '';

  // Validate URL parameters
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

  const hasRequiredData = validationResult.isValid;

  // Reconstruct form data
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
    interestedInAddOns: true,
  }), [residences, numAdults, adultAges, numChildren, childAges, hasMedicareEligible, hasEmployerInsurance, employerContribution, hasChronicConditions, chronicConditions, prescriptionCount, providerPreference, hasCurrentInsurance, currentCarrier, currentPlanType, currentMonthlyCost, currentDeductible, currentOutOfPocketMax, currentCoverageNotes, budget, incomeRange, simpleMode]);

  // Get insurance analysis
  const { recommendation, medicareAdvantageAnalysis, cobraAnalysis, hsaAnalysis, isLoading } = useInsuranceAnalysis({
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

  // Track analytics
  useEffect(() => {
    if (hasRequiredData && recommendation) {
      trackEvent('results_viewed');
      trackCalculatorCompleted(
        numAdults,
        adultAges.length,
        numChildren,
        hasMedicareEligible
      );
    }
  }, [hasRequiredData, recommendation, numAdults, adultAges, numChildren, hasMedicareEligible]);

  // Loading state
  if (isLoading) {
    return <ResultsSkeleton />;
  }

  // Validation errors
  if (!hasRequiredData) {
    return <ValidationError errors={validationResult.errors} warnings={validationResult.warnings} />;
  }

  // No recommendation available
  if (!recommendation) return null;

  // Count specialized analyses
  const specializedCount = [medicareAdvantageAnalysis, cobraAnalysis, hsaAnalysis].reduce((count, item) => count + (item ? 1 : 0), 0);

  // Build tabs dynamically
  const tabs = [
    { id: 'summary' as TabId, label: 'Summary', icon: '📋', ariaLabel: 'View summary of your insurance recommendations' },
    { id: 'costs' as TabId, label: 'Costs', icon: '💰', ariaLabel: 'View detailed cost analysis and marketplace plans' },
    recommendation.alternativeOptions && recommendation.alternativeOptions.length > 0
      ? { id: 'alternatives' as TabId, label: 'Alternatives', icon: '🔍', badge: recommendation.alternativeOptions.length, ariaLabel: 'View alternative insurance options' }
      : null,
    specializedCount > 0
      ? { id: 'specialized' as TabId, label: 'Specialized', icon: '🏥', badge: specializedCount, ariaLabel: 'View specialized insurance analysis (Medicare, COBRA, HSA)' }
      : null,
    recommendation.addOnInsuranceAnalysis
      ? { id: 'addons' as TabId, label: 'Add-Ons', icon: '➕', badge: recommendation.addOnInsuranceAnalysis.highPriority.length, ariaLabel: 'View add-on insurance options' }
      : null,
    { id: 'steps' as TabId, label: 'Next Steps', icon: '✅', ariaLabel: 'View next steps to enroll in coverage' },
  ].filter(Boolean) as Array<{ id: TabId; label: string; icon: string; badge?: number; ariaLabel: string }>;

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-4">
      {/* Redesign Preview Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 text-center text-sm shadow-lg print:hidden">
        <span className="font-semibold">✨ New Mobile-First Design Available!</span>{' '}
        <a
          href={`/results-redesign?${searchParams.toString()}`}
          className="underline hover:text-purple-100 font-medium"
          aria-label="Preview the new mobile-first design for results page"
        >
          Preview the redesign →
        </a>
      </div>

      <div className="container-max">
        {/* Print-only header */}
        <div className="hidden print:block mb-8">
          <div className="border-b-2 border-gray-300 pb-4 mb-4">
            <h1 className="text-2xl font-bold">Key Insurance Matters Results</h1>
            <p className="text-sm text-gray-600">
              Generated on {new Date().toLocaleDateString(DATE_FORMAT_LOCALE)} at {new Date().toLocaleTimeString(DATE_FORMAT_LOCALE)}
            </p>
          </div>
        </div>

        {/* Sticky Toolbar (Desktop) / FAB (Mobile) */}
        <ResultsActions
          recommendation={recommendation}
          formData={{
            residences: residences.map((r): { zip: string; state: string } => ({ zip: r.zip, state: r.state })),
            numAdults,
            numChildren,
            adultAges,
            childAges,
            budget,
            incomeRange,
          }}
        />

        {/* Page Header */}
        <div className="text-center mb-8 md:mb-10 print:hidden fade-in">
          <h1 className="heading-1 mb-3">
            Your Personalized Insurance Recommendations
          </h1>
          <p className="body-text text-gray-600" style={{animationDelay: ANIMATION_DELAYS.HEADER}}>
            Based on your household situation and coverage needs
          </p>

          {simpleMode && (
            <div className="mt-4 inline-flex items-center gap-2 badge-blue">
              <span>🎯</span>
              <span>Simple Mode Results</span>
            </div>
          )}
        </div>

        {/* Trust Signals Bar */}
        <div className="card mb-6 md:mb-8 fade-in" style={{animationDelay: ANIMATION_DELAYS.TRUST_BAR}}>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-xl">🔒</span>
              <span className="text-gray-700 font-medium">HIPAA Compliant</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xl">✓</span>
              <span className="text-gray-700 font-medium">CMS Data Verified</span>
            </div>
          </div>
        </div>

        {/* Collapsible Hero Summary */}
        <CollapsibleHeroSummary
          coverageGapScore={recommendation.coverageGapScore}
          recommendedInsurance={recommendation.recommendedInsurance}
          householdBreakdown={recommendation.householdBreakdown}
          estimatedMonthlyCost={recommendation.estimatedMonthlyCost}
          reasoning={recommendation.reasoning}
        />

        {/* Tabbed Content */}
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
          {/* SUMMARY TAB */}
          <TabPanel value="summary" activeTab={activeTab}>
            <div className="space-y-6 md:space-y-8">
              {/* Current Insurance Comparison (if provided) */}
              {recommendation.currentInsuranceSummary && recommendation.costComparison && (
                <CurrentInsuranceComparison
                  currentInsuranceSummary={recommendation.currentInsuranceSummary}
                  costComparison={recommendation.costComparison}
                  improvementAreas={recommendation.improvementAreas || []}
                />
              )}

              {/* Personalized Suggestions */}
              {recommendation.suggestions && recommendation.suggestions.length > 0 && (
                <PersonalizedSuggestions suggestions={recommendation.suggestions} />
              )}

              {/* Cost Comparison Chart */}
              {recommendation.alternativeOptions && recommendation.alternativeOptions.length > 0 && (
                <div className="glass-card rounded-3xl p-6 md:p-8">
                  <CostComparisonChart
                    data={[
                      {
                        name: 'Recommended',
                        cost: recommendation.estimatedMonthlyCost,
                        color: CHART_CONFIG.COLORS.RECOMMENDED,
                      },
                      ...recommendation.alternativeOptions.slice(0, 3).map((alt, idx) => ({
                        name: alt.name,
                        cost: getAverageCost(alt.monthlyCost),
                        color: [CHART_CONFIG.COLORS.ALTERNATIVE_1, CHART_CONFIG.COLORS.ALTERNATIVE_2, CHART_CONFIG.COLORS.ALTERNATIVE_3][idx] || CHART_CONFIG.COLORS.FALLBACK,
                      })),
                    ]}
                    title="Monthly Premium Comparison"
                    height={CHART_CONFIG.HEIGHT}
                  />
                  <p className="text-sm text-gray-600 text-center mt-4">
                    * Costs shown are estimates. Actual premiums may vary.
                  </p>
                </div>
              )}
            </div>
          </TabPanel>

          {/* COSTS TAB */}
          <TabPanel value="costs" activeTab={activeTab}>
            <div className="space-y-6 md:space-y-8">
              <CostAnalysis
                monthlyCost={recommendation.estimatedMonthlyCost}
                budget={budget}
                currentCost={hasCurrentInsurance ? currentMonthlyCost : undefined}
                subsidyAmount={recommendation.subsidyAnalysis?.estimatedMonthlySubsidy}
                costAfterSubsidy={recommendation.subsidyAnalysis?.estimatedAfterSubsidyCost}
              />

              {/* Real Marketplace Plans (if available) */}
              {recommendation.marketplaceDataAvailable && recommendation.marketplacePlans && recommendation.marketplacePlans.length > 0 && (
                <MarketplacePlans plans={recommendation.marketplacePlans} />
              )}

              {/* Message when API key is not configured */}
              {!recommendation.marketplaceDataAvailable && (
                <div className="glass-card-accent rounded-2xl p-6 shadow-lg">
                  <h4 className="text-base font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    <span>Want to see real marketplace plans?</span>
                  </h4>
                  <p className="text-sm text-blue-800 mb-4 leading-relaxed">
                    Configure the Healthcare.gov API to show actual plans available in your area with real premium costs.
                  </p>
                  <a
                    href="https://developer.cms.gov/marketplace-api/key-request.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 glass-button px-4 py-2 rounded-xl text-sm font-bold text-blue-700 hover:text-blue-900"
                  >
                    <span>Request Free API Key</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </TabPanel>

          {/* ALTERNATIVES TAB */}
          <TabPanel value="alternatives" activeTab={activeTab}>
            <div className="space-y-6 md:space-y-8">
              <AlternativeOptions options={recommendation.alternativeOptions || []} />

              {/* Plan Comparison Table */}
              {recommendation.alternativeOptions && recommendation.alternativeOptions.length > 0 && (
                <ErrorBoundary
                  fallback={
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Unable to load plan comparison</h4>
                      <p className="text-sm text-yellow-800">
                        The detailed plan comparison table could not be loaded. You can still view alternative options above.
                      </p>
                    </div>
                  }
                >
                  <Suspense fallback={<div className="bg-white rounded-xl shadow-lg p-8 animate-pulse h-96" />}>
                    <PlanComparisonTable
                      recommended={recommendation}
                      alternatives={recommendation.alternativeOptions}
                    />
                  </Suspense>
                </ErrorBoundary>
              )}
            </div>
          </TabPanel>

          {/* SPECIALIZED TAB */}
          <TabPanel value="specialized" activeTab={activeTab}>
            <div className="space-y-6 md:space-y-8">
              {/* Medicare Advantage Analysis */}
              {medicareAdvantageAnalysis && (
                <>
                  <CollapsibleSection
                    title="Medicare vs Medicare Advantage"
                    icon="🏥"
                    colorScheme="blue"
                    summary={
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-2xl">
                            {medicareAdvantageAnalysis.analysis.isGoodFit ? '✅' : '⚠️'}
                          </span>
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900 mb-1">
                              Medicare Advantage {medicareAdvantageAnalysis.analysis.isGoodFit ? 'May Work For You' : 'May Not Be Ideal'}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Confidence: <span className="font-semibold capitalize">{medicareAdvantageAnalysis.analysis.confidenceLevel}</span>
                            </p>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {medicareAdvantageAnalysis.analysis.reasoning.slice(0, 2).map((reason, idx) => (
                                <li key={idx}>• {reason}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <ErrorBoundary
                      fallback={
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                          <h4 className="font-semibold text-yellow-900 mb-2">Unable to load Medicare Advantage details</h4>
                          <p className="text-sm text-yellow-800">
                            The detailed Medicare Advantage analysis could not be loaded. Please try refreshing the page.
                          </p>
                        </div>
                      }
                    >
                      <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-xl h-64" />}>
                        <MedicareAdvantageDetails analysis={medicareAdvantageAnalysis} />
                      </Suspense>
                    </ErrorBoundary>
                  </CollapsibleSection>

                  {/* Medicare Plan Finder Link */}
                  <MedicarePlanFinderLink
                    zipCode={residenceZipsStr?.split(',')[0] || ''}
                    recommendationType={medicareAdvantageAnalysis.analysis.isGoodFit ? 'both' : 'medigap'}
                  />
                </>
              )}

              {/* COBRA Analysis */}
              {cobraAnalysis && (
                <CollapsibleSection
                  title="COBRA Continuation Coverage"
                  icon="💼"
                  colorScheme="orange"
                  summary={
                    <div>
                      <div className={`mb-4 rounded-lg p-4 ${
                        cobraAnalysis.analysis.isWorthIt
                          ? 'bg-green-50 border border-green-300'
                          : 'bg-yellow-50 border border-yellow-300'
                      }`}>
                        <h4 className="font-bold text-base mb-2">
                          {cobraAnalysis.analysis.isWorthIt ? '✅ COBRA May Be Worth It' : '⚠️ Consider Alternatives'}
                        </h4>
                        <p className="text-sm text-gray-800">{cobraAnalysis.analysis.recommendation}</p>
                      </div>
                      <div className="text-sm text-gray-700">
                        <strong>Estimated Cost:</strong> ${cobraAnalysis.analysis.estimatedMonthlyCost.low.toFixed(0)} - ${cobraAnalysis.analysis.estimatedMonthlyCost.high.toFixed(0)}/month
                      </div>
                    </div>
                  }
                >
                  <ErrorBoundary
                    fallback={
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                        <h4 className="font-semibold text-yellow-900 mb-2">Unable to load COBRA details</h4>
                        <p className="text-sm text-yellow-800">
                          The detailed COBRA analysis could not be loaded. Please try refreshing the page.
                        </p>
                      </div>
                    }
                  >
                    <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-xl h-64" />}>
                      <COBRADetails analysis={cobraAnalysis} />
                    </Suspense>
                  </ErrorBoundary>
                </CollapsibleSection>
              )}

              {/* HSA Analysis */}
              {hsaAnalysis && (
                <CollapsibleSection
                  title="HSA Tax Benefits"
                  icon="💰"
                  colorScheme="green"
                  summary={
                    <div>
                      <p className="text-sm text-gray-700 mb-4">
                        You&apos;re an excellent candidate for a Health Savings Account (HSA) with triple tax advantages.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-100 rounded p-3">
                          <div className="text-xs text-gray-600">Annual Tax Savings</div>
                          <div className="text-xl font-bold text-green-700">
                            ${hsaAnalysis.analysis.taxSavings.total.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-blue-100 rounded p-3">
                          <div className="text-xs text-gray-600">Max Contribution</div>
                          <div className="text-xl font-bold text-blue-700">
                            ${hsaAnalysis.analysis.maxContribution.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <ErrorBoundary
                    fallback={
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                        <h4 className="font-semibold text-yellow-900 mb-2">Unable to load HSA details</h4>
                        <p className="text-sm text-yellow-800">
                          The detailed HSA analysis could not be loaded. Please try refreshing the page.
                        </p>
                      </div>
                    }
                  >
                    <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-xl h-64" />}>
                      <HSADetails analysis={hsaAnalysis} />
                    </Suspense>
                  </ErrorBoundary>
                </CollapsibleSection>
              )}
            </div>
          </TabPanel>

          {/* ADD-ONS TAB */}
          <TabPanel value="addons" activeTab={activeTab}>
            {recommendation.addOnInsuranceAnalysis && (
              <AddOnInsuranceSection analysis={recommendation.addOnInsuranceAnalysis} />
            )}
          </TabPanel>

          {/* NEXT STEPS TAB */}
          <TabPanel value="steps" activeTab={activeTab}>
            <NextStepsSection actionItems={recommendation.actionItems} />
            <DisclaimerSection />
          </TabPanel>
        </TabNavigation>

        {/* Methodology Transparency Section */}
        <div className="mt-8 card-info print:hidden">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span>How We Calculate Recommendations</span>
          </h4>
          <p className="text-sm text-blue-800 leading-relaxed mb-3">
            Our recommendations are based on your household size, location, income, health needs, and budget.
            We analyze coverage options from marketplace plans, Medicare programs, and specialized insurance
            using data from CMS, state insurance departments, and major carriers.
          </p>
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> These are estimates for educational purposes. Final costs depend on specific
            plan selection, carrier underwriting, and enrollment timing. Always verify details with carriers
            before enrolling.
          </p>
        </div>
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
