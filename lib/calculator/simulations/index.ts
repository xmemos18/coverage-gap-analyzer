/**
 * Simulations Module
 *
 * Exports Monte Carlo simulation functions for healthcare cost analysis.
 */

export {
  runMonteCarlo,
  runMonteCarloAsync,
  generateMonteCarloAnalysis,
  simulatePlanCosts,
  comparePlansWithMonteCarlo,
  type MonteCarloConfig,
  type MonteCarloInput,
  type MonteCarloResult,
  type MonteCarloAnalysis,
  type MonteCarloInterpretation,
  type HistogramBucket,
} from './monte-carlo';
