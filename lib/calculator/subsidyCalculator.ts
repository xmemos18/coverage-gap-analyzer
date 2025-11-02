/**
 * ACA Subsidy Calculator
 * Calculates premium tax credits and Medicaid eligibility based on Federal Poverty Level (FPL)
 */

import { getMedicaidApplicationUrl } from './medicaidResources';
import { getMedicaidApplicationSteps, formatActionStep } from '../concreteActions';

// 2024 Federal Poverty Level (FPL) Guidelines
const FPL_2024_BASE = 15060; // Individual
const FPL_2024_PER_PERSON = 5380; // Additional per person

// Medicaid expansion states (as of 2024)
const MEDICAID_EXPANSION_STATES = [
  'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'HI', 'ID', 'IL', 'IN',
  'IA', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MO', 'MT', 'NE', 'NV',
  'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OR', 'PA', 'RI', 'SD', 'UT',
  'VT', 'VA', 'WA', 'WV', 'WI',
];

// Income range to midpoint mapping (for estimation)
export const INCOME_RANGE_MIDPOINTS: { [key: string]: number } = {
  'under-30k': 25000,
  '30k-50k': 40000,
  '50k-75k': 62500,
  '75k-100k': 87500,
  '100k-150k': 125000,
  'over-150k': 175000,
  'prefer-not-say': 75000, // Assume mid-range for calculation
};

export interface SubsidyResult {
  // Eligibility
  medicaidEligible: boolean;
  subsidyEligible: boolean;

  // Income analysis
  estimatedIncome: number;
  householdFPL: number;
  fplPercentage: number;

  // Subsidy calculations
  estimatedMonthlySubsidy: number;
  maxAffordablePercentage: number;

  // Explanation
  explanation: string;
  medicaidState: boolean;

  // Action items
  actionItems: string[];
}

/**
 * Calculate household Federal Poverty Level
 */
function calculateFPL(householdSize: number): number {
  if (householdSize < 1) return FPL_2024_BASE;
  return FPL_2024_BASE + (householdSize - 1) * FPL_2024_PER_PERSON;
}

/**
 * Get estimated income from income range
 */
function getEstimatedIncome(incomeRange: string): number {
  return INCOME_RANGE_MIDPOINTS[incomeRange] || INCOME_RANGE_MIDPOINTS['prefer-not-say'];
}

/**
 * Calculate maximum affordable percentage based on FPL
 */
function calculateAffordablePercentage(fplPercentage: number): number {
  if (fplPercentage <= 150) return 0.02; // 0-2%
  if (fplPercentage <= 200) return 0.04; // 2-4%
  if (fplPercentage <= 250) return 0.065; // 4-6.5%
  if (fplPercentage <= 300) return 0.085; // 6.5-8.5%
  if (fplPercentage <= 400) return 0.085; // 8.5%
  return 1.0; // No subsidy - 100% of premium
}

/**
 * Calculate ACA subsidy eligibility and estimated subsidy amount
 */
export function calculateSubsidy(
  incomeRange: string,
  numAdults: number,
  numChildren: number,
  states: string[]
): SubsidyResult {
  const householdSize = numAdults + numChildren;
  const estimatedIncome = getEstimatedIncome(incomeRange);
  const householdFPL = calculateFPL(householdSize);
  const fplPercentage = (estimatedIncome / householdFPL) * 100;

  // Check if in Medicaid expansion state
  const primaryState = states[0] || '';
  const medicaidState = MEDICAID_EXPANSION_STATES.includes(primaryState);

  // Determine Medicaid eligibility
  const medicaidEligible = medicaidState && fplPercentage < 138;

  // Determine subsidy eligibility (138-400% FPL, or 100-400% in non-expansion states)
  const subsidyEligible = !medicaidEligible && fplPercentage >= (medicaidState ? 138 : 100) && fplPercentage <= 400;

  // Calculate subsidy
  let estimatedMonthlySubsidy = 0;
  const maxAffordablePercentage = calculateAffordablePercentage(fplPercentage);

  if (subsidyEligible) {
    // Assume average benchmark plan cost of $500/month per person
    const estimatedBenchmarkCost = householdSize * 500;
    const maxAffordableAmount = (estimatedIncome / 12) * maxAffordablePercentage;
    estimatedMonthlySubsidy = Math.max(0, estimatedBenchmarkCost - maxAffordableAmount);
  }

  // Generate explanation
  let explanation = '';
  const actionItems: string[] = [];

  if (medicaidEligible) {
    const medicaidUrl = getMedicaidApplicationUrl(primaryState);

    explanation = `Based on your household income, you may qualify for Medicaid in ${primaryState}. ` +
      `Your income is approximately ${fplPercentage.toFixed(0)}% of the Federal Poverty Level, ` +
      `which is below the 138% threshold for Medicaid expansion states. ` +
      `Medicaid provides free or low-cost health coverage.`;

    // Generate concrete Medicaid application steps
    const medicaidSteps = getMedicaidApplicationSteps(primaryState, medicaidUrl);

    actionItems.push(
      '🎉 Great News: You Likely Qualify for FREE Medicaid Coverage!',
      '',
      formatActionStep(medicaidSteps),
      '',
      '💡 Why Medicaid is Great:',
      '→ Usually FREE or very low cost (typically $0-3/month)',
      '→ Covers doctor visits, hospital care, prescriptions, preventive care',
      '→ No deductibles or high out-of-pocket costs',
      '→ Can apply and enroll any time of year (no waiting for open enrollment)',
      ''
    );
  } else if (subsidyEligible) {
    explanation = `Based on your household income (approximately ${fplPercentage.toFixed(0)}% of FPL), ` +
      `you likely qualify for premium tax credits. Your estimated subsidy could be around ` +
      `$${Math.round(estimatedMonthlySubsidy)}/month, which would reduce your monthly premium costs. ` +
      `You should pay no more than ${(maxAffordablePercentage * 100).toFixed(1)}% of your income on health insurance.`;

    actionItems.push(
      `Shop on HealthCare.gov or your state marketplace to see exact subsidy amounts`,
      `Compare plans after subsidy - you may find very affordable options`,
      `Bring proof of income when applying (tax returns, pay stubs)`
    );
  } else if (fplPercentage > 400) {
    explanation = `Based on your household income (approximately ${fplPercentage.toFixed(0)}% of FPL), ` +
      `you do not qualify for premium tax credits as your income exceeds 400% of the Federal Poverty Level. ` +
      `You can still purchase marketplace plans at full price, or explore employer coverage if available.`;

    actionItems.push(
      `Compare marketplace plans for the best value`,
      `Check if employer coverage is available and more affordable`,
      `Consider high-deductible plans with HSA for tax advantages`
    );
  } else {
    explanation = `You are in the "coverage gap" in ${primaryState}, a state that has not expanded Medicaid. ` +
      `Your income (${fplPercentage.toFixed(0)}% of FPL) is too high for traditional Medicaid but too low ` +
      `for marketplace subsidies. You may need to explore alternative options.`;

    actionItems.push(
      `Check if you qualify for traditional Medicaid based on other factors`,
      `Look into community health centers for low-cost care`,
      `Consider short-term health insurance or health sharing ministries (note limitations)`,
      `Advocate for Medicaid expansion in your state`
    );
  }

  return {
    medicaidEligible,
    subsidyEligible,
    estimatedIncome,
    householdFPL,
    fplPercentage,
    estimatedMonthlySubsidy,
    maxAffordablePercentage,
    explanation,
    medicaidState,
    actionItems,
  };
}

/**
 * Check if state has Medicaid expansion
 */
export function hasMedicaidExpansion(state: string): boolean {
  return MEDICAID_EXPANSION_STATES.includes(state.toUpperCase());
}

/**
 * Get household size from form data
 */
export function getHouseholdSize(numAdults: number, numChildren: number): number {
  return numAdults + numChildren;
}
