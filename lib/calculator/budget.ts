import { CostRange } from '@/types';
import { BUDGET_RANGES, CONCIERGE_COSTS } from '@/lib/constants';

/**
 * Check if budget is compatible with recommended cost
 * Returns a note if budget is too low or if user selected "show all"
 */
export function checkBudgetCompatibility(budget: string, estimatedCost: CostRange): string | null {
  const maxBudget = BUDGET_RANGES[budget as keyof typeof BUDGET_RANGES] || BUDGET_RANGES['not-sure'];

  // Budget is lower than recommendation
  if (maxBudget < estimatedCost.low) {
    return 'Your budget is lower than estimated costs. Check healthcare.gov for ACA subsidies - you may qualify for income-based assistance.';
  }

  // User wants to see all options
  if (budget === 'not-sure') {
    return `Consider concierge medicine add-on ($${CONCIERGE_COSTS.LOW}-${CONCIERGE_COSTS.HIGH}/month) for enhanced service and immediate access.`;
  }

  return null;
}
