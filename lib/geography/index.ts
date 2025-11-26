/**
 * Geography Services Module
 *
 * Exports geographic cost adjustment and location data functionality.
 */

export {
  getStateCostIndex,
  getMetroCostIndex,
  getCostAdjustmentFactor,
  adjustCostForLocation,
  getTierDescription,
  getStatesByExpense,
  estimateAnnualCostVariance,
  STATE_COST_INDICES,
  METRO_AREA_INDICES,
  type CountyCostIndex,
  type StateCostSummary,
} from './cost-index';
