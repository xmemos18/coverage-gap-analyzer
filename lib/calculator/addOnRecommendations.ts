/**
 * Add-On Insurance Recommendation Engine
 *
 * Generates personalized add-on insurance recommendations based on household age composition
 */

import type { CalculatorFormData, InsuranceRecommendation } from '@/types';
import type {
  AddOnInsurance,
  AddOnRecommendation,
  AddOnInsuranceAnalysis,
  HouseholdAgeGroup,
  RecommendationPriority,
  AddOnInsurancePreferences,
} from '@/types/addOnInsurance';
import {
  ADD_ON_INSURANCE_PRODUCTS,
  ADD_ON_COST_ADJUSTMENTS,
  PRIORITY_THRESHOLDS,
} from '@/lib/addOnInsuranceData';
import { logger } from '@/lib/logger';
import { adjustCostForStates } from '@/lib/stateSpecificData';
import { RECOMMENDATION_REASONS } from '@/types/addOnInsurance';
import {
  calculateHouseholdActuarialProbability,
  getAgeAdjustedCost,
} from './actuarialCurves';

/**
 * Main function to generate add-on insurance recommendations
 */
export function generateAddOnRecommendations(
  formData: CalculatorFormData,
  primaryRecommendation: InsuranceRecommendation,
  preferences?: AddOnInsurancePreferences
): AddOnInsuranceAnalysis {
  try {
    // Validate input
    if (!formData || (!formData.adultAges?.length && !formData.childAges?.length)) {
      throw new Error('No household ages provided for add-on recommendations');
    }

    // Analyze household age groups
    const householdAgeGroups = analyzeHouseholdAgeGroups(formData);

  // Generate recommendations for each add-on product
  const allRecommendations: AddOnRecommendation[] = [];
  const recommendations: AddOnRecommendation[] = [];

  for (const insurance of ADD_ON_INSURANCE_PRODUCTS) {
    // Skip if user excluded this category
    if (preferences?.excludeCategories?.includes(insurance.category)) {
      continue;
    }

    // Calculate recommendation score
    const recommendation = calculateRecommendation(
      insurance,
      householdAgeGroups,
      formData,
      primaryRecommendation
    );

    // Add to all recommendations (unfiltered)
    allRecommendations.push(recommendation);

    // Only include recommendations above minimum threshold for filtered list
    if (recommendation.probabilityScore >= PRIORITY_THRESHOLDS.LOW) {
      recommendations.push(recommendation);
    }
  }

  // Sort both arrays by priority (high to low) and then by probability score
  const sortRecommendations = (arr: AddOnRecommendation[]) => {
    arr.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.probabilityScore - a.probabilityScore;
    });
  };

  sortRecommendations(recommendations);
  sortRecommendations(allRecommendations);

  // Filter into priority groups
  const highPriority = recommendations.filter((r) => r.priority === 'high');
  const mediumPriority = recommendations.filter((r) => r.priority === 'medium');
  const lowPriority = recommendations.filter((r) => r.priority === 'low');

  // Calculate total costs
  const totalMonthlyHighPriority = highPriority.reduce(
    (sum, r) => sum + r.householdCostPerMonth,
    0
  );

  const totalMonthlyAllRecommended = recommendations.reduce(
    (sum, r) => sum + r.householdCostPerMonth,
    0
  );

    return {
      recommendations,
      allRecommendations,
      highPriority,
      mediumPriority,
      lowPriority,
      totalMonthlyHighPriority,
      totalMonthlyAllRecommended,
      householdAgeGroups,
    };
  } catch (error) {
    logger.error('Error generating add-on recommendations', { error });
    // Return empty analysis on error to prevent application crash
    return {
      recommendations: [],
      allRecommendations: [],
      highPriority: [],
      mediumPriority: [],
      lowPriority: [],
      totalMonthlyHighPriority: 0,
      totalMonthlyAllRecommended: 0,
      householdAgeGroups: [],
    };
  }
}

/**
 * Analyze household composition and group by age brackets
 */
function analyzeHouseholdAgeGroups(
  formData: CalculatorFormData
): HouseholdAgeGroup[] {
  const groups: HouseholdAgeGroup[] = [];

  const allAges = [...formData.adultAges, ...formData.childAges];

  // Define age brackets
  const brackets = [
    { name: 'Children (0-17)', min: 0, max: 17 },
    { name: 'Young Adults (18-30)', min: 18, max: 30 },
    { name: 'Adults (31-40)', min: 31, max: 40 },
    { name: 'Adults (41-50)', min: 41, max: 50 },
    { name: 'Pre-Retirement (51-64)', min: 51, max: 64 },
    { name: 'Seniors (65-74)', min: 65, max: 74 },
    { name: 'Seniors (75+)', min: 75, max: 120 },
  ];

  for (const bracket of brackets) {
    const ages = allAges.filter((age) => age >= bracket.min && age <= bracket.max);
    if (ages.length > 0) {
      groups.push({
        groupName: bracket.name,
        minAge: bracket.min,
        maxAge: bracket.max,
        memberCount: ages.length,
        ages,
      });
    }
  }

  return groups;
}

/**
 * Calculate recommendation for a specific insurance product
 */
function calculateRecommendation(
  insurance: AddOnInsurance,
  householdAgeGroups: HouseholdAgeGroup[],
  formData: CalculatorFormData,
  _primaryRecommendation: InsuranceRecommendation
): AddOnRecommendation {
  const allAges = [...formData.adultAges, ...formData.childAges];

  // Use actuarial curves for sophisticated probability calculation
  const actuarialResult = calculateHouseholdActuarialProbability(
    allAges,
    insurance.category
  );

  // Start with actuarial probability score
  const probabilityScore = actuarialResult.probabilityScore;
  const topReasonCode = 'PREVENTIVE_CARE'; // Default

  // Apply modifiers based on form data
  const modifiers = calculateModifiers(insurance, formData);
  const finalScore = Math.min(100, probabilityScore + modifiers.adjustment);

  // Determine final priority based on adjusted score
  let finalPriority: RecommendationPriority = 'low';
  if (finalScore >= PRIORITY_THRESHOLDS.HIGH) {
    finalPriority = 'high';
  } else if (finalScore >= PRIORITY_THRESHOLDS.MEDIUM) {
    finalPriority = 'medium';
  } else {
    finalPriority = 'low';
  }

  // Calculate costs with age-based multipliers
  const states = formData.residences.map((r) => r.state);

  // Get age-adjusted base cost for the household (use oldest/highest risk age)
  const maxAge = Math.max(...allAges);
  const ageAdjustedBaseCost = getAgeAdjustedCost(
    insurance.baseCostPerMonth,
    maxAge,
    insurance.category
  );

  // Apply state cost adjustments
  const costRange = adjustCostForStates(
    { low: ageAdjustedBaseCost, high: ageAdjustedBaseCost },
    states
  );
  const adjustedCost = (costRange.low + costRange.high) / 2;

  // Count applicable members
  const applicableMembers = countApplicableMembers(insurance, formData);

  // Apply family discount if applicable
  let householdCost = adjustedCost * applicableMembers;
  if (applicableMembers >= 2) {
    householdCost *= ADD_ON_COST_ADJUSTMENTS.FAMILY_DISCOUNT;
  }

  // Apply multi-state premium if multiple states
  if (states.length > 1) {
    householdCost *= ADD_ON_COST_ADJUSTMENTS.MULTI_STATE_PREMIUM;
  }

  // Generate reasons including actuarial reasoning
  const reasons = generateReasons(
    insurance,
    topReasonCode,
    modifiers.reasons,
    householdAgeGroups,
    actuarialResult.reasoning
  );

  // Determine age group for display
  const ageGroup = determineAgeGroup(householdAgeGroups, insurance);

  return {
    insurance,
    priority: finalPriority,
    probabilityScore: Math.round(finalScore),
    adjustedCostPerMonth: Math.round(adjustedCost),
    householdCostPerMonth: Math.round(householdCost),
    applicableMembers,
    reasons,
    ageGroup,
  };
}

/**
 * Calculate score modifiers based on form data
 */
function calculateModifiers(
  insurance: AddOnInsurance,
  formData: CalculatorFormData
): { adjustment: number; reasons: string[] } {
  let adjustment = 0;
  const reasons: string[] = [];

  // Chronic conditions boost for relevant insurance types
  if (formData.hasChronicConditions) {
    if (
      insurance.category === 'critical-illness' ||
      insurance.category === 'hospital-indemnity' ||
      insurance.category === 'disability'
    ) {
      adjustment += 10;
      reasons.push('Beneficial for those with chronic conditions');
    }
  }

  // Children present boost for dental/vision
  if (formData.childAges.length > 0) {
    if (insurance.category === 'dental' || insurance.category === 'vision') {
      adjustment += 10;
      reasons.push('Highly recommended for families with children');
    }
  }

  // High prescription count boost
  if (formData.prescriptionCount === '4-or-more') {
    if (insurance.category === 'critical-illness') {
      adjustment += 5;
      reasons.push('Additional protection for ongoing medical needs');
    }
  }

  // Budget considerations
  const budgetValue = parseBudgetString(formData.budget);
  if (budgetValue && budgetValue < 500) {
    // Lower priority for expensive add-ons if budget is tight
    if (insurance.baseCostPerMonth > 100) {
      adjustment -= 10;
      reasons.push('Consider budget constraints');
    }
  }

  // Multiple residences - boost travel-related coverage
  if (formData.residences.length > 1) {
    if (
      insurance.category === 'accident' ||
      insurance.category === 'hospital-indemnity'
    ) {
      adjustment += 5;
      reasons.push('Additional protection for frequent travelers');
    }
  }

  // Medicare-eligible household
  if (formData.hasMedicareEligible) {
    if (
      insurance.category === 'dental' ||
      insurance.category === 'vision' ||
      insurance.category === 'hospital-indemnity'
    ) {
      adjustment += 10;
      reasons.push('Fills important gaps in Medicare coverage');
    }
  }

  return { adjustment, reasons };
}

/**
 * Count how many household members this insurance applies to
 */
function countApplicableMembers(
  insurance: AddOnInsurance,
  formData: CalculatorFormData
): number {
  const allAges = [...formData.adultAges, ...formData.childAges];

  // Count members whose age falls within any recommendation bracket
  let count = 0;
  for (const age of allAges) {
    for (const ageRec of insurance.ageRecommendations) {
      if (
        age >= ageRec.minAge &&
        age <= ageRec.maxAge &&
        ageRec.probabilityThreshold >= PRIORITY_THRESHOLDS.LOW
      ) {
        count++;
        break; // Count each person only once
      }
    }
  }

  return Math.max(1, count); // At least 1 for cost calculation
}

/**
 * Generate human-readable reasons for recommendation
 */
function generateReasons(
  insurance: AddOnInsurance,
  topReasonCode: string,
  modifierReasons: string[],
  householdAgeGroups: HouseholdAgeGroup[],
  actuarialReasoning?: string
): string[] {
  const reasons: string[] = [];

  // Add actuarial reasoning first (most specific to age/risk)
  if (actuarialReasoning) {
    reasons.push(actuarialReasoning);
  }

  // Add primary reason from top recommendation
  if (topReasonCode && topReasonCode in RECOMMENDATION_REASONS) {
    const baseReason = RECOMMENDATION_REASONS[topReasonCode as keyof typeof RECOMMENDATION_REASONS];
    // Avoid duplicating similar reasoning
    if (!actuarialReasoning || !actuarialReasoning.toLowerCase().includes(baseReason.toLowerCase().substring(0, 20))) {
      reasons.push(baseReason);
    }
  }

  // Add age group context
  if (householdAgeGroups.length > 0) {
    const ageGroupNames = householdAgeGroups.map((g) => g.groupName).join(', ');
    reasons.push(`Household composition: ${ageGroupNames}`);
  }

  // Add modifier reasons
  reasons.push(...modifierReasons);

  // Add category-specific context
  if (insurance.category === 'dental' || insurance.category === 'vision') {
    reasons.push('Typically not covered by standard health insurance');
  }

  return reasons;
}

/**
 * Determine primary age group for this recommendation
 */
function determineAgeGroup(
  householdAgeGroups: HouseholdAgeGroup[],
  insurance: AddOnInsurance
): string {
  if (householdAgeGroups.length === 0) {
    return 'All household members';
  }

  // Find the age group with highest recommendation score
  let topGroup: HouseholdAgeGroup | undefined = householdAgeGroups[0];
  let topScore = 0;

  for (const group of householdAgeGroups) {
    for (const ageRec of insurance.ageRecommendations) {
      // Check if this age recommendation overlaps with this group
      if (
        ageRec.minAge <= group.maxAge &&
        ageRec.maxAge >= group.minAge &&
        ageRec.probabilityThreshold > topScore
      ) {
        topScore = ageRec.probabilityThreshold;
        topGroup = group;
      }
    }
  }

  // Fallback if no group was selected (should not happen due to early return)
  if (!topGroup) return 'All household members';

  return topGroup.groupName;
}

/**
 * Parse budget string to numeric value (midpoint of range)
 */
function parseBudgetString(budget: string): number | null {
  const ranges: { [key: string]: number } = {
    'under-300': 250,
    '300-500': 400,
    '500-750': 625,
    '750-1000': 875,
    'over-1000': 1200,
  };

  return ranges[budget] || null;
}

/**
 * Calculate bundle discount if user selects multiple add-ons
 */
export function calculateBundleDiscount(
  selectedRecommendations: AddOnRecommendation[]
): number {
  if (selectedRecommendations.length >= 3) {
    return ADD_ON_COST_ADJUSTMENTS.BUNDLE_DISCOUNT;
  }
  return 1.0; // No discount
}

/**
 * Calculate total cost with all discounts applied
 */
export function calculateTotalAddOnCost(
  selectedRecommendations: AddOnRecommendation[]
): number {
  const subtotal = selectedRecommendations.reduce(
    (sum, rec) => sum + rec.householdCostPerMonth,
    0
  );

  const bundleDiscount = calculateBundleDiscount(selectedRecommendations);
  return Math.round(subtotal * bundleDiscount);
}

/**
 * Get recommendations by priority level
 */
export function getRecommendationsByPriority(
  analysis: AddOnInsuranceAnalysis,
  priority: RecommendationPriority
): AddOnRecommendation[] {
  return analysis.recommendations.filter((r) => r.priority === priority);
}

/**
 * Filter recommendations by budget
 */
export function filterByBudget(
  recommendations: AddOnRecommendation[],
  maxBudget: number
): AddOnRecommendation[] {
  let total = 0;
  const filtered: AddOnRecommendation[] = [];

  // Take recommendations in order until budget is reached
  for (const rec of recommendations) {
    if (total + rec.householdCostPerMonth <= maxBudget) {
      filtered.push(rec);
      total += rec.householdCostPerMonth;
    }
  }

  return filtered;
}
