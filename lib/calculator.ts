import { CalculatorFormData, InsuranceRecommendation, CostRange, AlternativeOption } from '@/types';

/**
 * Recommendation Engine for Multi-State Health Insurance
 *
 * Analyzes household composition, location, and budget to recommend
 * appropriate health insurance coverage for people with multiple homes.
 */

// States with strong insurance networks
const POPULAR_STATES = ['NY', 'CA', 'FL', 'TX', 'AZ', 'IL', 'PA', 'OH', 'NC', 'GA'];

// Adjacent state pairs that often share regional networks
const ADJACENT_STATE_PAIRS = [
  ['NY', 'NJ'], ['NY', 'CT'], ['NY', 'PA'],
  ['WA', 'OR'], ['CA', 'NV'], ['CA', 'AZ'],
  ['FL', 'GA'], ['TX', 'LA'], ['IL', 'WI'],
  ['MA', 'NH'], ['MA', 'RI'], ['MA', 'CT'],
];

/**
 * Main recommendation function
 */
export function analyzeInsurance(formData: CalculatorFormData): InsuranceRecommendation {
  const { adultAges, childAges, hasMedicareEligible, budget, primaryResidence, secondaryResidence } = formData;

  const totalAdults = adultAges.length;
  const totalChildren = childAges.length;
  const totalHousehold = totalAdults + totalChildren;

  // Determine Medicare eligibility
  const allAdultsMedicareEligible = adultAges.every(age => age >= 65);
  const someAdultsMedicareEligible = hasMedicareEligible || adultAges.some(age => age >= 65);
  const medicareEligibleCount = adultAges.filter(age => age >= 65).length;
  const nonMedicareAdultCount = totalAdults - medicareEligibleCount;

  // Calculate state coverage score
  const coverageScore = calculateCoverageScore(primaryResidence.state, secondaryResidence.state);

  // Route to appropriate recommendation logic
  if (allAdultsMedicareEligible && totalChildren === 0) {
    return getMedicareRecommendation(formData, medicareEligibleCount, coverageScore, budget);
  } else if (someAdultsMedicareEligible) {
    return getMixedHouseholdRecommendation(
      formData,
      medicareEligibleCount,
      nonMedicareAdultCount,
      totalChildren,
      coverageScore,
      budget
    );
  } else {
    return getNonMedicareRecommendation(
      formData,
      totalAdults,
      totalChildren,
      totalHousehold,
      coverageScore,
      budget
    );
  }
}

/**
 * SCENARIO 1: Medicare-Eligible Households (all adults 65+)
 *
 * Best option: Original Medicare + Medigap
 * Works everywhere in the US without network restrictions
 */
function getMedicareRecommendation(
  formData: CalculatorFormData,
  medicareEligibleCount: number,
  coverageScore: number,
  budget: string
): InsuranceRecommendation {
  const costPerPerson = { low: 300, high: 500 };
  const totalCost: CostRange = {
    low: costPerPerson.low * medicareEligibleCount,
    high: costPerPerson.high * medicareEligibleCount,
  };

  const state1 = formData.primaryResidence.state;
  const state2 = formData.secondaryResidence.state;

  const actionItems = [
    'Enroll in Original Medicare Parts A & B',
    'Shop for Medigap Plan G or N for comprehensive coverage',
    'Compare costs at medicare.gov',
    `Verify doctors accept Medicare in both ${state1} and ${state2}`,
    'Consider Part D prescription drug coverage',
  ];

  const alternativeOptions = getMedicareAlternatives(
    formData,
    medicareEligibleCount,
    state1,
    state2
  );

  // Check budget compatibility
  const budgetNote = checkBudgetCompatibility(budget, totalCost);
  if (budgetNote) {
    actionItems.push(budgetNote);
  }

  return {
    recommendedInsurance: 'Original Medicare + Medigap',
    householdBreakdown: `${medicareEligibleCount} Medicare-eligible ${medicareEligibleCount === 1 ? 'adult' : 'adults'}`,
    estimatedMonthlyCost: totalCost,
    coverageGapScore: 90, // Medicare works everywhere
    reasoning: 'Medicare provides nationwide coverage with no network restrictions. Medigap Plan G or N fills the gaps in Original Medicare and works in any state. Perfect for snowbirds and multi-state residents.',
    actionItems,
    alternativeOptions,
  };
}

/**
 * SCENARIO 2: Mixed Households (some Medicare-eligible, some not)
 *
 * Best option: Medicare + Medigap for seniors, National PPO for others
 */
function getMixedHouseholdRecommendation(
  formData: CalculatorFormData,
  medicareEligibleCount: number,
  nonMedicareAdultCount: number,
  childCount: number,
  coverageScore: number,
  budget: string
): InsuranceRecommendation {
  const totalCost: CostRange = {
    low: (medicareEligibleCount * 300) + (nonMedicareAdultCount * 600) + (childCount * 300),
    high: (medicareEligibleCount * 500) + (nonMedicareAdultCount * 900) + (childCount * 400),
  };

  const state1 = formData.primaryResidence.state;
  const state2 = formData.secondaryResidence.state;

  const actionItems = [
    `Medicare + Medigap for ${medicareEligibleCount} member(s) age 65+`,
    `National PPO (UnitedHealthcare or Cigna) for ${nonMedicareAdultCount} under-65 adult(s)`,
  ];

  if (childCount > 0) {
    actionItems.push(`Add ${childCount} ${childCount === 1 ? 'child' : 'children'} to the PPO family plan`);
  }

  actionItems.push(
    'Consider family plan vs individual plans - compare total costs',
    `Verify PPO network coverage in ${state1} and ${state2}`
  );

  const budgetNote = checkBudgetCompatibility(budget, totalCost);
  if (budgetNote) {
    actionItems.push(budgetNote);
  }

  const alternativeOptions = getMixedHouseholdAlternatives(
    formData,
    medicareEligibleCount,
    nonMedicareAdultCount,
    childCount,
    state1,
    state2
  );

  return {
    recommendedInsurance: 'Medicare + Medigap for seniors, National PPO for working-age members',
    householdBreakdown: `${medicareEligibleCount} Medicare-eligible, ${nonMedicareAdultCount} under-65 adult(s), ${childCount} ${childCount === 1 ? 'child' : 'children'}`,
    estimatedMonthlyCost: totalCost,
    coverageGapScore: 85,
    reasoning: 'Medicare with Medigap for seniors provides nationwide coverage. National PPO for younger members ensures access to care in both states.',
    actionItems,
    alternativeOptions,
  };
}

/**
 * SCENARIO 3: Non-Medicare Households (all under 65)
 *
 * Options vary by household composition
 */
function getNonMedicareRecommendation(
  formData: CalculatorFormData,
  adultCount: number,
  childCount: number,
  totalHousehold: number,
  coverageScore: number,
  budget: string
): InsuranceRecommendation {
  const state1 = formData.primaryResidence.state;
  const state2 = formData.secondaryResidence.state;

  let recommendedPlan = '';
  let householdBreakdown = '';
  let totalCost: CostRange;
  let reasoning = '';

  // Single person
  if (totalHousehold === 1) {
    recommendedPlan = 'National PPO Individual Plan';
    householdBreakdown = '1 adult';
    totalCost = { low: 600, high: 900 };
    reasoning = `A national PPO plan gives you flexibility to see doctors in both ${state1} and ${state2} without referrals or network restrictions.`;
  }
  // Couple (2 adults, no kids)
  else if (adultCount === 2 && childCount === 0) {
    recommendedPlan = 'National PPO Couples Plan';
    householdBreakdown = '2 adults';
    totalCost = { low: 1200, high: 1800 };
    reasoning = `A couples plan provides comprehensive coverage for both of you across ${state1} and ${state2} with access to a nationwide network.`;
  }
  // Family with children
  else if (childCount > 0) {
    recommendedPlan = 'National PPO Family Plan';
    householdBreakdown = `${adultCount} ${adultCount === 1 ? 'adult' : 'adults'}, ${childCount} ${childCount === 1 ? 'child' : 'children'}`;

    // Base cost for 2 adults + 2 kids
    const baseCost = { low: 1800, high: 2500 };

    // Add cost for additional children beyond 2
    const additionalKids = Math.max(0, childCount - 2);
    totalCost = {
      low: baseCost.low + (additionalKids * 300),
      high: baseCost.high + (additionalKids * 400),
    };

    // Adjust for single parent
    if (adultCount === 1) {
      totalCost = {
        low: totalCost.low - 600,
        high: totalCost.high - 900,
      };
    }

    reasoning = `A family PPO plan covers everyone in your household with access to care in ${state1}, ${state2}, and nationwide.`;
  }
  // Multiple adults, no children (roommates/extended family)
  else {
    recommendedPlan = `National PPO Plan for ${adultCount} adults`;
    householdBreakdown = `${adultCount} adults`;
    totalCost = {
      low: adultCount * 600,
      high: adultCount * 900,
    };
    reasoning = `National PPO plans for each adult provide comprehensive multi-state coverage.`;
  }

  const actionItems = [
    'Get quotes from UnitedHealthcare Choice Plus',
    'Compare with Cigna national PPO plans',
    `Check provider networks in ${state1} and ${state2}`,
    'Consider high-deductible plan with HSA if your household is healthy',
  ];

  const budgetNote = checkBudgetCompatibility(budget, totalCost);
  if (budgetNote) {
    actionItems.push(budgetNote);
  }

  const alternativeOptions = getNonMedicareAlternatives(
    formData,
    adultCount,
    childCount,
    state1,
    state2,
    coverageScore
  );

  return {
    recommendedInsurance: recommendedPlan,
    householdBreakdown,
    estimatedMonthlyCost: totalCost,
    coverageGapScore: coverageScore,
    reasoning,
    actionItems,
    alternativeOptions,
  };
}

/**
 * Calculate coverage score based on states
 *
 * Higher scores = better network availability
 */
function calculateCoverageScore(state1: string, state2: string): number {
  // Both states are popular (strong networks)
  if (POPULAR_STATES.includes(state1) && POPULAR_STATES.includes(state2)) {
    return 85;
  }

  // States are adjacent (regional plans may work)
  const isAdjacent = ADJACENT_STATE_PAIRS.some(
    pair => (pair.includes(state1) && pair.includes(state2))
  );
  if (isAdjacent) {
    return 75;
  }

  // Distant states (need national plan)
  return 85;
}

/**
 * Check if budget is compatible with recommended cost
 * Returns a note if budget is too low or if user selected "show all"
 */
function checkBudgetCompatibility(budget: string, estimatedCost: CostRange): string | null {
  const budgetRanges: { [key: string]: number } = {
    'less-500': 500,
    '500-1000': 1000,
    '1000-2000': 2000,
    '2000-3500': 3500,
    '3500-plus': 10000,
    'not-sure': 10000,
  };

  const maxBudget = budgetRanges[budget] || 10000;

  // Budget is lower than recommendation
  if (maxBudget < estimatedCost.low) {
    return 'Your budget is lower than estimated costs. Check healthcare.gov for ACA subsidies - you may qualify for income-based assistance.';
  }

  // User wants to see all options
  if (budget === 'not-sure') {
    return 'Consider concierge medicine add-on ($150-400/month) for enhanced service and immediate access.';
  }

  return null;
}

/**
 * Generate alternative options for Medicare-eligible households
 */
function getMedicareAlternatives(
  formData: CalculatorFormData,
  memberCount: number,
  state1: string,
  state2: string
): AlternativeOption[] {
  return [
    {
      name: 'Medicare Advantage',
      monthlyCost: { low: 0, high: 150 * memberCount },
      pros: [
        'Lower monthly premiums (sometimes $0)',
        'Often includes dental, vision, and prescription coverage',
        'Out-of-pocket maximum protects you',
      ],
      cons: [
        'Limited to specific networks in each state',
        `May need different plans in ${state1} vs ${state2}`,
        'Requires referrals for specialists',
        'Coverage may not work seamlessly between states',
      ],
    },
    {
      name: 'Medicare + Medicare Supplement Plan N',
      monthlyCost: { low: 250 * memberCount, high: 400 * memberCount },
      pros: [
        'Slightly lower premiums than Plan G',
        'Works nationwide with any Medicare provider',
        'No network restrictions',
      ],
      cons: [
        'Small copays for doctor visits ($20) and ER ($50)',
        'Must pay Part B excess charges (rare)',
      ],
    },
  ];
}

/**
 * Generate alternative options for mixed households
 */
function getMixedHouseholdAlternatives(
  formData: CalculatorFormData,
  medicareCount: number,
  adultCount: number,
  childCount: number,
  state1: string,
  state2: string
): AlternativeOption[] {
  const alternatives: AlternativeOption[] = [];

  // Medicare Advantage for seniors
  if (medicareCount > 0) {
    alternatives.push({
      name: 'Medicare Advantage for seniors + PPO for others',
      monthlyCost: {
        low: (medicareCount * 0) + (adultCount * 600) + (childCount * 300),
        high: (medicareCount * 150) + (adultCount * 900) + (childCount * 400),
      },
      pros: [
        'Lower costs for Medicare-eligible members',
        'Single PPO plan covers all non-Medicare members',
      ],
      cons: [
        'Medicare Advantage has network limitations',
        `May need separate MA plans in ${state1} and ${state2}`,
        'Complex coordination between Medicare and private insurance',
      ],
    });
  }

  // ACA Marketplace
  alternatives.push({
    name: 'ACA Marketplace plans for all non-Medicare members',
    monthlyCost: {
      low: (adultCount * 400) + (childCount * 200),
      high: (adultCount * 800) + (childCount * 350),
    },
    pros: [
      'Income-based subsidies may significantly reduce costs',
      'Guaranteed coverage regardless of health conditions',
      'Pediatric dental and vision included for children',
    ],
    cons: [
      'Network coverage varies by state',
      `May need different plans for ${state1} and ${state2}`,
      'Limited to specific enrollment periods',
    ],
  });

  return alternatives;
}

/**
 * Generate alternative options for non-Medicare households
 */
function getNonMedicareAlternatives(
  formData: CalculatorFormData,
  adultCount: number,
  childCount: number,
  state1: string,
  state2: string,
  coverageScore: number
): AlternativeOption[] {
  const totalMembers = adultCount + childCount;
  const alternatives: AlternativeOption[] = [];

  // Regional PPO (if states are adjacent)
  if (coverageScore === 75) {
    alternatives.push({
      name: 'Regional PPO Plan',
      monthlyCost: {
        low: totalMembers * 400,
        high: totalMembers * 650,
      },
      pros: [
        `Lower premiums than national plans`,
        `Good network coverage in ${state1} and ${state2}`,
        'Still allows out-of-network care at higher cost',
      ],
      cons: [
        'Smaller provider network than national plans',
        'May have higher costs if you travel outside the region',
      ],
    });
  }

  // ACA Marketplace
  alternatives.push({
    name: 'ACA Marketplace Plans',
    monthlyCost: {
      low: (adultCount * 400) + (childCount * 200),
      high: (adultCount * 800) + (childCount * 350),
    },
    pros: [
      'Income-based subsidies can reduce costs by 50-80%',
      'Guaranteed coverage regardless of pre-existing conditions',
      'Essential health benefits required',
    ],
    cons: [
      'Network limited to specific state',
      `May need separate plans in ${state1} and ${state2}`,
      'Can only enroll during open enrollment (Nov-Jan) unless qualifying event',
    ],
  });

  // High Deductible Health Plan with HSA
  alternatives.push({
    name: 'High-Deductible Health Plan (HDHP) with HSA',
    monthlyCost: {
      low: (adultCount * 350) + (childCount * 150),
      high: (adultCount * 600) + (childCount * 250),
    },
    pros: [
      'Significantly lower monthly premiums',
      'HSA contributions are tax-deductible',
      'HSA funds roll over year to year and grow tax-free',
      'Good option if your household is healthy',
    ],
    cons: [
      'High deductible ($3,000-$7,000 for families)',
      'You pay full cost of care until deductible is met',
      'Not ideal if you have chronic conditions or need frequent care',
    ],
  });

  return alternatives;
}
