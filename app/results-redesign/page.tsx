'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useInsuranceAnalysis } from '@/hooks/useInsuranceAnalysis';
import { AlternativeOption } from '@/types';
import HeroCard from '@/components/results/HeroCard';
import WhyThisRecommendation from '@/components/results/WhyThisRecommendation';
import ComparisonSection from '@/components/results/ComparisonSection';
import QuickComparisonTable from '@/components/results/QuickComparisonTable';
import ShoppingTips from '@/components/results/ShoppingTips';
import CostBreakdownSection from '@/components/results/CostBreakdownSection';
import CTASection from '@/components/results/CTASection';
import ResultsSkeleton from '@/components/results/ResultsSkeleton';
import Link from 'next/link';

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

  const { residences, adultAges, childAges, chronicConditions } = parsedParams;

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

  // Get insurance analysis
  const analysis = useInsuranceAnalysis({
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
    hasRequiredData: residences.length > 0 && numAdults > 0,
  });

  if (!analysis || !analysis.recommendation) {
    return <ResultsSkeleton />;
  }

  const { recommendation } = analysis;
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
      <div className="bg-blue-600 text-white py-2 px-4 text-center text-sm">
        <span className="font-semibold">🎨 Redesign Preview</span> - This is the new mobile-first design.{' '}
        <Link href="/results" className="underline hover:text-blue-100">
          View original version
        </Link>
      </div>

      <main className="container-max py-8 md:py-12">
        {/* Hero Card */}
        <HeroCard {...heroData} />

        {/* Why This Recommendation */}
        <WhyThisRecommendation {...whyData} />

        {/* Comparison Section */}
        {comparisonData.options.length > 0 && (
          <ComparisonSection {...comparisonData} />
        )}

        {/* Quick Comparison Table */}
        {recommendation.alternativeOptions.length > 0 && (
          <QuickComparisonTable {...quickComparisonData} />
        )}

        {/* Shopping Tips */}
        <ShoppingTips {...shoppingTipsData} />

        {/* Cost Breakdown */}
        <CostBreakdownSection {...costBreakdownData} />

        {/* CTA Section */}
        <CTASection {...ctaData} />

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

export default function ResultsRedesignPage() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <ResultsRedesignContent />
    </Suspense>
  );
}
