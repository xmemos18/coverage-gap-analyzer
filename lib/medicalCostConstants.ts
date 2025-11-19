/**
 * Medical Cost Constants
 *
 * Centralized constants for medical costs, thresholds, and assumptions
 * used throughout the calculator logic.
 *
 * Benefits:
 * - Single source of truth for cost assumptions
 * - Easy to update when values change (e.g., annual Medicare Part B premium increases)
 * - Clear documentation of business logic
 * - Better testability
 */

// ============================================================================
// MEDICARE COSTS (2025)
// ============================================================================

/**
 * Medicare Part B standard monthly premium for 2025
 * Source: CMS.gov
 */
export const MEDICARE_PART_B_MONTHLY_PREMIUM = 174.70;

/**
 * Medicare Part B annual premium (Part B monthly * 12)
 */
export const MEDICARE_PART_B_ANNUAL_PREMIUM = MEDICARE_PART_B_MONTHLY_PREMIUM * 12;

/**
 * Medicare Part B annual deductible for 2025
 * Source: CMS.gov
 */
export const MEDICARE_PART_B_DEDUCTIBLE = 240;

// ============================================================================
// ESTIMATED ANNUAL MEDICAL COSTS
// ============================================================================

/**
 * Estimated annual medical costs by age group (conservative estimates)
 * These are baseline estimates used when user doesn't provide specific health info
 */
export const ESTIMATED_MEDICAL_COSTS_BY_AGE = {
  /** Young adults (< 30): Generally healthy, fewer medical needs */
  YOUNG_ADULT: 3000,

  /** Middle age (30-49): Some preventive care, occasional issues */
  MIDDLE_AGE: 5000,

  /** Older adults (50-64): More preventive care, chronic conditions more common */
  OLDER_ADULT: 8000,

  /** Medicare-eligible seniors (65+): Higher medical utilization */
  MEDICARE_ELIGIBLE: 12000,
} as const;

/**
 * Age thresholds for medical cost estimation
 */
export const MEDICAL_COST_AGE_THRESHOLDS = {
  YOUNG_ADULT_MAX: 30,
  MIDDLE_AGE_MAX: 50,
} as const;

// ============================================================================
// SUBSIDY & ELIGIBILITY THRESHOLDS
// ============================================================================

/**
 * Federal Poverty Level (FPL) percentage thresholds for subsidy eligibility
 */
export const FPL_THRESHOLDS = {
  /** Medicaid eligibility in expansion states (138% FPL) */
  MEDICAID_EXPANSION: 138,

  /** Medicaid eligibility in non-expansion states (100% FPL) */
  MEDICAID_NON_EXPANSION: 100,

  /** Maximum FPL percentage for Premium Tax Credit eligibility (400% FPL) */
  PTC_MAX: 400,

  /** Minimum FPL percentage for PTC in expansion states */
  PTC_MIN_EXPANSION: 138,

  /** Minimum FPL percentage for PTC in non-expansion states */
  PTC_MIN_NON_EXPANSION: 100,
} as const;

/**
 * Premium contribution percentages by FPL level
 * Based on ACA premium contribution tables
 */
export const PREMIUM_CONTRIBUTION_RATE = {
  /** Below 400% FPL: 8.5% of income */
  STANDARD: 0.085,
} as const;

// ============================================================================
// DEFAULT PREMIUM ESTIMATES
// ============================================================================

/**
 * Sample/default marketplace premium for calculations
 * Used when actual premium data is not available
 */
export const DEFAULT_MARKETPLACE_PREMIUM = 400;

/**
 * Default estimated savings values for recommendations
 */
export const ESTIMATED_SAVINGS = {
  /** Estimated annual savings from Medicaid eligibility */
  MEDICAID_ANNUAL: 5000,

  /** Threshold for significant reconciliation impact warnings */
  RECONCILIATION_THRESHOLD: 3000,

  /** Threshold for considering relocation due to significant cost differences */
  RELOCATION_THRESHOLD: 3000,

  /** Threshold for flagging significant cost variation across states */
  COST_VARIATION_THRESHOLD: 5000,

  /** Default estimated annual out-of-pocket costs when specific data unavailable */
  DEFAULT_ANNUAL_OOP: 5000,
} as const;

// ============================================================================
// INCOME RANGE MIDPOINTS
// ============================================================================

/**
 * Midpoint values for income ranges (used when exact income not provided)
 * These are conservative estimates for each bracket
 */
export const INCOME_RANGE_MIDPOINTS = {
  'under-30k': 25000,
  '30k-50k': 40000,
  '50k-75k': 62500,
  '75k-100k': 87500,
  '100k-150k': 125000,
  '150k-plus': 175000,
  'prefer-not-say': 75000, // Assume mid-range for calculations
} as const;

// Type for income range keys
export type IncomeRange = keyof typeof INCOME_RANGE_MIDPOINTS;

// ============================================================================
// CHRONIC CONDITION COST MULTIPLIERS
// ============================================================================

/**
 * Estimated annual costs for common chronic conditions
 */
export const CHRONIC_CONDITION_COSTS = {
  DIABETES: 8000,
  HEART_DISEASE: 12000,
  CANCER: 30000,
  ASTHMA: 2000,
  ARTHRITIS: 3000,
} as const;

/**
 * Multiplier for multiple chronic conditions
 * Not simply additive - there's some overlap in care
 */
export const MULTIPLE_CONDITIONS_MULTIPLIER = 0.85;

// ============================================================================
// MEDIGAP COST ESTIMATES
// ============================================================================

/**
 * Estimated out-of-pocket costs with Medigap coverage
 */
export const MEDIGAP_OOP_ESTIMATES = {
  /** High utilization scenario */
  HIGH_USAGE: 1000,

  /** Standard utilization scenario */
  STANDARD: 500,
} as const;

/**
 * Maximum out-of-pocket with Medigap for worst-case scenario
 */
export const MEDIGAP_MAX_OOP = 2000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get estimated annual medical cost based on age
 */
export function getEstimatedMedicalCostByAge(age: number): number {
  if (age < MEDICAL_COST_AGE_THRESHOLDS.YOUNG_ADULT_MAX) {
    return ESTIMATED_MEDICAL_COSTS_BY_AGE.YOUNG_ADULT;
  }
  if (age < MEDICAL_COST_AGE_THRESHOLDS.MIDDLE_AGE_MAX) {
    return ESTIMATED_MEDICAL_COSTS_BY_AGE.MIDDLE_AGE;
  }
  return ESTIMATED_MEDICAL_COSTS_BY_AGE.OLDER_ADULT;
}

/**
 * Get income midpoint for a given range
 */
export function getIncomeMidpoint(range: string): number {
  return INCOME_RANGE_MIDPOINTS[range as IncomeRange] ?? INCOME_RANGE_MIDPOINTS['prefer-not-say'];
}

/**
 * Check if income is within subsidy range for a given state
 */
export function isSubsidyEligible(fplPercentage: number, isMedicaidExpansionState: boolean): boolean {
  const minThreshold = isMedicaidExpansionState
    ? FPL_THRESHOLDS.PTC_MIN_EXPANSION
    : FPL_THRESHOLDS.PTC_MIN_NON_EXPANSION;

  return fplPercentage >= minThreshold && fplPercentage <= FPL_THRESHOLDS.PTC_MAX;
}
