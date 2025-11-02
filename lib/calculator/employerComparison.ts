/**
 * Employer vs. Marketplace Comparison
 * Compares employer-sponsored insurance with marketplace plans
 */

import { CostRange } from '@/types';
import { INCOME_RANGE_MIDPOINTS } from './subsidyCalculator';

// ACA affordability threshold (2024)
const AFFORDABILITY_THRESHOLD = 0.0912; // 9.12% of household income

export interface EmployerPlanAnalysis {
  isAffordable: boolean;
  employerPlanCostAfterContribution: number;
  marketplaceCostAfterSubsidy: CostRange;
  recommendation: string;
  monthlySavings: number | null;
  explanation: string;
  actionItems: string[];
}

/**
 * Get estimated income from income range
 */
function getEstimatedIncome(incomeRange: string): number {
  return INCOME_RANGE_MIDPOINTS[incomeRange] || INCOME_RANGE_MIDPOINTS['prefer-not-say'];
}

/**
 * Calculate employer plan cost after employer contribution
 * Assumes employer coverage typically costs ~$700-$1200/month for individual before contribution
 */
function estimateEmployerPlanCost(
  employerContribution: number,
  householdSize: number
): number {
  // Estimate total employer plan cost based on household size
  const baseEmployerPlanCost = householdSize === 1 ? 800 : 1500 + (householdSize - 2) * 300;

  // Subtract employer contribution to get employee's cost
  return Math.max(0, baseEmployerPlanCost - employerContribution);
}

/**
 * Compare employer insurance with marketplace plans
 */
export function compareEmployerToMarketplace(
  hasEmployerInsurance: boolean,
  employerContribution: number,
  incomeRange: string,
  householdSize: number,
  marketplaceCostAfterSubsidy: CostRange
): EmployerPlanAnalysis | null {
  // If no employer insurance available, return null
  if (!hasEmployerInsurance) {
    return null;
  }

  const estimatedIncome = getEstimatedIncome(incomeRange);
  const employerPlanCost = estimateEmployerPlanCost(employerContribution, householdSize);

  // Calculate affordability (ACA standard: employee premium must be < 9.12% of household income)
  const monthlyIncome = estimatedIncome / 12;
  const affordabilityThreshold = monthlyIncome * AFFORDABILITY_THRESHOLD;
  const isAffordable = employerPlanCost <= affordabilityThreshold;

  // Calculate average marketplace cost
  const avgMarketplaceCost = (marketplaceCostAfterSubsidy.low + marketplaceCostAfterSubsidy.high) / 2;

  // Determine recommendation
  let recommendation = '';
  let monthlySavings: number | null = null;
  let explanation = '';
  const actionItems: string[] = [];

  if (!isAffordable) {
    // Employer plan is NOT affordable - user can get marketplace subsidy
    recommendation = 'Consider switching to marketplace coverage';
    monthlySavings = employerPlanCost - avgMarketplaceCost;

    explanation = `Your employer coverage is considered "unaffordable" under ACA rules because ` +
      `your share of the premium ($${employerPlanCost.toFixed(0)}/month) exceeds ${(AFFORDABILITY_THRESHOLD * 100).toFixed(2)}% ` +
      `of your household income. This means you CAN qualify for marketplace subsidies even though ` +
      `you have employer coverage available. ` +
      (monthlySavings > 0
        ? `Switching to the marketplace could save you approximately $${Math.round(monthlySavings)}/month.`
        : 'The marketplace may offer comparable coverage at a similar or lower cost.'
      );

    actionItems.push(
      'Shop on HealthCare.gov or your state marketplace',
      'Compare coverage levels - employer vs. marketplace plans',
      'Check if your doctors are in marketplace plan networks',
      'Consider employer plan benefits (coverage quality, deductibles) vs. price savings'
    );
  } else if (employerPlanCost < avgMarketplaceCost) {
    // Employer plan is affordable AND cheaper
    recommendation = 'Keep your employer coverage - it\'s your best value';
    monthlySavings = avgMarketplaceCost - employerPlanCost;

    explanation = `Your employer coverage is affordable (costs only ${((employerPlanCost / monthlyIncome) * 100).toFixed(1)}% ` +
      `of your income, well below the ${(AFFORDABILITY_THRESHOLD * 100).toFixed(2)}% threshold) and likely your best value. ` +
      `After your employer's contribution of $${employerContribution}/month, you pay just $${employerPlanCost.toFixed(0)}/month, ` +
      `which is about $${Math.round(monthlySavings)}/month less than marketplace options.`;

    actionItems.push(
      'Confirm your employer plan covers all household members you need',
      'Review your employer plan\'s coverage details and network',
      'Understand your deductible and out-of-pocket maximum',
      'Take advantage of any employer HSA or FSA contributions'
    );
  } else {
    // Employer plan is affordable but marketplace might be cheaper
    const potentialSavings = employerPlanCost - avgMarketplaceCost;

    if (potentialSavings > 50) {
      recommendation = 'Compare marketplace plans - you might save money';
      monthlySavings = potentialSavings;

      explanation = `Your employer coverage is affordable under ACA rules, but marketplace plans with subsidies ` +
        `might be $${Math.round(potentialSavings)}/month cheaper. However, since your employer plan is "affordable," ` +
        `you may NOT be eligible for marketplace subsidies. Double-check the subsidy rules with a marketplace ` +
        `navigator or Healthcare.gov.`;

      actionItems.push(
        'Use marketplace calculator to check exact subsidy eligibility',
        'Compare coverage quality and networks carefully',
        'Factor in employer HSA/FSA contributions if available',
        'Consult with a health insurance navigator for personalized guidance'
      );
    } else {
      recommendation = 'Keep your employer coverage';
      monthlySavings = null;

      explanation = `Your employer coverage is affordable and competitively priced. The marketplace might be ` +
        `slightly cheaper, but since your employer plan meets affordability standards, you likely won't qualify ` +
        `for marketplace subsidies. Stick with your employer plan for simplicity and likely better coverage.`;

      actionItems.push(
        'Review your employer plan benefits to maximize value',
        'Contribute to employer HSA or FSA if available',
        'Understand your employer plan\'s network and coverage'
      );
    }
  }

  return {
    isAffordable,
    employerPlanCostAfterContribution: employerPlanCost,
    marketplaceCostAfterSubsidy,
    recommendation,
    monthlySavings,
    explanation,
    actionItems,
  };
}
