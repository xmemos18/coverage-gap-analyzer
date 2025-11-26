/**
 * Cost Projections Module
 *
 * Exports all projection-related functionality including:
 * - Multi-year cost projections
 * - Lifetime projections to Medicare
 * - Break-even analysis
 */

export {
  // Core function
  generateMultiYearProjection,

  // Quick helpers
  quickFiveYearProjection,
  projectToMedicare,
  calculateYearlyBreakdown,

  // Constants
  DEFAULT_INFLATION_FACTORS,

  // Types
  type InflationFactors,
  type MultiYearProjection,
  type AgeTransition,
  type LifetimeProjection,
  type ProjectionInput,
} from './multi-year';
