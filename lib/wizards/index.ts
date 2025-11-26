/**
 * Wizards Module
 *
 * Exports guided wizard functionality for complex coverage decisions.
 */

export {
  analyzeJobChange,
  quickCOBRAvsMarketplace,
  type JobChangeScenario,
  type JobChangeAnalysis,
  type CoverageOption,
  type TimelineEvent,
} from './job-change';

export {
  analyzeMedicareTransition,
  getMedicareEligibilityDate,
  calculatePartBPenalty,
  calculatePartDPenalty,
  getIRMAASurcharge,
  type MedicareTransitionInput,
  type MedicareTransitionAnalysis,
  type MedicareEnrollmentPeriod,
  type MedicareCostEstimate,
  type MedicareDecision,
  type ChecklistItem,
} from './medicare-transition';
