import { CalculatorFormData, InsuranceRecommendation, CostRange } from '@/types';
import { checkBudgetCompatibility } from './budget';
import { getMedicareAlternatives, getMixedHouseholdAlternatives, getNonMedicareAlternatives } from './alternatives';
import { INSURANCE_COSTS, COVERAGE_SCORES } from '@/lib/constants';

/**
 * SCENARIO 1: Medicare-Eligible Households (all adults 65+)
 *
 * Best option: Original Medicare + Medigap
 * Works everywhere in the US without network restrictions
 */
export function getMedicareRecommendation(
  formData: CalculatorFormData,
  medicareEligibleCount: number,
  coverageScore: number,
  budget: string,
  states: string[]
): InsuranceRecommendation {
  const costPerPerson = {
    low: INSURANCE_COSTS.MEDICARE_PER_PERSON_LOW,
    high: INSURANCE_COSTS.MEDICARE_PER_PERSON_HIGH
  };
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
    coverageGapScore: COVERAGE_SCORES.MEDICARE_SCORE,
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
export function getMixedHouseholdRecommendation(
  formData: CalculatorFormData,
  medicareEligibleCount: number,
  nonMedicareAdultCount: number,
  childCount: number,
  coverageScore: number,
  budget: string,
  states: string[]
): InsuranceRecommendation {
  const totalCost: CostRange = {
    low: (medicareEligibleCount * INSURANCE_COSTS.MEDICARE_PER_PERSON_LOW) +
         (nonMedicareAdultCount * INSURANCE_COSTS.ADULT_PPO_LOW) +
         (childCount * INSURANCE_COSTS.CHILD_LOW),
    high: (medicareEligibleCount * INSURANCE_COSTS.MEDICARE_PER_PERSON_HIGH) +
          (nonMedicareAdultCount * INSURANCE_COSTS.ADULT_PPO_HIGH) +
          (childCount * INSURANCE_COSTS.CHILD_HIGH),
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
    coverageGapScore: COVERAGE_SCORES.MIXED_HOUSEHOLD_SCORE,
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
export function getNonMedicareRecommendation(
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
    totalCost = {
      low: INSURANCE_COSTS.ADULT_PPO_LOW,
      high: INSURANCE_COSTS.ADULT_PPO_HIGH
    };
    reasoning = stateCount > 2
      ? `A national PPO plan gives you flexibility to see doctors across all ${stateCount} of your states without referrals or network restrictions.`
      : `A national PPO plan gives you flexibility to see doctors in both ${statesList} without referrals or network restrictions.`;
  }
  // Couple (2 adults, no kids)
  else if (adultCount === 2 && childCount === 0) {
    recommendedPlan = 'National PPO Couples Plan';
    householdBreakdown = '2 adults';
    totalCost = {
      low: INSURANCE_COSTS.COUPLE_LOW,
      high: INSURANCE_COSTS.COUPLE_HIGH
    };
    reasoning = stateCount > 2
      ? `A couples plan provides comprehensive coverage for both of you across all ${stateCount} of your states with access to a nationwide network.`
      : `A couples plan provides comprehensive coverage for both of you across ${statesList} with access to a nationwide network.`;
  }
  // Family with children
  else if (childCount > 0) {
    recommendedPlan = 'National PPO Family Plan';
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
      ? `A family PPO plan covers everyone in your household with access to care across all ${stateCount} of your states and nationwide.`
      : `A family PPO plan covers everyone in your household with access to care in ${statesList} and nationwide.`;
  }
  // Multiple adults, no children (roommates/extended family)
  else {
    recommendedPlan = `National PPO Plan for ${adultCount} adults`;
    householdBreakdown = `${adultCount} adults`;
    totalCost = {
      low: adultCount * INSURANCE_COSTS.ADULT_PPO_LOW,
      high: adultCount * INSURANCE_COSTS.ADULT_PPO_HIGH,
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
