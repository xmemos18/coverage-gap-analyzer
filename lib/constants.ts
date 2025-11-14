/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values
 */

import env from './env';

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION = {
  ZIP_CODE_LENGTH: 5,
  MEDICARE_ELIGIBILITY_AGE: 65,
  MIN_ADULT_AGE: 18,
  MAX_ADULT_AGE: 120,
  MIN_CHILD_AGE: 0,
  MAX_CHILD_AGE: 17,
  MIN_RESIDENCES: 1,
  MAX_RESIDENCES: env.maxResidences,
  MIN_ADULTS: 1,
  MAX_ADULTS: env.maxAdults,
  MAX_CHILDREN: env.maxChildren,
} as const;

// ============================================================================
// INSURANCE COST CONSTANTS (monthly costs in USD)
// ============================================================================

export const INSURANCE_COSTS = {
  // Medicare costs
  MEDICARE_PER_PERSON_LOW: 300,
  MEDICARE_PER_PERSON_HIGH: 500,

  // Non-Medicare adult costs
  ADULT_PPO_LOW: 600,
  ADULT_PPO_HIGH: 900,

  // Child costs
  CHILD_LOW: 300,
  CHILD_HIGH: 400,

  // Family plan base costs (2 adults + 2 kids)
  FAMILY_BASE_LOW: 1800,
  FAMILY_BASE_HIGH: 2500,

  // Additional child cost
  ADDITIONAL_CHILD_LOW: 300,
  ADDITIONAL_CHILD_HIGH: 400,

  // Single parent adjustment
  SINGLE_PARENT_ADJUSTMENT_LOW: 600,
  SINGLE_PARENT_ADJUSTMENT_HIGH: 900,

  // Couple costs
  COUPLE_LOW: 1200,
  COUPLE_HIGH: 1800,

  // Medicare Advantage
  MEDICARE_ADVANTAGE_LOW: 0,
  MEDICARE_ADVANTAGE_HIGH: 150,

  // Medigap Plan N
  MEDIGAP_PLAN_N_LOW: 250,
  MEDIGAP_PLAN_N_HIGH: 400,

  // Regional PPO
  REGIONAL_PPO_PER_PERSON_LOW: 400,
  REGIONAL_PPO_PER_PERSON_HIGH: 650,

  // ACA Marketplace
  ACA_ADULT_LOW: 400,
  ACA_ADULT_HIGH: 800,
  ACA_CHILD_LOW: 200,
  ACA_CHILD_HIGH: 350,

  // High Deductible Health Plan
  HDHP_ADULT_LOW: 350,
  HDHP_ADULT_HIGH: 600,
  HDHP_CHILD_LOW: 150,
  HDHP_CHILD_HIGH: 250,
} as const;

// ============================================================================
// COVERAGE SCORING CONSTANTS
// ============================================================================

export const COVERAGE_SCORES = {
  NO_STATES: 50,
  SINGLE_STATE: 90,
  ALL_POPULAR_STATES: 85,
  ADJACENT_STATES: 75,
  MANY_STATES: 80, // 5+ states
  MIXED_REGIONS: 85, // 2-4 states
  MEDICARE_SCORE: 90,
  MIXED_HOUSEHOLD_SCORE: 85,
} as const;

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  HEALTHCARE_GOV_TIMEOUT_MS: 10000, // 10 second timeout
  HEALTHCARE_GOV_MAX_RETRIES: 2, // Retry failed requests up to 2 times
  HEALTHCARE_GOV_RETRY_DELAY_MS: 1000, // Wait 1 second between retries
} as const;

// ============================================================================
// BUDGET RANGES
// ============================================================================

export const BUDGET_RANGES = {
  'less-500': 500,
  '500-1000': 1000,
  '1000-2000': 2000,
  '2000-3500': 3500,
  '3500-plus': 10000,
  'not-sure': 10000,
} as const;

// ============================================================================
// THRESHOLDS
// ============================================================================

export const THRESHOLDS = {
  // Deductible and out-of-pocket thresholds
  HIGH_DEDUCTIBLE: 5000,
  HIGH_OUT_OF_POCKET_MAX: 10000,

  // Savings thresholds
  SIGNIFICANT_SAVINGS: 100,
  MODERATE_SAVINGS: 50,
  COST_INCREASE_WARNING: -100,

  // Storage (configured via environment variables)
  DATA_EXPIRY_HOURS: env.sessionTimeoutHours,
  DEBOUNCE_DELAY_MS: 1000,
  AUTO_FOCUS_DELAY_MS: 100,
  ANNOUNCEMENT_CLEAR_DELAY_MS: 1000,

  // Loading simulation
  ANALYSIS_DELAY_MS: 1500,
} as const;

// ============================================================================
// CALCULATOR STEPS
// ============================================================================

export const CALCULATOR_STEPS = {
  RESIDENCES: 1,
  HOUSEHOLD: 2,
  HEALTH_PROFILE: 3,
  CURRENT_INSURANCE: 4,
  BUDGET: 5,
  TOTAL_STEPS: 5,
} as const;

export const STEP_NAMES = [
  'Residences',
  'Household',
  'Health Profile',
  'Current Insurance',
  'Budget',
] as const;

/**
 * Safely get step name with bounds checking
 * @param step - Step number (1-indexed)
 * @returns Step name or 'Unknown Step' if out of bounds
 */
export function getStepName(step: number): string {
  const index = step - 1;
  if (index >= 0 && index < STEP_NAMES.length) {
    return STEP_NAMES[index];
  }
  return 'Unknown Step';
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  CALCULATOR_DATA: 'coverage-calculator-data',
} as const;

// ============================================================================
// INSURANCE PLAN TYPES
// ============================================================================

export const PLAN_TYPES = {
  HMO: 'HMO',
  EPO: 'EPO',
  PPO: 'PPO',
  MEDICARE: 'Medicare',
  MEDICARE_ADVANTAGE: 'Medicare Advantage',
  MEDIGAP: 'Medigap',
} as const;

// ============================================================================
// PRIORITY LEVELS
// ============================================================================

export const PRIORITY_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

// ============================================================================
// SUGGESTION TYPES
// ============================================================================

export const SUGGESTION_TYPES = {
  COST_SAVINGS: 'cost-savings',
  NETWORK_EXPANSION: 'network-expansion',
  COVERAGE_IMPROVEMENT: 'coverage-improvement',
  PLAN_CHANGE: 'plan-change',
} as const;

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  NEXT: 'alt+n',
  BACK: 'alt+b',
  SUBMIT: 'alt+s',
  CLEAR: 'alt+c',
} as const;

// ============================================================================
// ARIA LIVE REGIONS
// ============================================================================

export const ARIA_LIVE = {
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
} as const;

// ============================================================================
// COPAY AMOUNTS
// ============================================================================

export const COPAY_AMOUNTS = {
  DOCTOR_VISIT: 20,
  EMERGENCY_ROOM: 50,
} as const;

// ============================================================================
// DEDUCTIBLE RANGES
// ============================================================================

export const DEDUCTIBLE_RANGES = {
  HDHP_FAMILY_LOW: 3000,
  HDHP_FAMILY_HIGH: 7000,
} as const;

// ============================================================================
// SUBSIDY REDUCTION PERCENTAGES
// ============================================================================

export const SUBSIDY_REDUCTION = {
  LOW: 50,
  HIGH: 80,
} as const;

// ============================================================================
// CONCIERGE MEDICINE COSTS
// ============================================================================

export const CONCIERGE_COSTS = {
  LOW: 150,
  HIGH: 400,
} as const;
