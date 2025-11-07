'use client';

import { Suspense, useMemo, useEffect, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useInsuranceAnalysis } from '@/hooks/useInsuranceAnalysis';
import { AlternativeOption, CalculatorFormData } from '@/types';
import HeroCard from '@/components/results/HeroCard';
import WhyThisRecommendation from '@/components/results/WhyThisRecommendation';
import ComparisonSection from '@/components/results/ComparisonSection';
import QuickComparisonTable from '@/components/results/QuickComparisonTable';
import ShoppingTips from '@/components/results/ShoppingTips';
import CostBreakdownSection from '@/components/results/CostBreakdownSection';
import CTASection from '@/components/results/CTASection';
import ResultsSkeleton from '@/components/results/ResultsSkeleton';
import CurrentInsuranceComparison from '@/components/results/CurrentInsuranceComparison';
import PersonalizedSuggestions from '@/components/results/PersonalizedSuggestions';
import CostAnalysis from '@/components/results/CostAnalysis';
import NextStepsSection from '@/components/results/NextStepsSection';
import AlternativeOptions from '@/components/results/AlternativeOptions';
import AddOnInsuranceSection from '@/components/results/AddOnInsuranceSection';
import DisclaimerSection from '@/components/results/DisclaimerSection';
import ValidationError from '@/components/results/ValidationError';
import { trackEvent, trackCalculatorCompleted } from '@/lib/analytics';
import { validateURLParameters, getValidationSummary } from '@/lib/urlValidation';
import { logger, devLogger } from '@/lib/logger';
import CostComparisonChart from '@/components/charts/CostComparisonChart';
import CollapsibleSection from '@/components/results/CollapsibleSection';
import ResultsActions from '@/components/results/ResultsActions';
import MarketplacePlans from '@/components/results/MarketplacePlans';
import MedicarePlanFinderLink from '@/components/results/MedicarePlanFinderLink';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';

// Lazy load heavy components
const PlanComparisonTable = lazy(() => import('@/components/results/PlanComparisonTable'));

function ResultsRedesignContent() {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  // Parse URL parameters (same as production results page)
  const residenceZipsStr = searchParams.get('residenceZips') || '';
  const residenceStatesStr = searchParams.get('residenceStates') || '';

  const parsedParams = useMemo(() => {
    const residenceZips = residenceZipsStr ? residenceZipsStr.split(',') : [];
    const residenceStates = residenceStatesStr ? residenceStatesStr.split(',') : [];
    const adultAgesStr = searchParams.get('adultAges') || '';
    const adultAges = adultAgesStr ? adultAgesStr.split(',').map(Number).filter(n => !isNaN(n)) : [];
    const childAgesStr = searchParams.get('childAges') || '';
    const childAges = childAgesStr ? childAgesStr.split(',').map(Number).filter(n => !isNaN(n)) : [];
    const chronicConditionsStr = searchParams.get('chronicConditions') || '';
    const chronicConditions = chronicConditionsStr ? chronicConditionsStr.split(',') : [];

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

  const safeParseInt = (value: string | null, defaultValue: number = 0): number => {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
  };

  const safeParseFloat = (value: string | null, defaultValue: number = 0): number => {
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
  };

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

  const formData = useMemo(() => ({
    residences,
    numAdults,
    numChildren,
    adultAges,
    childAges,
    hasMedicareEligible,
    hasEmployerInsurance,
    employerContribution,
    hasChronicConditions,
    chronicConditions,
    prescriptionCount,
    providerPreference,
    budget,
    incomeRange,
    simpleMode,
    hasCurrentInsurance,
    currentStep: 4,
    interestedInAddOns: true,
    currentInsurance: hasCurrentInsurance ? {
      carrier: currentCarrier,
      planType: currentPlanType,
      monthlyCost: currentMonthlyCost,
      deductible: currentDeductible,
      outOfPocketMax: currentOutOfPocketMax,
      coverageNotes: currentCoverageNotes,
    } : {
      carrier: '',
      planType: '',
      monthlyCost: 0,
      deductible: 0,
      outOfPocketMax: 0,
      coverageNotes: '',
    },
  }), [
    residences, numAdults, numChildren, adultAges, childAges,
    hasMedicareEligible, hasEmployerInsurance, employerContribution,
    hasChronicConditions, chronicConditions, prescriptionCount,
    providerPreference, budget, incomeRange, simpleMode,
    hasCurrentInsurance, currentCarrier, currentPlanType,
    currentMonthlyCost, currentDeductible, currentOutOfPocketMax,
    currentCoverageNotes,
  ]);

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

  // Get insurance analysis
  const { recommendation, medicareAdvantageAnalysis, cobraAnalysis, hsaAnalysis } = useInsuranceAnalysis({
    formData,
    adultAges,
    numAdults,
    numChildren,
    residenceStates: residences.map(r => r.state),
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

  // Error state
  if (!hasRequiredData) {
    return <ValidationError errors={validationResult.errors} warnings={validationResult.warnings} />;
  }

  if (!recommendation) {
    return <ResultsSkeleton />;
  }
  const state = residences[0]?.state || 'CA';

  // Prepare component data
  const heroData = {
    score: recommendation.coverageGapScore,
    planType: recommendation.recommendedInsurance,
    priceRange: recommendation.estimatedMonthlyCost,
    eligibilityDescription: `${numAdults} adult${numAdults !== 1 ? 's' : ''}${numChildren > 0 ? `, ${numChildren} child${numChildren !== 1 ? 'ren' : ''}` : ''} • ${state}`,
  };

  const whyData = {
    explanation: recommendation.reasoning,
    features: recommendation.actionItems.slice(0, 4).map((item, i) => ({
      id: `${i}`,
      text: item,
    })),
    bestForDescription: 'Based on your household size, location, and stated preferences',
    isMobile,
  };

  const comparisonData = {
    title: 'Compare Your Options',
    subtitle: recommendation.alternativeOptions.length > 0 ? 'See how different plans stack up' : '',
    options: recommendation.alternativeOptions.slice(0, 3).map((option: AlternativeOption) => ({
      id: option.name.toLowerCase().replace(/\s+/g, '-'),
      name: option.name,
      description: option.pros[0] || '',
      monthlyEstimate: `$${option.monthlyCost.low}-$${option.monthlyCost.high}`,
      confidenceLevel: (option.coverageScore >= 80 ? 'high' : option.coverageScore >= 60 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      isRecommended: false,
      benefits: option.pros.length > 0 ? option.pros : [`Coverage Score: ${option.coverageScore}/100`],
      drawbacks: option.cons,
      bestFor: option.pros[0] || 'Alternative coverage option',
      actionLabel: 'Learn More',
    })),
  };

  const quickComparisonData = {
    primaryOption: { name: recommendation.recommendedInsurance },
    alternativeOption: { name: recommendation.alternativeOptions[0]?.name || 'Other Options' },
    features: [
      {
        name: 'Monthly Cost',
        primary: {
          value: `$${recommendation.estimatedMonthlyCost.low}-$${recommendation.estimatedMonthlyCost.high}`,
          icon: 'check' as const,
        },
        alternative: {
          value: recommendation.alternativeOptions[0] ? `$${recommendation.alternativeOptions[0].monthlyCost.low}-$${recommendation.alternativeOptions[0].monthlyCost.high}` : 'Varies',
          icon: 'dash' as const,
        },
      },
      {
        name: 'Coverage Score',
        primary: {
          value: `${recommendation.coverageGapScore}/100`,
          icon: recommendation.coverageGapScore >= 80 ? 'check' as const : 'warning' as const,
        },
        alternative: {
          value: recommendation.alternativeOptions[0] ? `${recommendation.alternativeOptions[0].coverageScore}/100` : 'N/A',
          icon: 'dash' as const,
        },
      },
    ],
    recommendation: 'Based on your situation, we recommend the plan shown on the left',
    isMobile,
  };

  const shoppingTipsData = {
    tips: [
      {
        title: 'Compare Plans Carefully',
        description: 'Review coverage details, provider networks, and out-of-pocket costs before making a decision.',
      },
      {
        title: 'Check Enrollment Periods',
        description: 'Different insurance types have specific enrollment windows. Make sure you know your deadlines.',
      },
      {
        title: 'Consider Total Cost',
        description: 'Look beyond monthly premiums - factor in deductibles, copays, and out-of-pocket maximums.',
      },
    ],
    insuranceType: recommendation.recommendedInsurance,
    isMobile,
  };

  const costBreakdownData = {
    insuranceType: recommendation.recommendedInsurance,
    costs: [
      {
        name: 'Monthly Premium',
        amount: {
          min: recommendation.estimatedMonthlyCost.low,
          max: recommendation.estimatedMonthlyCost.high,
        },
        required: true,
        note: 'Estimated based on your household and location',
      },
    ],
    userBudget: budget ? {
      min: parseInt(budget.split('-')[0] || '0'),
      max: parseInt(budget.split('-')[1]?.replace('plus', '999999') || '999999'),
    } : undefined,
  };

  const ctaData = {
    insuranceType: recommendation.recommendedInsurance,
    userState: state,
    primaryCTA: {
      text: 'Find Plans',
      url: recommendation.recommendedInsurance.includes('Medicare')
        ? 'https://www.medicare.gov/plan-compare/'
        : 'https://www.healthcare.gov/',
    },
    secondaryCTAs: [
      {
        text: 'Get Local Help',
        url: 'https://www.healthcare.gov/find-assistance/',
        description: 'Find local assistance',
      },
    ],
    isMobile,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Beta Badge */}
      <div className="bg-blue-600 text-white py-2 px-4 text-center text-sm print:hidden">
        <span className="font-semibold">🎨 Redesign Preview</span> - This is the new mobile-first design.{' '}
        <Link href={`/results?${searchParams.toString()}`} className="underline hover:text-blue-100">
          View original version
        </Link>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block px-4 py-8">
        <div className="border-b-2 border-gray-300 pb-4 mb-4">
          <h1 className="text-2xl font-bold">Key Insurance Matters Results</h1>
          <p className="text-sm text-gray-600">
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
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

      <main className="container-max py-8 md:py-12">
        {/* Page Header */}
        <div className="text-center mb-8 md:mb-10 print:hidden">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Your Personalized Insurance Recommendations
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            Based on your household situation and coverage needs
          </p>

          {simpleMode && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              <span>🎯</span>
              <span>Simple Mode Results</span>
            </div>
          )}
        </div>

        {/* Trust Signals Bar */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 md:mb-8 print:hidden">
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
        {/* Hero Card */}
        <HeroCard {...heroData} />

        {/* Why This Recommendation */}
        <WhyThisRecommendation {...whyData} />

        {/* Current Insurance Comparison (if provided) */}
        {recommendation.currentInsuranceSummary && recommendation.costComparison && (
          <div className="mt-8 md:mt-12">
            <CurrentInsuranceComparison
              currentInsuranceSummary={recommendation.currentInsuranceSummary}
              costComparison={recommendation.costComparison}
              improvementAreas={recommendation.improvementAreas || []}
            />
          </div>
        )}

        {/* Personalized Suggestions */}
        {recommendation.suggestions && recommendation.suggestions.length > 0 && (
          <div className="mt-8 md:mt-12">
            <PersonalizedSuggestions suggestions={recommendation.suggestions} />
          </div>
        )}

        {/* Cost Comparison Chart */}
        {recommendation.alternativeOptions && recommendation.alternativeOptions.length > 0 && (
          <div className="mt-8 md:mt-12 bg-white rounded-2xl shadow-lg p-6 md:p-8">
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
              height={300}
            />
            <p className="text-sm text-gray-600 text-center mt-4">
              * Costs shown are estimates. Actual premiums may vary.
            </p>
          </div>
        )}

        {/* Comparison Section */}
        {comparisonData.options.length > 0 && (
          <ComparisonSection {...comparisonData} />
        )}

        {/* Quick Comparison Table */}
        {recommendation.alternativeOptions.length > 0 && (
          <QuickComparisonTable {...quickComparisonData} />
        )}

        {/* Alternative Options with Plan Comparison Table */}
        {recommendation.alternativeOptions && recommendation.alternativeOptions.length > 0 && (
          <div className="mt-8 md:mt-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">All Your Options</h2>
            <AlternativeOptions options={recommendation.alternativeOptions} />

            {/* Plan Comparison Table */}
            <div className="mt-6">
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
            </div>
          </div>
        )}

        {/* Cost Analysis with Marketplace Plans */}
        <div className="mt-8 md:mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Detailed Cost Analysis</h2>
          <CostAnalysis
            monthlyCost={recommendation.estimatedMonthlyCost}
            budget={budget}
            currentCost={hasCurrentInsurance ? currentMonthlyCost : undefined}
            subsidyAmount={recommendation.subsidyAnalysis?.estimatedMonthlySubsidy}
            costAfterSubsidy={recommendation.subsidyAnalysis?.estimatedAfterSubsidyCost}
          />

          {/* Real Marketplace Plans (if available) */}
          {recommendation.marketplaceDataAvailable && recommendation.marketplacePlans && recommendation.marketplacePlans.length > 0 && (
            <div className="mt-6">
              <MarketplacePlans plans={recommendation.marketplacePlans} />
            </div>
          )}

          {/* Message when API key is not configured */}
          {!recommendation.marketplaceDataAvailable && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
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
                className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-bold text-blue-700 hover:text-blue-900 border border-blue-200 hover:border-blue-300 transition-colors"
              >
                <span>Request Free API Key</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Shopping Tips */}
        <ShoppingTips {...shoppingTipsData} />

        {/* Cost Breakdown */}
        <CostBreakdownSection {...costBreakdownData} />

        {/* CTA Section */}
        <CTASection {...ctaData} />

        {/* Specialized Analyses: Medicare, COBRA, HSA */}
        {(medicareAdvantageAnalysis || cobraAnalysis || hsaAnalysis) && (
          <div className="mt-8 md:mt-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Specialized Analysis</h2>

            {/* Medicare Advantage Analysis */}
            {medicareAdvantageAnalysis && (
              <div className="mb-6">
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
                  <MedicareAdvantageDetails analysis={medicareAdvantageAnalysis} />
                </CollapsibleSection>

                {/* Medicare Plan Finder Link */}
                <div className="mt-4">
                  <MedicarePlanFinderLink
                    zipCode={residenceZipsStr.split(',')[0] || ''}
                    recommendationType={medicareAdvantageAnalysis.analysis.isGoodFit ? 'both' : 'medigap'}
                  />
                </div>
              </div>
            )}

            {/* COBRA Analysis */}
            {cobraAnalysis && (
              <div className="mb-6">
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
                  <COBRADetails analysis={cobraAnalysis} />
                </CollapsibleSection>
              </div>
            )}

            {/* HSA Analysis */}
            {hsaAnalysis && (
              <div className="mb-6">
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
                  <HSADetails analysis={hsaAnalysis} />
                </CollapsibleSection>
              </div>
            )}
          </div>
        )}

        {/* Add-On Insurance Section */}
        {recommendation.addOnInsuranceAnalysis && (
          <div className="mt-8 md:mt-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Supplemental Insurance Options</h2>
            <AddOnInsuranceSection analysis={recommendation.addOnInsuranceAnalysis} />
          </div>
        )}

        {/* Next Steps Section */}
        <div className="mt-8 md:mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">What You Should Do Next</h2>
          <NextStepsSection actionItems={recommendation.actionItems} />
        </div>

        {/* Disclaimer Section */}
        <div className="mt-8 md:mt-12">
          <DisclaimerSection />
        </div>

        {/* Methodology Transparency Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 print:hidden">
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

        {/* Back to Original */}
        <div className="mt-12 text-center">
          <Link
            href="/results"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            View Original Version
          </Link>
        </div>
      </main>
    </div>
  );
}

// Helper components for specialized sections
interface MedicareAdvantageAnalysis {
  analysis: {
    isGoodFit: boolean;
    confidenceLevel: string;
    reasoning: string[];
    pros: string[];
    cons: string[];
    redFlags: string[];
  };
  comparison: {
    medigapAdvantages: string[];
    medicareAdvantageAdvantages: string[];
    recommendation: string;
  };
  shoppingTips: string[];
}

function MedicareAdvantageDetails({ analysis }: { analysis: MedicareAdvantageAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Pros and Cons */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <span>✅</span> Benefits
          </h5>
          <ul className="space-y-2 text-sm text-gray-700">
            {analysis.analysis.pros.map((pro: string, idx: number) => (
              <li key={idx} className="flex gap-2">
                <span className="text-green-600 flex-shrink-0">•</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h5 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
            <span>⚠️</span> Drawbacks
          </h5>
          <ul className="space-y-2 text-sm text-gray-700">
            {analysis.analysis.cons.map((con: string, idx: number) => (
              <li key={idx} className="flex gap-2">
                <span className="text-orange-600 flex-shrink-0">•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Red Flags */}
      {analysis.analysis.redFlags.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
            <span>🚨</span> Important Considerations
          </h5>
          <ul className="space-y-2 text-sm text-gray-800">
            {analysis.analysis.redFlags.map((flag: string, idx: number) => (
              <li key={idx} className="flex gap-2">
                <span className="text-red-600 flex-shrink-0">•</span>
                <span className="font-medium">{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comparison */}
      <div className="bg-white rounded-lg p-6 border border-blue-200">
        <h5 className="font-semibold text-lg text-gray-900 mb-4">Quick Comparison</h5>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h6 className="font-semibold text-blue-900 mb-2">Original Medicare + Medigap</h6>
            <ul className="space-y-1 text-sm text-gray-700">
              {analysis.comparison.medigapAdvantages.map((adv: string, idx: number) => (
                <li key={idx}>• {adv}</li>
              ))}
            </ul>
          </div>
          <div>
            <h6 className="font-semibold text-indigo-900 mb-2">Medicare Advantage</h6>
            <ul className="space-y-1 text-sm text-gray-700">
              {analysis.comparison.medicareAdvantageAdvantages.map((adv: string, idx: number) => (
                <li key={idx}>• {adv}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-gray-800 bg-blue-50 p-3 rounded border border-blue-200">
          <strong>Recommendation:</strong> {analysis.comparison.recommendation}
        </p>
      </div>

      {/* Shopping Tips */}
      <div className="bg-white rounded-lg p-6 border border-blue-200">
        <h5 className="font-semibold text-lg text-gray-900 mb-4">💡 Shopping Tips</h5>
        <ul className="space-y-2 text-sm text-gray-700">
          {analysis.shoppingTips.map((tip: string, idx: number) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface COBRAAnalysis {
  analysis: {
    isWorthIt: boolean;
    recommendation: string;
    warnings: string[];
    estimatedMonthlyCost: { low: number; high: number };
    monthsRemaining: number;
    pros: string[];
    cons: string[];
    alternatives: string[];
  };
  flowchart: Array<{
    question: string;
    yesPath: string;
    noPath: string;
  }>;
}

function COBRADetails({ analysis }: { analysis: COBRAAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Warnings */}
      {analysis.analysis.warnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          {analysis.analysis.warnings.map((warning: string, idx: number) => (
            <p key={idx} className="text-red-800 font-semibold">{warning}</p>
          ))}
        </div>
      )}

      {/* Pros and Cons Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 rounded-lg p-5 border border-green-200">
          <h5 className="font-semibold text-lg text-green-900 mb-3">✅ Pros of COBRA</h5>
          <ul className="space-y-2">
            {analysis.analysis.pros.map((pro: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-50 rounded-lg p-5 border border-red-200">
          <h5 className="font-semibold text-lg text-red-900 mb-3">❌ Cons of COBRA</h5>
          <ul className="space-y-2">
            {analysis.analysis.cons.map((con: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Decision Flowchart */}
      <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
        <h5 className="font-semibold text-lg text-blue-900 mb-4">🗺️ COBRA Decision Guide</h5>
        <div className="space-y-4">
          {analysis.flowchart.map((step, idx: number) => (
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
          {analysis.analysis.alternatives.map((alt: string, idx: number) => (
            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">→</span>
              <span>{alt}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface HSAAnalysis {
  analysis: {
    tripleTaxAdvantage: string[];
    contributionLimits: {
      individual: number;
      family: number;
      catchUp: number;
    };
    maxContribution: number;
    taxSavings: {
      federal: number;
      fica: number;
      state: number;
      total: number;
    };
    projections: {
      year1: number;
      year5: number;
      year10: number;
      retirement: number;
    };
    recommendation: string;
    benefits: string[];
    considerations: string[];
  };
  strategies: Array<{
    strategy: string;
    description: string;
    bestFor: string;
  }>;
}

function HSADetails({ analysis }: { analysis: HSAAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Triple Tax Advantage */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 border border-blue-200">
        <h4 className="font-bold text-lg mb-3">🎯 Triple Tax Advantage</h4>
        <div className="space-y-2">
          {analysis.analysis.tripleTaxAdvantage.map((advantage: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">{advantage.split(' ')[0]}</span>
              <span className="text-gray-800">{advantage.substring(advantage.indexOf(' ') + 1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contribution Limits & Tax Savings */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
          <h5 className="font-semibold text-lg text-blue-900 mb-3">📊 2024 Contribution Limits</h5>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Individual Coverage</p>
              <p className="text-2xl font-bold text-blue-600">${analysis.analysis.contributionLimits.individual.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Family Coverage</p>
              <p className="text-2xl font-bold text-blue-600">${analysis.analysis.contributionLimits.family.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-5 border border-green-200">
          <h5 className="font-semibold text-lg text-green-900 mb-3">💵 Your Annual Tax Savings</h5>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Federal Tax:</span>
              <span className="font-semibold">${analysis.analysis.taxSavings.federal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">FICA Tax:</span>
              <span className="font-semibold">${analysis.analysis.taxSavings.fica.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">State Tax:</span>
              <span className="font-semibold">${analysis.analysis.taxSavings.state.toLocaleString()}</span>
            </div>
            <div className="border-t-2 border-green-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total Savings:</span>
                <span className="text-2xl font-bold text-green-600">${analysis.analysis.taxSavings.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Projections */}
      <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
        <h5 className="font-semibold text-lg text-purple-900 mb-4">📈 Long-Term Growth Potential</h5>
        <p className="text-sm text-gray-600 mb-4">
          If you invest your HSA contributions (7% annual return):
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Year 1</p>
            <p className="text-lg font-bold text-purple-600">${analysis.analysis.projections.year1.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Year 5</p>
            <p className="text-lg font-bold text-purple-600">${analysis.analysis.projections.year5.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Year 10</p>
            <p className="text-lg font-bold text-purple-600">${analysis.analysis.projections.year10.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded p-3 text-center border-2 border-purple-300">
            <p className="text-xs text-gray-600 mb-1">Retirement</p>
            <p className="text-lg font-bold text-purple-600">${analysis.analysis.projections.retirement.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-yellow-50 rounded-lg p-5 border-2 border-yellow-300">
        <h5 className="font-bold text-lg mb-2">💡 Recommendation for You</h5>
        <p className="text-gray-800">{analysis.analysis.recommendation}</p>
      </div>

      {/* Benefits and Considerations */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 rounded-lg p-5 border border-green-200">
          <h5 className="font-semibold text-lg text-green-900 mb-3">✅ HSA Benefits</h5>
          <ul className="space-y-2">
            {analysis.analysis.benefits.map((benefit: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-orange-50 rounded-lg p-5 border border-orange-200">
          <h5 className="font-semibold text-lg text-orange-900 mb-3">⚠️ Important Considerations</h5>
          <ul className="space-y-2">
            {analysis.analysis.considerations.map((consideration: string, idx: number) => (
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
          {analysis.strategies.map((strategy, idx: number) => (
            <div key={idx} className="bg-white rounded p-4 border border-indigo-200">
              <h6 className="font-semibold text-gray-900 mb-1">{strategy.strategy}</h6>
              <p className="text-sm text-gray-700 mb-2">{strategy.description}</p>
              <p className="text-xs text-indigo-600 font-semibold">Best for: {strategy.bestFor}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResultsRedesignPage() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <ResultsRedesignContent />
    </Suspense>
  );
}
