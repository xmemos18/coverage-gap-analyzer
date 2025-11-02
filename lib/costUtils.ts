/**
 * Shared cost calculation utilities
 * Provides reusable functions for common cost operations across the application
 */

import { CostRange } from '@/types';

/**
 * Convert monthly cost to annual cost
 */
export function monthlyToAnnual(monthlyCost: number): number {
  return monthlyCost * 12;
}

/**
 * Convert monthly cost range to annual cost range
 */
export function monthlyCostRangeToAnnual(costRange: CostRange): CostRange {
  return {
    low: monthlyToAnnual(costRange.low),
    high: monthlyToAnnual(costRange.high),
  };
}

/**
 * Calculate the average of a cost range
 */
export function calculateAverageCost(costRange: CostRange): number {
  return (costRange.low + costRange.high) / 2;
}

/**
 * Calculate total cost over a time period (in years)
 */
export function calculateTotalCostOverYears(
  monthlyCost: number,
  years: number
): number {
  return monthlyToAnnual(monthlyCost) * years;
}

/**
 * Calculate total cost range over a time period (in years)
 */
export function calculateCostRangeOverYears(
  costRange: CostRange,
  years: number
): CostRange {
  const annualRange = monthlyCostRangeToAnnual(costRange);
  return {
    low: annualRange.low * years,
    high: annualRange.high * years,
  };
}

/**
 * Calculate cost range for multiple members
 */
export function calculateMemberCostRange(
  baseCostRange: CostRange,
  memberCount: number
): CostRange {
  return {
    low: baseCostRange.low * memberCount,
    high: baseCostRange.high * memberCount,
  };
}

/**
 * Calculate combined cost range from multiple cost ranges
 * Useful for household calculations with different member types
 */
export function combineCostRanges(...costRanges: CostRange[]): CostRange {
  return costRanges.reduce(
    (total, range) => ({
      low: total.low + range.low,
      high: total.high + range.high,
    }),
    { low: 0, high: 0 }
  );
}

/**
 * Calculate monthly savings between two costs
 */
export function calculateMonthlySavings(
  currentCost: number,
  newCost: number
): number {
  return currentCost - newCost;
}

/**
 * Calculate annual savings between two costs
 */
export function calculateAnnualSavings(
  currentMonthlyCost: number,
  newMonthlyCost: number
): number {
  const monthlySavings = calculateMonthlySavings(currentMonthlyCost, newMonthlyCost);
  return monthlyToAnnual(monthlySavings);
}

/**
 * Calculate savings over multiple years
 */
export function calculateSavingsOverYears(
  currentMonthlyCost: number,
  newMonthlyCost: number,
  years: number
): number {
  const annualSavings = calculateAnnualSavings(currentMonthlyCost, newMonthlyCost);
  return annualSavings * years;
}

/**
 * Format cost with period label
 */
export function formatCostWithPeriod(
  cost: number,
  period: 'monthly' | 'annual' | 'total'
): string {
  const formattedCost = `$${Math.round(cost).toLocaleString()}`;

  switch (period) {
    case 'monthly':
      return `${formattedCost}/month`;
    case 'annual':
      return `${formattedCost}/year`;
    case 'total':
      return formattedCost;
    default:
      return formattedCost;
  }
}

/**
 * Format cost range with period label
 */
export function formatCostRangeWithPeriod(
  costRange: CostRange,
  period: 'monthly' | 'annual' | 'total'
): string {
  const low = Math.round(costRange.low);
  const high = Math.round(costRange.high);

  if (low === high) {
    return formatCostWithPeriod(low, period);
  }

  const formattedRange = `$${low.toLocaleString()}-$${high.toLocaleString()}`;

  switch (period) {
    case 'monthly':
      return `${formattedRange}/month`;
    case 'annual':
      return `${formattedRange}/year`;
    case 'total':
      return formattedRange;
    default:
      return formattedRange;
  }
}

/**
 * Check if switching plans would result in savings
 */
export function isSavingMoney(
  currentCost: number,
  newCost: number
): boolean {
  return currentCost > newCost;
}

/**
 * Check if switching plans would result in higher costs
 */
export function isCostingMore(
  currentCost: number,
  newCost: number
): boolean {
  return newCost > currentCost;
}

/**
 * Calculate percentage savings
 */
export function calculatePercentageSavings(
  currentCost: number,
  newCost: number
): number {
  if (currentCost === 0) return 0;
  return ((currentCost - newCost) / currentCost) * 100;
}
