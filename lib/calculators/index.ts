/**
 * Calculators Module
 *
 * Exports financial calculators for healthcare planning.
 */

export {
  calculateHSAOptimization,
  validateHDHPEligibility,
  calculatePaycheckContribution,
  estimateRetirementHealthcareCosts,
  getHSALimits,
  calculateTaxEquivalentYield,
  type HSAInput,
  type HSAAnalysis,
  type HSAContributionLimits,
  type HSATaxSavings,
  type HSAProjection,
} from './hsa';

export {
  analyzeMAGI,
  quickSubsidyCalculator,
  calculateFPLPercent,
  getIncomeAtFPL,
  isMedicaidExpansionState,
  type MAGIOptimizerInput,
  type MAGIAnalysis,
  type MAGIStrategy,
  type SubsidyBreakpoint,
} from './magi';
