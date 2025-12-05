import { CalculatorFormData, InsuranceRecommendation, CostRange } from '@/types';
import { checkBudgetCompatibility } from './budget';
import { getMedicareAlternatives, getMixedHouseholdAlternatives, getNonMedicareAlternatives } from './alternatives';
import { INSURANCE_COSTS, COVERAGE_SCORES } from '@/lib/constants';
import { simplifyReasoning, generateWhatThisMeans } from '@/lib/plainEnglish';
import { getMedigapShoppingSteps, getPartDShoppingSteps, getMarketplaceShoppingSteps, getEnrollmentDeadlines, formatActionStep } from '../concreteActions';
import { adjustCostForStates } from '@/lib/stateSpecificData';
import { searchMarketplacePlans, isHealthcareGovApiAvailable, calculateSubsidyEstimates, type MarketplacePlan } from '@/lib/healthcareGovApi';
import { logger } from '@/lib/logger';
import { calculateUtilizationScore, getUtilizationCostMultiplier, getRecommendedMetalLevel } from './utilizationScorer';
import { getEffectiveIncome } from '@/lib/medicalCostConstants';

/**
 * Health Profile Analysis Helper
 * Determines utilization level based on health profile
 */
interface HealthProfile {
  isHighUtilization: boolean;
  hasProviderPreference: boolean;
  hasChronicConditions: boolean;
  prescriptionCount: string;
  utilizationScore: ReturnType<typeof calculateUtilizationScore>;
}

function analyzeHealthProfile(formData: CalculatorFormData): HealthProfile {
  const hasChronicConditions = formData.hasChronicConditions && formData.chronicConditions.length > 0;
  const hasHighRxCount = formData.prescriptionCount === '4-or-more';
  const hasProviderPreference = formData.providerPreference === 'specific-doctors';

  // Calculate detailed utilization score using new enhanced data
  const utilizationScore = calculateUtilizationScore(formData);

  return {
    isHighUtilization: hasChronicConditions || hasHighRxCount || utilizationScore.level === 'high' || utilizationScore.level === 'very-high',
    hasProviderPreference,
    hasChronicConditions,
    prescriptionCount: formData.prescriptionCount || 'none',
    utilizationScore,
  };
}

/**
 * Fetch real marketplace plans from Healthcare.gov API
 * Returns null if API is not configured or request fails
 */
async function fetchMarketplacePlans(
  formData: CalculatorFormData,
  healthProfile: HealthProfile
): Promise<{
  plans: MarketplacePlan[];
  subsidyAmount?: number;
  csrLevel?: string;
} | null> {
  if (!isHealthcareGovApiAvailable()) {
    return null;
  }

  const primaryZip = formData.residences[0]?.zip;
  const primaryState = formData.residences[0]?.state;

  if (!primaryZip || !/^\d{5}$/.test(primaryZip)) {
    return null;
  }

  try {
    // Build household data for API request
    const householdData = {
      income: getEffectiveIncome(formData.annualIncome, formData.incomeRange),
      people: [
        ...formData.adultAges.map((age, index) => ({
          age,
          aptc_eligible: !formData.hasEmployerInsurance, // Not eligible for subsidies if has employer insurance
          uses_tobacco: formData.adultsUseTobacco?.[index] || false,
        })),
        ...formData.childAges.map((age, index) => ({
          age,
          aptc_eligible: true,
          uses_tobacco: formData.childrenUseTobacco?.[index] || false,
        })),
      ],
    };

    // Fetch subsidy eligibility if income is provided
    let subsidyAmount = 0;
    let csrLevel = 'None';

    const hasIncomeData = formData.annualIncome !== null || formData.incomeRange;
    if (hasIncomeData && !formData.hasEmployerInsurance) {
      const subsidyData = await calculateSubsidyEstimates(
        primaryZip,
        householdData,
        new Date().getFullYear()
      );

      if (subsidyData) {
        subsidyAmount = subsidyData.aptc;
        csrLevel = subsidyData.csr;
      }
    }

    // Search for plans with filters based on health profile
    const searchParams = {
      zipcode: primaryZip,
      state: primaryState,
      household: householdData,
      market: 'Individual' as const,
      limit: 10,
      filter: healthProfile.isHighUtilization
        ? {
            metal_levels: ['Silver' as const, 'Gold' as const],
            type: ['PPO' as const], // PPO for better specialist access
          }
        : {
            metal_levels: ['Bronze' as const, 'Silver' as const, 'Gold' as const],
          },
    };

    const result = await searchMarketplacePlans(searchParams);

    if (!result || result.plans.length === 0) {
      return null;
    }

    return {
      plans: result.plans,
      subsidyAmount,
      csrLevel,
    };
  } catch (error) {
    logger.error('Error fetching marketplace plans', { error });
    return null;
  }
}

/**
 * Add health-specific action items based on health profile and form data
 */
function getHealthSpecificActions(healthProfile: HealthProfile, formData: CalculatorFormData): string[] {
  const actions: string[] = [];

  if (healthProfile.isHighUtilization) {
    actions.push('Check if your medications are covered by the plan formulary');
    actions.push('Verify your current doctors and specialists are in-network');
    actions.push('Compare total cost of care (premiums + deductible + copays), not just monthly premiums');
  }

  if (healthProfile.hasChronicConditions) {
    actions.push('Look for plans with low specialist copays and no referral requirements');
    actions.push('Verify coverage for disease management programs and preventive care');
  }

  if (healthProfile.hasProviderPreference) {
    actions.push('Call your preferred doctors to confirm they accept the insurance plan');
    actions.push('Check provider directory online before enrolling');
  }

  // Add medication-specific guidance
  if (formData.takesSpecialtyMeds) {
    actions.push('CRITICAL: Verify specialty medication coverage and tier placement');
    actions.push('Ask about specialty pharmacy requirements and prior authorization');
    actions.push('Check if your specific biologic/injectable is on the formulary');
  }

  if (formData.monthlyMedicationCost === 'over-1000' || formData.monthlyMedicationCost === '500-1000') {
    actions.push('Compare prescription drug coverage carefully - this is a major cost driver');
    actions.push('Look for plans with lower medication tiers and copays');
    actions.push('Consider plans with mail-order pharmacy discounts (90-day supply savings)');
  }

  if (formData.monthlyMedicationCost && formData.monthlyMedicationCost !== 'under-50' && !formData.usesMailOrderPharmacy) {
    actions.push('Consider enrolling in mail-order pharmacy for 90-day supply discounts');
  }

  if (formData.plannedProcedures) {
    actions.push('IMPORTANT: Get pre-authorization for planned procedures before enrolling');
    actions.push('Ask about coverage limits and facility network requirements');
    actions.push('Consider lower deductible plans to reduce upfront costs');
  }

  if (!healthProfile.isHighUtilization && healthProfile.prescriptionCount === 'none') {
    actions.push('Consider HDHP + HSA for tax savings and lower premiums');
  }

  return actions;
}

/**
 * Add health-based reasoning to recommendation
 */
function getHealthBasedReasoning(healthProfile: HealthProfile): string {
  if (healthProfile.isHighUtilization) {
    return ' Given your health needs, prioritize plans with lower deductibles and good specialist access over the lowest premiums.';
  }

  if (healthProfile.hasProviderPreference) {
    return ' Since you have preferred doctors, verify they are in-network before choosing any plan.';
  }

  if (!healthProfile.isHighUtilization && healthProfile.prescriptionCount === 'none') {
    return ' Since you\'re generally healthy, you may benefit from a high-deductible plan with HSA for significant premium savings.';
  }

  return '';
}

/**
 * SCENARIO 1: Medicare-Eligible Households (all adults 65+)
 *
 * Best option: Original Medicare + Medigap
 * Works everywhere in the US without network restrictions
 */
export function getMedicareRecommendation(
  formData: CalculatorFormData,
  medicareEligibleCount: number,
  _coverageScore: number,
  budget: string,
  states: string[]
): InsuranceRecommendation {
  const healthProfile = analyzeHealthProfile(formData);

  const costPerPerson = {
    low: INSURANCE_COSTS.MEDICARE_PER_PERSON_LOW,
    high: INSURANCE_COSTS.MEDICARE_PER_PERSON_HIGH
  };
  const baseCost: CostRange = {
    low: costPerPerson.low * medicareEligibleCount,
    high: costPerPerson.high * medicareEligibleCount,
  };

  // Apply state-specific cost adjustments
  const totalCost = adjustCostForStates(baseCost, states);

  const statesList = states.length > 1 ? states.join(', ') : states[0];
  const primaryZip = formData.residences[0]?.zip || '';
  const deadlines = getEnrollmentDeadlines();

  // Generate concrete action steps
  const medigapSteps = getMedigapShoppingSteps(primaryZip);
  const partDSteps = getPartDShoppingSteps(primaryZip);

  const actionItems = [
    `⏰ ${deadlines.urgency}`,
    '',
    formatActionStep(medigapSteps),
    '',
  ];

  // Add Part D with emphasis for high medication users
  if (healthProfile.isHighUtilization || healthProfile.prescriptionCount !== 'none') {
    actionItems.push('💊 IMPORTANT: Part D Prescription Coverage');
    actionItems.push(formatActionStep(partDSteps));
    actionItems.push('');
  } else {
    actionItems.push('💊 Optional: Consider Part D if you take any prescriptions');
    actionItems.push('→ Visit medicare.gov/plan-compare to explore drug plans');
    actionItems.push('');
  }

  // Add doctor verification
  actionItems.push(`🏥 Verify Your Doctors`);
  actionItems.push(`→ Call each doctor's office and ask: "Do you accept Medicare?"`);
  actionItems.push(`→ Almost all doctors accept Medicare, but it's good to confirm`);
  actionItems.push(`→ Verify coverage in all your states: ${statesList}`);
  actionItems.push('');

  // Add health-specific action items
  const healthActions = getHealthSpecificActions(healthProfile, formData);
  if (healthActions.length > 0) {
    actionItems.push('📋 Additional Steps Based on Your Health:');
    actionItems.push(...healthActions);
  }

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

  let reasoning = states.length > 2
    ? `Medicare works everywhere with any doctor across all ${states.length} of your states. Extra Coverage (Medigap Plan G or N) covers what Medicare doesn't and works everywhere. Great for people with homes in multiple states.`
    : 'Medicare works everywhere with any doctor. Extra Coverage (Medigap Plan G or N) covers what Medicare doesn\'t and works in any state. Great if you split your time between states.';

  // Add health-based reasoning
  const healthReasoning = getHealthBasedReasoning(healthProfile);
  if (healthReasoning) {
    reasoning += ' ' + simplifyReasoning(healthReasoning);
  }

  // Add "What this means" section
  const whatThisMeans = generateWhatThisMeans('Original Medicare + Medigap', states, formData.simpleMode);

  return {
    recommendedInsurance: 'Basic Medicare + Extra Coverage',
    planType: 'Original Medicare + Medigap',
    householdBreakdown: `${medicareEligibleCount} Medicare-eligible ${medicareEligibleCount === 1 ? 'adult' : 'adults'}`,
    estimatedMonthlyCost: totalCost,
    coverageGapScore: COVERAGE_SCORES.MEDICARE_SCORE,
    reasoning: reasoning + '\n\n' + whatThisMeans,
    actionItems,
    alternativeOptions,
  };
}

/**
 * SCENARIO 2: Mixed Households (some Medicare-eligible, some not)
 *
 * Best option: Medicare + Medigap for seniors, National PPO for others
 */
export function getMixedHouseholdRecommendation(
  formData: CalculatorFormData,
  medicareEligibleCount: number,
  nonMedicareAdultCount: number,
  childCount: number,
  _coverageScore: number,
  budget: string,
  states: string[]
): InsuranceRecommendation {
  const healthProfile = analyzeHealthProfile(formData);

  const baseCost: CostRange = {
    low: (medicareEligibleCount * INSURANCE_COSTS.MEDICARE_PER_PERSON_LOW) +
         (nonMedicareAdultCount * INSURANCE_COSTS.ADULT_PPO_LOW) +
         (childCount * INSURANCE_COSTS.CHILD_LOW),
    high: (medicareEligibleCount * INSURANCE_COSTS.MEDICARE_PER_PERSON_HIGH) +
          (nonMedicareAdultCount * INSURANCE_COSTS.ADULT_PPO_HIGH) +
          (childCount * INSURANCE_COSTS.CHILD_HIGH),
  };

  // Apply state-specific cost adjustments
  const totalCost = adjustCostForStates(baseCost, states);

  const statesList = states.length > 1 ? states.join(', ') : states[0];

  const actionItems = [
    `Medicare + Medigap for ${medicareEligibleCount} member(s) age 65+`,
  ];

  // PPO recommendation with health-based guidance
  if (healthProfile.isHighUtilization) {
    actionItems.push(`National PPO (UnitedHealthcare or Cigna) for ${nonMedicareAdultCount} under-65 adult(s) - PPO offers better specialist access`);
  } else {
    actionItems.push(`National PPO (UnitedHealthcare or Cigna) for ${nonMedicareAdultCount} under-65 adult(s)`);
  }

  if (childCount > 0) {
    actionItems.push(`Add ${childCount} ${childCount === 1 ? 'child' : 'children'} to the PPO family plan`);
  }

  actionItems.push(
    'Consider family plan vs individual plans - compare total costs',
    `Verify PPO network coverage in all your states: ${statesList}`
  );

  // Add health-specific action items
  const healthActions = getHealthSpecificActions(healthProfile, formData);
  actionItems.push(...healthActions);

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

  let reasoning = states.length > 2
    ? `Medicare with Extra Coverage for seniors works everywhere. Nationwide Flexible Plan for younger members gives access to doctors in all ${states.length} of your states.`
    : 'Medicare with Extra Coverage for seniors works everywhere. Nationwide Flexible Plan for younger members works in both states.';

  // Add health-based reasoning
  const healthReasoning = getHealthBasedReasoning(healthProfile);
  if (healthReasoning) {
    reasoning += ' ' + simplifyReasoning(healthReasoning);
  }

  // Add "What this means" section
  const whatThisMeans = `What this means:
• Seniors get Medicare + Extra Coverage (works anywhere)
• Working-age adults/children get Nationwide Flexible Plan
• Everyone covered in all your states
• No referrals needed for anyone
• Predictable costs for the whole family`;

  return {
    recommendedInsurance: 'Medicare + Extra Coverage for seniors, Nationwide Flexible Plan for others',
    planType: 'Medicare + Medigap / PPO',
    householdBreakdown: `${medicareEligibleCount} Medicare-eligible, ${nonMedicareAdultCount} under-65 adult(s), ${childCount} ${childCount === 1 ? 'child' : 'children'}`,
    estimatedMonthlyCost: totalCost,
    coverageGapScore: COVERAGE_SCORES.MIXED_HOUSEHOLD_SCORE,
    reasoning: reasoning + '\n\n' + whatThisMeans,
    actionItems,
    alternativeOptions,
  };
}

/**
 * SCENARIO 3: Non-Medicare Households (all under 65)
 *
 * Options vary by household composition
 */
export async function getNonMedicareRecommendation(
  formData: CalculatorFormData,
  adultCount: number,
  childCount: number,
  totalHousehold: number,
  coverageScore: number,
  budget: string,
  states: string[]
): Promise<InsuranceRecommendation> {
  const healthProfile = analyzeHealthProfile(formData);
  const utilizationMultiplier = getUtilizationCostMultiplier(healthProfile.utilizationScore);
  const recommendedMetalLevel = getRecommendedMetalLevel(healthProfile.utilizationScore);

  // Try to fetch real marketplace plans
  const marketplaceData = await fetchMarketplacePlans(formData, healthProfile);
  const statesList = states.length > 1 ? states.join(', ') : states[0];
  const stateCount = states.length;

  let recommendedPlan = '';
  let householdBreakdown = '';
  let totalCost: CostRange;
  let reasoning = '';

  // Single person
  if (totalHousehold === 1) {
    recommendedPlan = healthProfile.isHighUtilization
      ? 'Nationwide Flexible Plan (Lower Deductible)'
      : 'Nationwide Flexible Plan';
    householdBreakdown = '1 adult';
    totalCost = {
      low: INSURANCE_COSTS.ADULT_PPO_LOW,
      high: INSURANCE_COSTS.ADULT_PPO_HIGH
    };
    reasoning = stateCount > 2
      ? `A flexible plan lets you see any doctor in all ${stateCount} of your states without needing permission.`
      : `A flexible plan lets you see any doctor in ${statesList} without needing permission.`;
  }
  // Couple (2 adults, no kids)
  else if (adultCount === 2 && childCount === 0) {
    recommendedPlan = healthProfile.isHighUtilization
      ? 'Nationwide Flexible Plan for Couples (Lower Deductible)'
      : 'Nationwide Flexible Plan for Couples';
    householdBreakdown = '2 adults';
    totalCost = {
      low: INSURANCE_COSTS.COUPLE_LOW,
      high: INSURANCE_COSTS.COUPLE_HIGH
    };
    reasoning = stateCount > 2
      ? `A couples plan gives complete coverage for both of you in all ${stateCount} of your states with any doctor you choose.`
      : `A couples plan gives complete coverage for both of you in ${statesList} with any doctor you choose.`;
  }
  // Family with children
  else if (childCount > 0) {
    recommendedPlan = healthProfile.isHighUtilization
      ? 'Nationwide Flexible Family Plan (Lower Deductible)'
      : 'Nationwide Flexible Family Plan';
    householdBreakdown = `${adultCount} ${adultCount === 1 ? 'adult' : 'adults'}, ${childCount} ${childCount === 1 ? 'child' : 'children'}`;

    // Base cost for 2 adults + 2 kids
    const baseCost = {
      low: INSURANCE_COSTS.FAMILY_BASE_LOW,
      high: INSURANCE_COSTS.FAMILY_BASE_HIGH
    };

    // Add cost for additional children beyond 2
    const additionalKids = Math.max(0, childCount - 2);
    totalCost = {
      low: baseCost.low + (additionalKids * INSURANCE_COSTS.ADDITIONAL_CHILD_LOW),
      high: baseCost.high + (additionalKids * INSURANCE_COSTS.ADDITIONAL_CHILD_HIGH),
    };

    // Adjust for single parent
    if (adultCount === 1) {
      totalCost = {
        low: totalCost.low - INSURANCE_COSTS.SINGLE_PARENT_ADJUSTMENT_LOW,
        high: totalCost.high - INSURANCE_COSTS.SINGLE_PARENT_ADJUSTMENT_HIGH,
      };
    }

    reasoning = stateCount > 2
      ? `A family plan covers everyone in your household with access to doctors in all ${stateCount} of your states.`
      : `A family plan covers everyone in your household with access to doctors in ${statesList}.`;
  }
  // Multiple adults, no children (roommates/extended family)
  else {
    recommendedPlan = `Nationwide Flexible Plan for ${adultCount} adults`;
    householdBreakdown = `${adultCount} adults`;
    totalCost = {
      low: adultCount * INSURANCE_COSTS.ADULT_PPO_LOW,
      high: adultCount * INSURANCE_COSTS.ADULT_PPO_HIGH,
    };
    reasoning = `Flexible plans for each adult give complete multi-state coverage.`;
  }

  // If real marketplace data is available, use actual plan costs
  if (marketplaceData && marketplaceData.plans.length > 0) {
    const plans = marketplaceData.plans;

    // Calculate cost range from top 3 recommended plans
    const topPlans = plans.slice(0, Math.min(3, plans.length));
    const premiums = topPlans.map(p => p.premium_w_credit || p.premium);

    totalCost = {
      low: Math.min(...premiums),
      high: Math.max(...premiums),
    };

    // Update reasoning if subsidies are available
    if (marketplaceData.subsidyAmount && marketplaceData.subsidyAmount > 0) {
      reasoning += ` Good news: Based on your income, you may qualify for approximately $${Math.round(marketplaceData.subsidyAmount)}/month in premium tax credits.`;
    }
  } else {
    // Apply state-specific cost adjustments to estimated cost
    totalCost = adjustCostForStates(totalCost, states);

    // Apply utilization-based cost multiplier (recommending higher coverage tiers for higher utilization)
    totalCost = {
      low: Math.round(totalCost.low * utilizationMultiplier),
      high: Math.round(totalCost.high * utilizationMultiplier),
    };
  }

  const primaryZip = formData.residences[0]?.zip || '';
  const primaryState = formData.residences[0]?.state || '';
  const deadlines = getEnrollmentDeadlines();

  // Generate concrete marketplace steps
  const marketplaceSteps = getMarketplaceShoppingSteps(primaryZip, primaryState);

  const actionItems = [
    `⏰ ${deadlines.urgency}`,
    '',
    formatActionStep(marketplaceSteps),
    '',
  ];

  // Add utilization-based recommendations
  if (healthProfile.utilizationScore.reasoning.length > 0) {
    actionItems.push('📊 Your Healthcare Usage Profile:');
    healthProfile.utilizationScore.reasoning.forEach(reason => {
      actionItems.push(`→ ${reason}`);
    });
    actionItems.push(`→ Utilization level: ${healthProfile.utilizationScore.level}`);
    actionItems.push(`→ Estimated annual medical spending: $${healthProfile.utilizationScore.expectedAnnualClaims.toLocaleString()}`);
    actionItems.push('');
  }

  actionItems.push('🏥 Recommended Plan Tier:');
  actionItems.push(`→ ${recommendedMetalLevel} plans match your healthcare needs`);

  // Add recommended deductible guidance
  if (healthProfile.utilizationScore.recommendedDeductible === 'low') {
    actionItems.push('→ Look for lower deductibles ($0-$2,000) to minimize out-of-pocket costs');
  } else if (healthProfile.utilizationScore.recommendedDeductible === 'medium') {
    actionItems.push('→ Medium deductibles ($2,000-$5,000) offer good balance');
  } else {
    actionItems.push('→ High deductibles ($5,000+) with HSA can save on premiums');
  }

  // Add recommended plan type guidance
  if (healthProfile.utilizationScore.recommendedPlanType === 'PPO') {
    actionItems.push('→ PPO plans recommended for specialist access without referrals');
  } else if (healthProfile.utilizationScore.recommendedPlanType === 'HDHP') {
    actionItems.push('→ HDHP + HSA recommended for tax savings and lower premiums');
  } else {
    actionItems.push('→ HMO plans offer good value with coordinated care');
  }

  actionItems.push('→ Focus on total cost of care (premium + deductible + copays), not just monthly premium');

  actionItems.push('');
  actionItems.push(`📍 Verify Network Coverage:`);

  // Add preferred hospital guidance
  if (formData.hasPreferredHospital && formData.preferredHospitalName) {
    actionItems.push(`→ IMPORTANT: Verify ${formData.preferredHospitalName} is in-network`);
    if (formData.hospitalImportance === 'must-stay') {
      actionItems.push('→ Critical: Only choose plans that include this provider');
      actionItems.push('→ Call the hospital to get list of accepted insurance plans');
    } else if (formData.hospitalImportance === 'prefer') {
      actionItems.push('→ Prioritize plans that include this provider, but consider alternatives');
    }
    actionItems.push('');
  }

  actionItems.push(`→ Check provider directories for all your states: ${statesList}`);
  actionItems.push('→ Call your preferred doctors to confirm they accept the plan');
  actionItems.push('→ Ask about in-network hospitals near each residence');

  // Add nationwide coverage guidance
  if (formData.needsNationalCoverage === 'critical') {
    actionItems.push('→ IMPORTANT: Verify plan has nationwide network (PPO recommended)');
    actionItems.push('→ Ask about coverage for emergencies and urgent care while traveling');
  } else if (formData.needsNationalCoverage === 'moderate') {
    actionItems.push('→ Consider plans with broader networks for occasional travel');
  }

  actionItems.push('');

  // Add health-specific action items
  const healthActions = getHealthSpecificActions(healthProfile, formData);
  if (healthActions.length > 0) {
    actionItems.push('📋 Additional Steps Based on Your Health:');
    actionItems.push(...healthActions);
    actionItems.push('');
  }

  // Add financial priority guidance
  if (formData.financialPriority) {
    actionItems.push('💰 Shopping Based on Your Financial Priority:');
    if (formData.financialPriority === 'lowest-premium') {
      actionItems.push('→ Sort plans by monthly premium (lowest first)');
      actionItems.push('→ Consider Bronze or Bronze HDHP plans');
      actionItems.push('→ Ensure you have emergency savings for higher deductibles');
    } else if (formData.financialPriority === 'lowest-deductible') {
      actionItems.push('→ Filter for plans with deductibles under $2,000');
      actionItems.push('→ Focus on Silver or Gold tier plans');
      actionItems.push('→ Insurance will start covering costs sooner when you need care');
    } else if (formData.financialPriority === 'lowest-oop-max') {
      actionItems.push('→ Filter for plans with out-of-pocket maximums under $5,000');
      actionItems.push('→ Consider Gold or Platinum plans for best catastrophic protection');
      actionItems.push('→ Best choice if worried about major medical expenses');
    } else if (formData.financialPriority === 'balanced') {
      actionItems.push('→ Compare total cost of care (premium x 12 + expected medical costs)');
      actionItems.push('→ Silver plans typically offer good balance');
      actionItems.push('→ Look for moderate deductibles ($2,000-$4,000)');
    }

    // Add affordability guidance
    if (formData.canAffordUnexpectedBill === 'no-need-plan') {
      actionItems.push('→ IMPORTANT: Prioritize lower deductibles and out-of-pocket maximums');
      actionItems.push('→ Consider Silver or Gold plans to minimize surprise costs');
    } else if (formData.canAffordUnexpectedBill === 'yes-difficulty') {
      actionItems.push('→ Balance premium savings with manageable deductibles');
      actionItems.push('→ Avoid deductibles over $5,000 to reduce financial stress');
    }
    actionItems.push('');
  }

  const budgetNote = checkBudgetCompatibility(budget, totalCost);
  if (budgetNote) {
    actionItems.push(budgetNote);
  }

  // Add health-based reasoning
  const healthReasoning = getHealthBasedReasoning(healthProfile);
  if (healthReasoning) {
    reasoning += ' ' + simplifyReasoning(healthReasoning);
  }

  // Add "What this means" section
  const whatThisMeans = generateWhatThisMeans(recommendedPlan, states, formData.simpleMode);

  const alternativeOptions = getNonMedicareAlternatives(
    formData,
    adultCount,
    childCount,
    states,
    coverageScore
  );

  // Transform marketplace plans to simplified format for UI (with safe null checks)
  const simplifiedPlans = (marketplaceData?.plans && Array.isArray(marketplaceData.plans))
    ? marketplaceData.plans
        .filter(plan => plan != null) // Filter out null/undefined plans
        .slice(0, 5)
        .map(plan => ({
          id: plan.id || '',
          name: plan.name || 'Unknown Plan',
          issuer: plan.issuer?.name || 'Unknown Issuer',
          type: plan.type || 'Unknown',
          metalLevel: plan.metal_level || 'Silver',
          premium: plan.premium || 0,
          premiumAfterCredit: plan.premium_w_credit,
          deductible: plan.deductibles?.[0]?.individual?.amount || 0,
          outOfPocketMax: plan.moops?.[0]?.individual?.amount || 0,
          qualityRating: plan.quality_rating?.available ? plan.quality_rating.global_rating : undefined,
          hasNationalNetwork: plan.has_national_network || false,
        }))
    : undefined;

  // Determine plan type
  let planType = 'PPO'; // Default to PPO for flexibility
  if (marketplaceData?.plans && marketplaceData.plans.length > 0) {
    // Use the top recommended plan's type
    planType = marketplaceData.plans[0]?.type || 'PPO';
  } else if (!healthProfile.isHighUtilization && healthProfile.prescriptionCount === 'none') {
    // Suggest HDHP + HSA for healthy individuals
    planType = 'HDHP + HSA';
  }

  return {
    recommendedInsurance: recommendedPlan,
    planType,
    householdBreakdown,
    estimatedMonthlyCost: totalCost,
    coverageGapScore: coverageScore,
    reasoning: reasoning + '\n\n' + whatThisMeans,
    actionItems,
    alternativeOptions,
    marketplacePlans: simplifiedPlans,
    marketplaceDataAvailable: !!marketplaceData && Array.isArray(marketplaceData.plans) && marketplaceData.plans.length > 0,
  };
}
