import { InsuranceRecommendation, CurrentInsurance, Suggestion } from '@/types';
import { THRESHOLDS, PLAN_TYPES, PRIORITY_LEVELS, SUGGESTION_TYPES } from '@/lib/constants';
import { calculateAverageCost, calculateAnnualSavings, calculateMonthlySavings } from '@/lib/costUtils';

/**
 * Add current insurance comparison and suggestions
 */
export function addCurrentInsuranceComparison(
  recommendation: InsuranceRecommendation,
  currentInsurance: CurrentInsurance,
  states: string[]
): InsuranceRecommendation {
  // Create current insurance summary
  const currentInsuranceSummary = `${currentInsurance.carrier} ${currentInsurance.planType} - $${currentInsurance.monthlyCost}/month (Deductible: $${currentInsurance.deductible}, Max OOP: $${currentInsurance.outOfPocketMax})`;

  // Calculate cost comparison
  const recommendedAvg = calculateAverageCost(recommendation.estimatedMonthlyCost);
  const monthlySavings = calculateMonthlySavings(currentInsurance.monthlyCost, recommendedAvg);
  const annualSavings = calculateAnnualSavings(currentInsurance.monthlyCost, recommendedAvg);

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
  if (monthlySavings > THRESHOLDS.SIGNIFICANT_SAVINGS) {
    suggestions.push({
      type: SUGGESTION_TYPES.COST_SAVINGS,
      title: 'Significant Cost Savings Opportunity',
      description: `You could save approximately $${Math.round(monthlySavings)}/month ($${Math.round(monthlySavings * 12)}/year) by switching to our recommended plan.`,
      potentialSavings: monthlySavings,
      priority: PRIORITY_LEVELS.HIGH,
    });
  } else if (monthlySavings > THRESHOLDS.MODERATE_SAVINGS) {
    suggestions.push({
      type: SUGGESTION_TYPES.COST_SAVINGS,
      title: 'Moderate Cost Savings Available',
      description: `Switching could save you around $${Math.round(monthlySavings)}/month. Consider if the network and coverage differences are worth the savings.`,
      potentialSavings: monthlySavings,
      priority: PRIORITY_LEVELS.MEDIUM,
    });
  }

  // Network expansion for multi-state coverage
  if (currentInsurance.planType === PLAN_TYPES.HMO || currentInsurance.planType === PLAN_TYPES.EPO) {
    const networkDesc = stateCount > 2
      ? `Your current ${currentInsurance.planType} plan likely has network restrictions that don't work well across ${stateCount} states (${statesList}). A national PPO would provide seamless coverage in all locations.`
      : `Your current ${currentInsurance.planType} plan likely has network restrictions that don't work well between ${statesList}. A national PPO would provide seamless coverage in both locations.`;

    suggestions.push({
      type: SUGGESTION_TYPES.NETWORK_EXPANSION,
      title: 'Limited Network Coverage Across States',
      description: networkDesc,
      priority: PRIORITY_LEVELS.HIGH,
    });
  }

  // Coverage improvement for Medicare-eligible
  if (recommendation.recommendedInsurance.includes(PLAN_TYPES.MEDICARE) &&
      !currentInsurance.planType.includes(PLAN_TYPES.MEDICARE)) {
    suggestions.push({
      type: SUGGESTION_TYPES.COVERAGE_IMPROVEMENT,
      title: 'Medicare Eligibility Available',
      description: 'You appear to be Medicare-eligible. Medicare with Medigap provides nationwide coverage with no network restrictions, which is ideal for multi-state living.',
      priority: PRIORITY_LEVELS.HIGH,
    });
  }

  // Plan type optimization
  if (currentInsurance.planType === PLAN_TYPES.MEDICARE_ADVANTAGE &&
      recommendation.recommendedInsurance.includes(PLAN_TYPES.MEDIGAP)) {
    const maDesc = stateCount > 2
      ? `Medicare Advantage plans are typically network-based and may require different plans across ${stateCount} states. Original Medicare with Medigap works seamlessly nationwide.`
      : `Medicare Advantage plans are typically network-based and may require different plans in ${statesList}. Original Medicare with Medigap works seamlessly nationwide.`;

    suggestions.push({
      type: SUGGESTION_TYPES.PLAN_CHANGE,
      title: 'Consider Switching from Medicare Advantage to Medigap',
      description: maDesc,
      priority: PRIORITY_LEVELS.HIGH,
    });
  }

  // High deductible concern
  if (currentInsurance.deductible > THRESHOLDS.HIGH_DEDUCTIBLE) {
    const deductibleDesc = stateCount > 2
      ? `Your current deductible of $${currentInsurance.deductible} is quite high. Consider if a plan with a lower deductible might provide better protection, especially when splitting time across ${stateCount} states.`
      : `Your current deductible of $${currentInsurance.deductible} is quite high. Consider if a plan with a lower deductible might provide better protection, especially when splitting time between two states.`;

    suggestions.push({
      type: SUGGESTION_TYPES.COVERAGE_IMPROVEMENT,
      title: 'High Deductible Risk',
      description: deductibleDesc,
      priority: PRIORITY_LEVELS.MEDIUM,
    });
  }

  // High out-of-pocket maximum
  if (currentInsurance.outOfPocketMax > THRESHOLDS.HIGH_OUT_OF_POCKET_MAX) {
    suggestions.push({
      type: SUGGESTION_TYPES.COVERAGE_IMPROVEMENT,
      title: 'High Out-of-Pocket Maximum',
      description: `Your current out-of-pocket maximum of $${currentInsurance.outOfPocketMax} could expose you to significant financial risk. Look for plans with lower maximums for better protection.`,
      priority: PRIORITY_LEVELS.MEDIUM,
    });
  }

  // Cost increase warning
  if (monthlySavings < THRESHOLDS.COST_INCREASE_WARNING) {
    const costDesc = stateCount > 2
      ? `Your current plan costs less than our recommendation. However, verify it provides adequate coverage across all ${stateCount} of your states before keeping it.`
      : `Your current plan costs less than our recommendation. However, verify it provides adequate coverage in both ${statesList} before keeping it.`;

    suggestions.push({
      type: SUGGESTION_TYPES.COST_SAVINGS,
      title: 'Your Current Plan is More Affordable',
      description: costDesc,
      priority: PRIORITY_LEVELS.LOW,
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
  if (currentInsurance.planType === PLAN_TYPES.HMO || currentInsurance.planType === PLAN_TYPES.EPO) {
    areas.push('Multi-state network coverage');
  }

  // Cost optimization
  if (monthlySavings > THRESHOLDS.MODERATE_SAVINGS) {
    areas.push('Monthly premium costs');
  }

  // Deductible
  if (currentInsurance.deductible > THRESHOLDS.HIGH_DEDUCTIBLE) {
    areas.push('Lower deductible options');
  }

  // Out-of-pocket protection
  if (currentInsurance.outOfPocketMax > THRESHOLDS.HIGH_OUT_OF_POCKET_MAX) {
    areas.push('Out-of-pocket maximum protection');
  }

  // Medicare optimization
  if (recommendation.recommendedInsurance.includes(PLAN_TYPES.MEDICARE) &&
      !currentInsurance.planType.includes(PLAN_TYPES.MEDICARE)) {
    areas.push('Medicare eligibility utilization');
  }

  // Plan flexibility
  if (currentInsurance.planType === PLAN_TYPES.MEDICARE_ADVANTAGE &&
      recommendation.recommendedInsurance.includes(PLAN_TYPES.MEDIGAP)) {
    areas.push('Plan flexibility for multi-state living');
  }

  return areas;
}
