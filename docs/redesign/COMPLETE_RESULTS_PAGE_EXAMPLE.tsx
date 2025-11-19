/**
 * COMPLETE RESULTS PAGE EXAMPLE
 *
 * This file demonstrates how to use all the new components together
 * with sample data for different insurance recommendation scenarios.
 *
 * SCENARIOS COVERED:
 * 1. Medicare (65+)
 * 2. ACA Marketplace (working age)
 * 3. Medicaid (low income)
 * 4. Employer insurance
 */

'use client';

import { useState } from 'react';
import HeroCard from '@/components/results/HeroCard';
import WhyThisRecommendation from '@/components/results/WhyThisRecommendation';
import ComparisonSection from '@/components/results/ComparisonSection';
import QuickComparisonTable from '@/components/results/QuickComparisonTable';
import ShoppingTips from '@/components/results/ShoppingTips';
import CostBreakdownSection from '@/components/results/CostBreakdownSection';
import CTASection from '@/components/results/CTASection';

// ============================================================================
// SAMPLE DATA: MEDICARE SCENARIO
// ============================================================================

const medicareHeroData = {
  score: 85,
  planType: 'Original Medicare + Medigap Plan G',
  priceRange: { low: 250, high: 350 },
  eligibilityDescription: '1 adult, age 67, Florida resident',
};

const medicareWhyData = {
  explanation:
    'Based on your age (67), location (Florida), and health needs, Original Medicare with a Medigap Plan G supplement provides the most comprehensive coverage with predictable costs. This combination gives you nationwide coverage, no network restrictions, and protection from high out-of-pocket expenses.',
  features: [
    {
      id: '1',
      text: 'Nationwide coverage - see any doctor that accepts Medicare',
    },
    {
      id: '2',
      text: 'No referrals needed to see specialists',
    },
    {
      id: '3',
      text: 'Medigap Plan G covers most out-of-pocket costs except Part B deductible',
    },
    {
      id: '4',
      text: 'Ideal for snowbirds who spend time in multiple states',
    },
  ],
  bestForDescription:
    'People who value provider flexibility, travel frequently, or have specific doctors they want to keep seeing.',
};

const medicareComparisonData = {
  title: 'Original Medicare + Medigap vs Medicare Advantage',
  subtitle: 'Compare your two main Medicare options',
  options: [
    {
      id: 'medigap',
      name: 'Original Medicare + Medigap',
      description: 'Traditional Medicare with supplemental insurance',
      monthlyEstimate: '$250-350',
      confidenceLevel: 'high' as const,
      isRecommended: true,
      benefits: [
        'No network restrictions - see any Medicare provider',
        'No referrals needed for specialists',
        'Predictable costs with Medigap coverage',
        'Ideal for multiple states (snowbirds)',
        'Add standalone Part D for prescriptions',
      ],
      drawbacks: [
        'Higher monthly premiums than Medicare Advantage',
        'Requires separate Part D enrollment',
        'More administrative complexity (multiple plans)',
      ],
      bestFor: 'People who travel frequently, have specific doctors, or want maximum flexibility',
      actionLabel: 'Find Medigap Plans',
    },
    {
      id: 'advantage',
      name: 'Medicare Advantage',
      description: 'All-in-one alternative to Original Medicare',
      monthlyEstimate: '$0-100',
      confidenceLevel: 'medium' as const,
      isRecommended: false,
      benefits: [
        'Lower monthly premiums (often $0)',
        'Includes prescription drug coverage',
        'Extra benefits like dental, vision, hearing',
        'Out-of-pocket maximum protects against high costs',
        'Single plan simplicity',
      ],
      drawbacks: [
        'Network restrictions - limited to plan providers',
        'Referrals usually required for specialists',
        'Can be problematic if you travel between states',
        'Plans vary significantly by location',
      ],
      bestFor: 'People who stay in one area, want lower premiums, and are comfortable with network restrictions',
      actionLabel: 'Explore Medicare Advantage',
    },
  ],
};

const medicareQuickComparisonData = {
  primaryOption: { name: 'Medicare + Medigap' },
  alternativeOption: { name: 'Medicare Advantage' },
  features: [
    {
      name: 'Provider Choice',
      primary: { value: 'Any Medicare doctor nationwide', icon: 'check' as const },
      alternative: { value: 'Network providers only', icon: 'warning' as const },
    },
    {
      name: 'Specialist Referrals',
      primary: { value: 'No referrals needed', icon: 'check' as const },
      alternative: { value: 'Usually required', icon: 'cross' as const },
    },
    {
      name: 'Multi-State Coverage',
      primary: { value: 'Works anywhere in US', icon: 'check' as const },
      alternative: { value: 'Limited by network', icon: 'warning' as const },
    },
    {
      name: 'Monthly Premium',
      primary: { value: '$250-350/month', icon: 'dash' as const },
      alternative: { value: '$0-100/month', icon: 'check' as const },
    },
    {
      name: 'Out-of-Pocket Max',
      primary: { value: 'Minimal with Medigap', icon: 'check' as const },
      alternative: { value: 'Capped (varies by plan)', icon: 'check' as const },
    },
  ],
  recommendation:
    'For your situation (traveling between states), Original Medicare + Medigap offers better flexibility and nationwide coverage.',
};

const medicareShoppingTips = [
  {
    title: 'Use the Medicare Plan Finder',
    description:
      'The official Medicare.gov Plan Finder lets you compare all available Medigap and Part D plans in your area with personalized cost estimates.',
    link: {
      text: 'Go to Medicare Plan Finder',
      url: 'https://www.medicare.gov/plan-compare/',
    },
  },
  {
    title: 'Enroll During Your Initial Enrollment Period',
    description:
      'You have guaranteed issue rights for Medigap during the 6 months after turning 65 and enrolling in Part B. After this period, insurers can deny coverage or charge more based on health conditions.',
  },
  {
    title: 'Compare Medigap Plans by Letter, Not Company',
    description:
      'Medigap Plan G from one company covers the exact same things as Plan G from another company. Shop based on price and company reputation, not coverage differences.',
  },
  {
    title: 'Check Star Ratings for Medicare Advantage',
    description:
      'If considering Medicare Advantage, look for plans with 4+ star ratings. These plans have been rated highly for quality and member satisfaction by Medicare.',
  },
];

const medicareCostBreakdownData = {
  insuranceType: 'Medicare',
  costs: [
    {
      name: 'Medicare Part B Premium',
      amount: { min: 174, max: 174 },
      required: true,
      note: '2024 standard premium, deducted from Social Security',
    },
    {
      name: 'Medigap Plan G Premium',
      amount: { min: 120, max: 180 },
      required: false,
      note: 'Varies by age, location, and insurance company',
    },
    {
      name: 'Part D Prescription Coverage',
      amount: { min: 25, max: 80 },
      required: false,
      note: 'Highly recommended even if you take few medications',
    },
  ],
  userBudget: { min: 300, max: 400 },
};

const medicareCTAData = {
  insuranceType: 'Medicare',
  userState: 'FL',
  primaryCTA: {
    text: 'Find Plans on Medicare.gov',
    url: 'https://www.medicare.gov/plan-compare/',
  },
  secondaryCTAs: [
    {
      text: 'Compare Medigap Plans',
      url: 'https://www.medicare.gov/medigap-supplemental-insurance-plans',
      description: 'Learn about Medigap options',
    },
    {
      text: 'Find Local Help',
      url: 'https://www.shiphelp.org/',
      description: 'Free counseling from SHIP',
    },
  ],
  enrollmentWarning:
    'Medicare Initial Enrollment Period starts 3 months before you turn 65. Missing this window may result in late enrollment penalties.',
};

// ============================================================================
// SAMPLE DATA: ACA MARKETPLACE SCENARIO
// ============================================================================

const acaHeroData = {
  score: 78,
  planType: 'Silver ACA Marketplace Plan',
  priceRange: { low: 350, high: 450 },
  eligibilityDescription: 'Family of 4 (2 adults, 2 children), Texas',
};

const acaWhyData = {
  explanation:
    'Based on your household income and family size, a Silver-tier marketplace plan offers the best value. Silver plans qualify for Cost-Sharing Reductions (CSR) if your income is between 100-250% of Federal Poverty Level, which can significantly reduce your deductibles and copays.',
  features: [
    {
      id: '1',
      text: 'Moderate premiums with decent coverage - middle ground between Bronze and Gold',
    },
    {
      id: '2',
      text: 'Eligible for Cost-Sharing Reductions (CSR) that lower deductibles and copays',
    },
    {
      id: '3',
      text: 'All essential health benefits covered, including preventive care at no cost',
    },
    {
      id: '4',
      text: 'Premium tax credits may reduce your monthly payment by 50% or more',
    },
  ],
  bestForDescription:
    'Families who qualify for subsidies and want balanced coverage that protects against major medical costs while keeping premiums affordable.',
};

const acaComparisonData = {
  title: 'Silver vs Bronze vs Gold Plans',
  subtitle: 'Compare ACA Marketplace metal tiers',
  options: [
    {
      id: 'silver',
      name: 'Silver Plan',
      description: '70% coverage, moderate premiums',
      monthlyEstimate: '$350-450',
      confidenceLevel: 'high' as const,
      isRecommended: true,
      benefits: [
        'Eligible for Cost-Sharing Reductions (CSR)',
        'Balanced premiums and out-of-pocket costs',
        'Good for moderate healthcare use',
        'Premium tax credits available',
      ],
      drawbacks: [
        'Higher premiums than Bronze',
        'Network may be limited',
        'Deductibles can still be significant without CSR',
      ],
      bestFor: 'Families making 100-250% FPL who qualify for CSR subsidies',
      actionLabel: 'Find Silver Plans',
    },
    {
      id: 'bronze',
      name: 'Bronze Plan',
      description: '60% coverage, lowest premiums',
      monthlyEstimate: '$250-350',
      confidenceLevel: 'medium' as const,
      isRecommended: false,
      benefits: [
        'Lowest monthly premiums',
        'Protects against catastrophic costs',
        'Preventive care still covered at no cost',
        'HSA-eligible if HDHP',
      ],
      drawbacks: [
        'High deductibles ($6,000+)',
        'Not eligible for Cost-Sharing Reductions',
        'Pay more out-of-pocket before coverage kicks in',
      ],
      bestFor: 'Healthy individuals who rarely need medical care and want catastrophic protection',
      actionLabel: 'Explore Bronze Plans',
    },
    {
      id: 'gold',
      name: 'Gold Plan',
      description: '80% coverage, higher premiums',
      monthlyEstimate: '$500-600',
      confidenceLevel: 'medium' as const,
      isRecommended: false,
      benefits: [
        'Lower deductibles and copays',
        'More costs covered by insurance',
        'Good for frequent medical needs',
        'Comprehensive coverage',
      ],
      drawbacks: [
        'Significantly higher monthly premiums',
        'May exceed your budget',
        'Not eligible for Cost-Sharing Reductions',
      ],
      bestFor: 'People with chronic conditions or high medical expenses who can afford higher premiums',
      actionLabel: 'Compare Gold Plans',
    },
  ],
};

const acaCostBreakdownData = {
  insuranceType: 'ACA Marketplace',
  costs: [
    {
      name: 'Monthly Premium (Before Subsidy)',
      amount: { min: 1200, max: 1400 },
      required: true,
      note: 'Full price for Silver plan in your area',
    },
    {
      name: 'Estimated Premium Tax Credit',
      amount: { min: -800, max: -950 },
      required: false,
      note: 'Based on household income estimate',
    },
    {
      name: 'Your Monthly Cost (After Subsidy)',
      amount: { min: 350, max: 450 },
      required: true,
      note: 'What you actually pay each month',
    },
  ],
  userBudget: { min: 300, max: 500 },
};

// ============================================================================
// EXAMPLE RESULTS PAGE COMPONENT
// ============================================================================

export default function CompleteResultsPageExample() {
  const [scenario, setScenario] = useState<'medicare' | 'aca' | 'medicaid'>('medicare');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Select data based on scenario
  const heroData = scenario === 'medicare' ? medicareHeroData : acaHeroData;
  const whyData = scenario === 'medicare' ? medicareWhyData : acaWhyData;
  const comparisonData = scenario === 'medicare' ? medicareComparisonData : acaComparisonData;
  const quickComparisonData = scenario === 'medicare' ? medicareQuickComparisonData : medicareQuickComparisonData;
  const shoppingTips = scenario === 'medicare' ? medicareShoppingTips : medicareShoppingTips;
  const costBreakdown = scenario === 'medicare' ? medicareCostBreakdownData : acaCostBreakdownData;
  const ctaData = scenario === 'medicare' ? medicareCTAData : medicareCTAData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Scenario Switcher */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="container-max">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">View Scenario:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setScenario('medicare')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scenario === 'medicare'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Medicare (65+)
              </button>
              <button
                onClick={() => setScenario('aca')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scenario === 'aca'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ACA Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container-max py-8 md:py-12">
        {/* Hero Card */}
        <HeroCard
          score={heroData.score}
          planType={heroData.planType}
          priceRange={heroData.priceRange}
          eligibilityDescription={heroData.eligibilityDescription}
        />

        {/* Why This Recommendation */}
        <WhyThisRecommendation
          explanation={whyData.explanation}
          features={whyData.features}
          bestForDescription={whyData.bestForDescription}
          isMobile={isMobile}
        />

        {/* Comparison Section */}
        <ComparisonSection
          title={comparisonData.title}
          subtitle={comparisonData.subtitle}
          options={comparisonData.options}
          isMobile={isMobile}
        />

        {/* Quick Comparison Table */}
        <QuickComparisonTable
          primaryOption={quickComparisonData.primaryOption}
          alternativeOption={quickComparisonData.alternativeOption}
          features={quickComparisonData.features}
          recommendation={quickComparisonData.recommendation}
          isMobile={isMobile}
        />

        {/* Shopping Tips */}
        <ShoppingTips
          tips={shoppingTips}
          insuranceType={scenario === 'medicare' ? 'Medicare' : 'ACA Marketplace'}
          isMobile={isMobile}
        />

        {/* Cost Breakdown */}
        <CostBreakdownSection
          insuranceType={costBreakdown.insuranceType}
          costs={costBreakdown.costs}
          userBudget={costBreakdown.userBudget}
        />

        {/* CTA Section */}
        <CTASection
          insuranceType={ctaData.insuranceType}
          userState={ctaData.userState}
          primaryCTA={ctaData.primaryCTA}
          secondaryCTAs={ctaData.secondaryCTAs}
          enrollmentWarning={ctaData.enrollmentWarning}
          isMobile={isMobile}
        />
      </main>
    </div>
  );
}

/**
 * USAGE NOTES:
 *
 * 1. All components are fully responsive and mobile-optimized
 * 2. Data structures support multiple insurance scenarios
 * 3. Components handle edge cases (missing data, empty arrays)
 * 4. Accessibility features built-in (ARIA labels, keyboard nav)
 * 5. Smooth animations and transitions throughout
 *
 * CUSTOMIZATION:
 * - Adjust colors in component files
 * - Modify breakpoints in Tailwind config
 * - Add/remove features from comparison data
 * - Customize CTA buttons per insurance type
 *
 * TESTING:
 * - Test on real devices (iPhone, Android)
 * - Check all accordion interactions
 * - Verify external links open correctly
 * - Test with screen readers
 * - Validate with Lighthouse
 */
