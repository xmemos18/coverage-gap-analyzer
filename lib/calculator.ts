import { CalculatorFormData, InsuranceRecommendation, CostRange, AlternativeOption, Suggestion, CurrentInsurance } from '@/types';

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
  const { adultAges, childAges, hasMedicareEligible, budget, residences, hasCurrentInsurance, currentInsurance } = formData;

  const totalAdults = adultAges.length;
  const totalChildren = childAges.length;
  const totalHousehold = totalAdults + totalChildren;

  // Extract all unique states from residences
  const allStates = residences.map(r => r.state).filter(s => s);
  const uniqueStates = [...new Set(allStates)];

  // Determine Medicare eligibility
  const allAdultsMedicareEligible = adultAges.every(age => age >= 65);
  const someAdultsMedicareEligible = hasMedicareEligible || adultAges.some(age => age >= 65);
  const medicareEligibleCount = adultAges.filter(age => age >= 65).length;
  const nonMedicareAdultCount = totalAdults - medicareEligibleCount;

  // Calculate state coverage score (handles multiple states)
  const coverageScore = calculateCoverageScore(uniqueStates);

  // Route to appropriate recommendation logic
  let recommendation: InsuranceRecommendation;

  if (allAdultsMedicareEligible && totalChildren === 0) {
    recommendation = getMedicareRecommendation(formData, medicareEligibleCount, coverageScore, budget, uniqueStates);
  } else if (someAdultsMedicareEligible) {
    recommendation = getMixedHouseholdRecommendation(
      formData,
      medicareEligibleCount,
      nonMedicareAdultCount,
      totalChildren,
      coverageScore,
      budget,
      uniqueStates
    );
  } else {
    recommendation = getNonMedicareRecommendation(
      formData,
      totalAdults,
      totalChildren,
      totalHousehold,
      coverageScore,
      budget,
      uniqueStates
    );
  }

  // Add current insurance comparison if provided
  if (hasCurrentInsurance && currentInsurance.carrier) {
    recommendation = addCurrentInsuranceComparison(
      recommendation,
      currentInsurance,
      uniqueStates
    );
  }

  return recommendation;
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
  budget: string,
  states: string[]
): InsuranceRecommendation {
  const costPerPerson = { low: 300, high: 500 };
  const totalCost: CostRange = {
    low: costPerPerson.low * medicareEligibleCount,
    high: costPerPerson.high * medicareEligibleCount,
  };

  const statesList = states.length > 1 ? states.join(', ') : states[0];

  const actionItems = [
    'Enroll in Original Medicare Parts A & B',
    'Shop for Medigap Plan G or N for comprehensive coverage',
    'Compare costs at medicare.gov',
    `Verify doctors accept Medicare in all your states: ${statesList}`,
    'Consider Part D prescription drug coverage',
  ];

  const alternativeOptions = getMedicareAlternatives(
    formData,
    medicareEligibleCount,
    states
  );

  // Check budget compatibility
  const budgetNote = checkBudgetCompatibility(budget, totalCost);
  if (budgetNote) {
    actionItems.push(budgetNote);
  }

  const reasoning = states.length > 2
    ? `Medicare provides nationwide coverage with no network restrictions across all ${states.length} of your states. Medigap Plan G or N fills the gaps in Original Medicare and works seamlessly everywhere. Perfect for multi-state residents.`
    : 'Medicare provides nationwide coverage with no network restrictions. Medigap Plan G or N fills the gaps in Original Medicare and works in any state. Perfect for snowbirds and multi-state residents.';

  return {
    recommendedInsurance: 'Original Medicare + Medigap',
    householdBreakdown: `${medicareEligibleCount} Medicare-eligible ${medicareEligibleCount === 1 ? 'adult' : 'adults'}`,
    estimatedMonthlyCost: totalCost,
    coverageGapScore: 90, // Medicare works everywhere
    reasoning,
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
  budget: string,
  states: string[]
): InsuranceRecommendation {
  const totalCost: CostRange = {
    low: (medicareEligibleCount * 300) + (nonMedicareAdultCount * 600) + (childCount * 300),
    high: (medicareEligibleCount * 500) + (nonMedicareAdultCount * 900) + (childCount * 400),
  };

  const statesList = states.length > 1 ? states.join(', ') : states[0];

  const actionItems = [
    `Medicare + Medigap for ${medicareEligibleCount} member(s) age 65+`,
    `National PPO (UnitedHealthcare or Cigna) for ${nonMedicareAdultCount} under-65 adult(s)`,
  ];

  if (childCount > 0) {
    actionItems.push(`Add ${childCount} ${childCount === 1 ? 'child' : 'children'} to the PPO family plan`);
  }

  actionItems.push(
    'Consider family plan vs individual plans - compare total costs',
    `Verify PPO network coverage in all your states: ${statesList}`
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
    states
  );

  const reasoning = states.length > 2
    ? `Medicare with Medigap for seniors provides nationwide coverage. National PPO for younger members ensures access to care across all ${states.length} of your states.`
    : 'Medicare with Medigap for seniors provides nationwide coverage. National PPO for younger members ensures access to care in both states.';

  return {
    recommendedInsurance: 'Medicare + Medigap for seniors, National PPO for working-age members',
    householdBreakdown: `${medicareEligibleCount} Medicare-eligible, ${nonMedicareAdultCount} under-65 adult(s), ${childCount} ${childCount === 1 ? 'child' : 'children'}`,
    estimatedMonthlyCost: totalCost,
    coverageGapScore: 85,
    reasoning,
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
  budget: string,
  states: string[]
): InsuranceRecommendation {
  const statesList = states.length > 1 ? states.join(', ') : states[0];
  const stateCount = states.length;

  let recommendedPlan = '';
  let householdBreakdown = '';
  let totalCost: CostRange;
  let reasoning = '';

  // Single person
  if (totalHousehold === 1) {
    recommendedPlan = 'National PPO Individual Plan';
    householdBreakdown = '1 adult';
    totalCost = { low: 600, high: 900 };
    reasoning = stateCount > 2
      ? `A national PPO plan gives you flexibility to see doctors across all ${stateCount} of your states without referrals or network restrictions.`
      : `A national PPO plan gives you flexibility to see doctors in both ${statesList} without referrals or network restrictions.`;
  }
  // Couple (2 adults, no kids)
  else if (adultCount === 2 && childCount === 0) {
    recommendedPlan = 'National PPO Couples Plan';
    householdBreakdown = '2 adults';
    totalCost = { low: 1200, high: 1800 };
    reasoning = stateCount > 2
      ? `A couples plan provides comprehensive coverage for both of you across all ${stateCount} of your states with access to a nationwide network.`
      : `A couples plan provides comprehensive coverage for both of you across ${statesList} with access to a nationwide network.`;
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

    reasoning = stateCount > 2
      ? `A family PPO plan covers everyone in your household with access to care across all ${stateCount} of your states and nationwide.`
      : `A family PPO plan covers everyone in your household with access to care in ${statesList} and nationwide.`;
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
    `Check provider networks in all your states: ${statesList}`,
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
    states,
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
 * Calculate coverage score based on multiple states
 *
 * Higher scores = better network availability
 */
function calculateCoverageScore(states: string[]): number {
  if (states.length === 0) return 50;
  if (states.length === 1) return 90; // Single state is easy

  // All states are popular (strong networks everywhere)
  const allPopular = states.every(state => POPULAR_STATES.includes(state));
  if (allPopular) {
    return 85;
  }

  // Check if all states are adjacent (regional coverage possible)
  if (states.length === 2) {
    const isAdjacent = ADJACENT_STATE_PAIRS.some(
      pair => (pair.includes(states[0]) && pair.includes(states[1]))
    );
    if (isAdjacent) {
      return 75;
    }
  }

  // Multiple states across different regions (need national plan)
  // Score decreases slightly with more states for complexity
  if (states.length >= 5) {
    return 80; // Many states = definitely need national coverage
  }

  return 85; // 2-4 states, mixed regions
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
  states: string[]
): AlternativeOption[] {
  const statesList = states.join(', ');
  const multiStateWarning = states.length > 2
    ? `May need different plans across ${states.length} states`
    : `May need different plans in ${statesList}`;

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
        multiStateWarning,
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
  states: string[]
): AlternativeOption[] {
  const alternatives: AlternativeOption[] = [];
  const statesList = states.join(', ');
  const multiStateCon = states.length > 2
    ? `May need separate MA plans across ${states.length} states`
    : `May need separate MA plans in ${statesList}`;

  const multiStatePlanCon = states.length > 2
    ? `May need different plans across ${states.length} states`
    : `May need different plans for ${statesList}`;

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
        multiStateCon,
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
      multiStatePlanCon,
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
  states: string[],
  coverageScore: number
): AlternativeOption[] {
  const totalMembers = adultCount + childCount;
  const alternatives: AlternativeOption[] = [];
  const statesList = states.join(', ');

  // Regional PPO (if states are adjacent)
  if (coverageScore === 75 && states.length === 2) {
    alternatives.push({
      name: 'Regional PPO Plan',
      monthlyCost: {
        low: totalMembers * 400,
        high: totalMembers * 650,
      },
      pros: [
        `Lower premiums than national plans`,
        `Good network coverage in ${statesList}`,
        'Still allows out-of-network care at higher cost',
      ],
      cons: [
        'Smaller provider network than national plans',
        'May have higher costs if you travel outside the region',
      ],
    });
  }

  // ACA Marketplace
  const multiStatePlanCon = states.length > 2
    ? `May need separate plans across ${states.length} states`
    : `May need separate plans in ${statesList}`;

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
      multiStatePlanCon,
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

/**
 * Add current insurance comparison and suggestions
 */
function addCurrentInsuranceComparison(
  recommendation: InsuranceRecommendation,
  currentInsurance: CurrentInsurance,
  states: string[]
): InsuranceRecommendation {
  // Create current insurance summary
  const currentInsuranceSummary = `${currentInsurance.carrier} ${currentInsurance.planType} - $${currentInsurance.monthlyCost}/month (Deductible: $${currentInsurance.deductible}, Max OOP: $${currentInsurance.outOfPocketMax})`;

  // Calculate cost comparison
  const recommendedAvg = (recommendation.estimatedMonthlyCost.low + recommendation.estimatedMonthlyCost.high) / 2;
  const monthlySavings = currentInsurance.monthlyCost - recommendedAvg;
  const annualSavings = monthlySavings * 12;

  const costComparison = {
    current: currentInsurance.monthlyCost,
    recommended: recommendation.estimatedMonthlyCost,
    monthlySavings: monthlySavings > 0 ? monthlySavings : undefined,
    annualSavings: annualSavings > 0 ? annualSavings : undefined,
  };

  // Generate suggestions based on current insurance
  const suggestions = generateSuggestions(
    currentInsurance,
    recommendation,
    monthlySavings,
    states
  );

  // Identify improvement areas
  const improvementAreas = identifyImprovementAreas(
    currentInsurance,
    recommendation,
    monthlySavings
  );

  return {
    ...recommendation,
    currentInsuranceSummary,
    costComparison,
    suggestions,
    improvementAreas,
  };
}

/**
 * Generate personalized suggestions based on current insurance
 */
function generateSuggestions(
  currentInsurance: CurrentInsurance,
  recommendation: InsuranceRecommendation,
  monthlySavings: number,
  states: string[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const statesList = states.join(', ');
  const stateCount = states.length;

  // Cost savings suggestion
  if (monthlySavings > 100) {
    suggestions.push({
      type: 'cost-savings',
      title: 'Significant Cost Savings Opportunity',
      description: `You could save approximately $${Math.round(monthlySavings)}/month ($${Math.round(monthlySavings * 12)}/year) by switching to our recommended plan.`,
      potentialSavings: monthlySavings,
      priority: 'high',
    });
  } else if (monthlySavings > 50) {
    suggestions.push({
      type: 'cost-savings',
      title: 'Moderate Cost Savings Available',
      description: `Switching could save you around $${Math.round(monthlySavings)}/month. Consider if the network and coverage differences are worth the savings.`,
      potentialSavings: monthlySavings,
      priority: 'medium',
    });
  }

  // Network expansion for multi-state coverage
  if (currentInsurance.planType === 'HMO' || currentInsurance.planType === 'EPO') {
    const networkDesc = stateCount > 2
      ? `Your current ${currentInsurance.planType} plan likely has network restrictions that don't work well across ${stateCount} states (${statesList}). A national PPO would provide seamless coverage in all locations.`
      : `Your current ${currentInsurance.planType} plan likely has network restrictions that don't work well between ${statesList}. A national PPO would provide seamless coverage in both locations.`;

    suggestions.push({
      type: 'network-expansion',
      title: 'Limited Network Coverage Across States',
      description: networkDesc,
      priority: 'high',
    });
  }

  // Coverage improvement for Medicare-eligible
  if (recommendation.recommendedInsurance.includes('Medicare') &&
      !currentInsurance.planType.includes('Medicare')) {
    suggestions.push({
      type: 'coverage-improvement',
      title: 'Medicare Eligibility Available',
      description: 'You appear to be Medicare-eligible. Medicare with Medigap provides nationwide coverage with no network restrictions, which is ideal for multi-state living.',
      priority: 'high',
    });
  }

  // Plan type optimization
  if (currentInsurance.planType === 'Medicare Advantage' &&
      recommendation.recommendedInsurance.includes('Medigap')) {
    const maDesc = stateCount > 2
      ? `Medicare Advantage plans are typically network-based and may require different plans across ${stateCount} states. Original Medicare with Medigap works seamlessly nationwide.`
      : `Medicare Advantage plans are typically network-based and may require different plans in ${statesList}. Original Medicare with Medigap works seamlessly nationwide.`;

    suggestions.push({
      type: 'plan-change',
      title: 'Consider Switching from Medicare Advantage to Medigap',
      description: maDesc,
      priority: 'high',
    });
  }

  // High deductible concern
  if (currentInsurance.deductible > 5000) {
    const deductibleDesc = stateCount > 2
      ? `Your current deductible of $${currentInsurance.deductible} is quite high. Consider if a plan with a lower deductible might provide better protection, especially when splitting time across ${stateCount} states.`
      : `Your current deductible of $${currentInsurance.deductible} is quite high. Consider if a plan with a lower deductible might provide better protection, especially when splitting time between two states.`;

    suggestions.push({
      type: 'coverage-improvement',
      title: 'High Deductible Risk',
      description: deductibleDesc,
      priority: 'medium',
    });
  }

  // High out-of-pocket maximum
  if (currentInsurance.outOfPocketMax > 10000) {
    suggestions.push({
      type: 'coverage-improvement',
      title: 'High Out-of-Pocket Maximum',
      description: `Your current out-of-pocket maximum of $${currentInsurance.outOfPocketMax} could expose you to significant financial risk. Look for plans with lower maximums for better protection.`,
      priority: 'medium',
    });
  }

  // Cost increase warning
  if (monthlySavings < -100) {
    const costDesc = stateCount > 2
      ? `Your current plan costs less than our recommendation. However, verify it provides adequate coverage across all ${stateCount} of your states before keeping it.`
      : `Your current plan costs less than our recommendation. However, verify it provides adequate coverage in both ${statesList} before keeping it.`;

    suggestions.push({
      type: 'cost-savings',
      title: 'Your Current Plan is More Affordable',
      description: costDesc,
      priority: 'low',
    });
  }

  return suggestions;
}

/**
 * Identify specific areas for improvement
 */
function identifyImprovementAreas(
  currentInsurance: CurrentInsurance,
  recommendation: InsuranceRecommendation,
  monthlySavings: number
): string[] {
  const areas: string[] = [];

  // Network coverage
  if (currentInsurance.planType === 'HMO' || currentInsurance.planType === 'EPO') {
    areas.push('Multi-state network coverage');
  }

  // Cost optimization
  if (monthlySavings > 50) {
    areas.push('Monthly premium costs');
  }

  // Deductible
  if (currentInsurance.deductible > 5000) {
    areas.push('Lower deductible options');
  }

  // Out-of-pocket protection
  if (currentInsurance.outOfPocketMax > 10000) {
    areas.push('Out-of-pocket maximum protection');
  }

  // Medicare optimization
  if (recommendation.recommendedInsurance.includes('Medicare') &&
      !currentInsurance.planType.includes('Medicare')) {
    areas.push('Medicare eligibility utilization');
  }

  // Plan flexibility
  if (currentInsurance.planType === 'Medicare Advantage' &&
      recommendation.recommendedInsurance.includes('Medigap')) {
    areas.push('Plan flexibility for multi-state living');
  }

  return areas;
}
