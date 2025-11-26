/**
 * Multi-Year Cost Projections
 *
 * Projects healthcare costs from current age forward, accounting for:
 * - Healthcare inflation (medical costs and premiums)
 * - ACA age-rating curve changes
 * - Major life transitions (age 26, 65 Medicare)
 * - Confidence intervals based on historical variance
 */

import { getAgeRatingFactor, getStateBaseRate, METAL_TIER_MULTIPLIERS, type MetalTier } from '../age-rating';
import { ESTIMATED_MEDICAL_COSTS_BY_AGE } from '@/lib/medicalCostConstants';

// ============================================================================
// TYPES
// ============================================================================

export interface InflationFactors {
  /** Medical cost inflation rate (historical 5-6% annually) */
  medicalInflation: number;
  /** Premium inflation rate (historical 4-5% annually) */
  premiumInflation: number;
  /** General CPI inflation (for context) */
  generalCPI: number;
}

export interface MultiYearProjection {
  /** Year number (0 = current year) */
  year: number;
  /** Age at this year */
  age: number;
  /** Calendar year */
  calendarYear: number;
  /** Projected monthly premium */
  projectedMonthlyPremium: number;
  /** Projected annual premium */
  projectedAnnualPremium: number;
  /** Projected annual medical costs (out-of-pocket) */
  projectedMedicalCosts: number;
  /** Projected out-of-pocket max spending */
  projectedOOP: number;
  /** Total annual cost (premium + medical + OOP) */
  totalAnnualCost: number;
  /** Cumulative cost from year 0 to this year */
  cumulativeCost: number;
  /** Confidence interval for total cost */
  confidenceInterval: {
    p10: number; // 10th percentile (optimistic)
    p50: number; // 50th percentile (median)
    p90: number; // 90th percentile (pessimistic)
  };
  /** Age rating factor applied */
  ageRatingFactor: number;
  /** Inflation factor applied (compound from year 0) */
  inflationFactor: number;
  /** Whether this year has a major transition */
  transition?: AgeTransition;
}

export interface AgeTransition {
  type: 'age-26-off-parents' | 'medicare-eligible' | 'early-retirement';
  description: string;
  impact: string;
  recommendedAction: string;
}

export interface LifetimeProjection {
  /** Starting age */
  startAge: number;
  /** Ending age for projection */
  endAge: number;
  /** Primary state for cost calculations */
  primaryState: string;
  /** Metal tier used for projections */
  metalTier: MetalTier;
  /** Year-by-year projections */
  projections: MultiYearProjection[];
  /** Total lifetime cost (sum of all years) */
  totalLifetimeCost: number;
  /** Average annual cost */
  averageAnnualCost: number;
  /** Major transitions encountered */
  majorTransitions: AgeTransition[];
  /** Inflation assumptions used */
  inflationFactors: InflationFactors;
  /** Summary insights */
  insights: string[];
}

export interface ProjectionInput {
  /** Current age */
  currentAge: number;
  /** Number of years to project (default 5) */
  yearsToProject?: number;
  /** End age (alternative to yearsToProject, e.g., 65 for retirement) */
  endAge?: number;
  /** Primary state for cost calculations */
  state: string;
  /** Plan metal tier (default Silver) */
  metalTier?: MetalTier;
  /** Whether person uses tobacco */
  usesTobacco?: boolean;
  /** Custom inflation factors (optional) */
  inflationFactors?: Partial<InflationFactors>;
  /** Current monthly premium (if known, otherwise estimated) */
  currentMonthlyPremium?: number;
  /** Health status for medical cost estimation */
  healthStatus?: 'excellent' | 'good' | 'fair' | 'poor';
  /** Known chronic conditions affecting costs */
  chronicConditions?: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default inflation factors based on historical data */
export const DEFAULT_INFLATION_FACTORS: InflationFactors = {
  medicalInflation: 0.055, // 5.5% historical average
  premiumInflation: 0.045, // 4.5% historical average
  generalCPI: 0.030, // 3% general inflation
};

/** Historical variance for confidence intervals */
const COST_VARIANCE = {
  /** Standard deviation as percentage of mean (for confidence intervals) */
  standardDeviation: 0.25, // 25% std dev
  /** P10 multiplier (optimistic) */
  p10Multiplier: 0.70,
  /** P90 multiplier (pessimistic) */
  p90Multiplier: 1.45,
};

/** Health status multipliers for medical costs */
const HEALTH_STATUS_MULTIPLIERS: Record<string, number> = {
  excellent: 0.6,
  good: 1.0,
  fair: 1.5,
  poor: 2.5,
};

/** Chronic condition cost adders (annual) */
const CHRONIC_CONDITION_COSTS: Record<string, number> = {
  diabetes: 8000,
  'heart disease': 12000,
  hypertension: 3000,
  asthma: 2000,
  arthritis: 3000,
  copd: 6000,
  cancer: 30000,
  'kidney disease': 15000,
  depression: 2500,
  obesity: 3000,
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generate multi-year cost projections
 */
export function generateMultiYearProjection(input: ProjectionInput): LifetimeProjection {
  const {
    currentAge,
    yearsToProject = 5,
    endAge,
    state,
    metalTier = 'Silver',
    usesTobacco = false,
    inflationFactors = {},
    currentMonthlyPremium,
    healthStatus = 'good',
    chronicConditions = [],
  } = input;

  // Determine projection range
  const finalEndAge = endAge ?? currentAge + yearsToProject;
  const totalYears = finalEndAge - currentAge;

  // Merge inflation factors with defaults
  const finalInflation: InflationFactors = {
    ...DEFAULT_INFLATION_FACTORS,
    ...inflationFactors,
  };

  // Get base costs
  const basePremium = currentMonthlyPremium ?? calculateBasePremium(currentAge, state, metalTier, usesTobacco);
  const baseMedicalCost = calculateBaseMedicalCost(currentAge, healthStatus, chronicConditions);

  // Generate projections
  const projections: MultiYearProjection[] = [];
  const majorTransitions: AgeTransition[] = [];
  let cumulativeCost = 0;
  const currentYear = new Date().getFullYear();

  for (let year = 0; year <= totalYears; year++) {
    const age = currentAge + year;
    const calendarYear = currentYear + year;

    // Calculate inflation factors (compound)
    const premiumInflationFactor = Math.pow(1 + finalInflation.premiumInflation, year);
    const medicalInflationFactor = Math.pow(1 + finalInflation.medicalInflation, year);

    // Get age rating factor for this year
    const ageRatingFactor = getAgeRatingFactor(age);
    const baseAgeRatingFactor = getAgeRatingFactor(currentAge);

    // Calculate projected premium
    // Formula: base premium * (new age factor / current age factor) * inflation
    const ageAdjustmentRatio = ageRatingFactor / baseAgeRatingFactor;
    let projectedMonthlyPremium = basePremium * ageAdjustmentRatio * premiumInflationFactor;

    // Calculate projected medical costs
    let projectedMedicalCosts = baseMedicalCost * medicalInflationFactor;

    // Check for major transitions
    const transition = checkForTransition(age, currentAge);
    if (transition) {
      majorTransitions.push(transition);

      // Adjust costs based on transition
      if (transition.type === 'medicare-eligible') {
        // Medicare changes cost structure significantly
        projectedMonthlyPremium = calculateMedicarePremium(age, state) * premiumInflationFactor;
        projectedMedicalCosts = projectedMedicalCosts * 0.8; // Medicare covers more
      }
    }

    const projectedAnnualPremium = projectedMonthlyPremium * 12;

    // Estimate OOP based on health status and utilization
    const projectedOOP = calculateProjectedOOP(age, healthStatus, metalTier, medicalInflationFactor);

    // Total annual cost
    const totalAnnualCost = projectedAnnualPremium + projectedMedicalCosts + projectedOOP;
    cumulativeCost += totalAnnualCost;

    // Calculate confidence intervals
    const confidenceInterval = calculateConfidenceInterval(totalAnnualCost);

    projections.push({
      year,
      age,
      calendarYear,
      projectedMonthlyPremium: Math.round(projectedMonthlyPremium * 100) / 100,
      projectedAnnualPremium: Math.round(projectedAnnualPremium),
      projectedMedicalCosts: Math.round(projectedMedicalCosts),
      projectedOOP: Math.round(projectedOOP),
      totalAnnualCost: Math.round(totalAnnualCost),
      cumulativeCost: Math.round(cumulativeCost),
      confidenceInterval: {
        p10: Math.round(confidenceInterval.p10),
        p50: Math.round(confidenceInterval.p50),
        p90: Math.round(confidenceInterval.p90),
      },
      ageRatingFactor,
      inflationFactor: premiumInflationFactor,
      transition,
    });
  }

  // Generate insights
  const insights = generateInsights(projections, majorTransitions, finalInflation);

  return {
    startAge: currentAge,
    endAge: finalEndAge,
    primaryState: state,
    metalTier,
    projections,
    totalLifetimeCost: Math.round(cumulativeCost),
    averageAnnualCost: Math.round(cumulativeCost / (totalYears + 1)),
    majorTransitions,
    inflationFactors: finalInflation,
    insights,
  };
}

/**
 * Calculate base premium for an individual
 */
function calculateBasePremium(
  age: number,
  state: string,
  metalTier: MetalTier,
  usesTobacco: boolean
): number {
  const baseRate = getStateBaseRate(state);
  const ageFactor = getAgeRatingFactor(age);
  const tierMultiplier = METAL_TIER_MULTIPLIERS[metalTier];

  let premium = baseRate * ageFactor * tierMultiplier;

  // Apply tobacco surcharge (simplified - max 50%)
  if (usesTobacco && age >= 18) {
    premium *= 1.5;
  }

  return premium;
}

/**
 * Calculate base medical costs based on age and health status
 */
function calculateBaseMedicalCost(
  age: number,
  healthStatus: string,
  chronicConditions: string[]
): number {
  // Base cost by age
  let baseCost: number;
  if (age < 30) {
    baseCost = ESTIMATED_MEDICAL_COSTS_BY_AGE.YOUNG_ADULT;
  } else if (age < 50) {
    baseCost = ESTIMATED_MEDICAL_COSTS_BY_AGE.MIDDLE_AGE;
  } else if (age < 65) {
    baseCost = ESTIMATED_MEDICAL_COSTS_BY_AGE.OLDER_ADULT;
  } else {
    baseCost = ESTIMATED_MEDICAL_COSTS_BY_AGE.MEDICARE_ELIGIBLE;
  }

  // Apply health status multiplier
  const healthMultiplier = HEALTH_STATUS_MULTIPLIERS[healthStatus] ?? 1.0;
  baseCost *= healthMultiplier;

  // Add chronic condition costs
  for (const condition of chronicConditions) {
    const conditionCost = CHRONIC_CONDITION_COSTS[condition.toLowerCase()] ?? 0;
    baseCost += conditionCost;
  }

  return baseCost;
}

/**
 * Calculate Medicare premium estimate
 */
function calculateMedicarePremium(age: number, _state: string): number {
  // Part B standard premium (2025)
  const partBPremium = 174.70;

  // Part D average premium
  const partDPremium = 35;

  // Medigap Plan G average (varies by state and age)
  // Note: _state parameter reserved for future state-specific adjustments
  const medigapBase = 150;
  const ageAdjustment = Math.max(0, age - 65) * 5; // Increases with age

  return partBPremium + partDPremium + medigapBase + ageAdjustment;
}

/**
 * Calculate projected out-of-pocket costs
 */
function calculateProjectedOOP(
  age: number,
  healthStatus: string,
  metalTier: MetalTier,
  inflationFactor: number
): number {
  // Base OOP by metal tier (actuarial value)
  const baseOOPByTier: Record<MetalTier, number> = {
    Catastrophic: 5000,
    Bronze: 4000,
    Silver: 3000,
    Gold: 2000,
    Platinum: 1000,
  };

  let baseOOP = baseOOPByTier[metalTier];

  // Adjust for age (older = more utilization)
  if (age >= 50) {
    baseOOP *= 1.3;
  } else if (age >= 40) {
    baseOOP *= 1.1;
  }

  // Adjust for health status
  const healthMultiplier = HEALTH_STATUS_MULTIPLIERS[healthStatus] ?? 1.0;
  baseOOP *= healthMultiplier;

  // Apply inflation
  return baseOOP * inflationFactor;
}

/**
 * Check for major age transitions
 */
function checkForTransition(age: number, startAge: number): AgeTransition | undefined {
  // Age 26 - off parent's insurance
  if (age === 26 && startAge < 26) {
    return {
      type: 'age-26-off-parents',
      description: 'No longer eligible for parent\'s health insurance at age 26',
      impact: 'Must obtain own coverage through employer, marketplace, or other source',
      recommendedAction: 'Research marketplace options 2-3 months before 26th birthday',
    };
  }

  // Age 65 - Medicare eligible
  if (age === 65 && startAge < 65) {
    return {
      type: 'medicare-eligible',
      description: 'Eligible for Medicare at age 65',
      impact: 'Transition from marketplace/employer to Medicare coverage',
      recommendedAction: 'Begin Medicare enrollment 3 months before 65th birthday',
    };
  }

  return undefined;
}

/**
 * Calculate confidence intervals for cost projections
 */
function calculateConfidenceInterval(baseCost: number): { p10: number; p50: number; p90: number } {
  return {
    p10: baseCost * COST_VARIANCE.p10Multiplier,
    p50: baseCost, // Median = expected value
    p90: baseCost * COST_VARIANCE.p90Multiplier,
  };
}

/**
 * Generate insights from projections
 */
function generateInsights(
  projections: MultiYearProjection[],
  transitions: AgeTransition[],
  inflation: InflationFactors
): string[] {
  const insights: string[] = [];

  if (projections.length < 2) {
    return insights;
  }

  const first = projections[0];
  const last = projections[projections.length - 1];

  if (!first || !last) {
    return insights;
  }

  // Cost increase insight
  const totalIncrease = last.totalAnnualCost - first.totalAnnualCost;
  const percentIncrease = (totalIncrease / first.totalAnnualCost) * 100;
  if (percentIncrease > 0) {
    insights.push(
      `Healthcare costs are projected to increase by ${percentIncrease.toFixed(0)}% over ${projections.length - 1} years (from $${first.totalAnnualCost.toLocaleString()} to $${last.totalAnnualCost.toLocaleString()} annually)`
    );
  }

  // Cumulative cost insight
  insights.push(
    `Total projected healthcare spending: $${last.cumulativeCost.toLocaleString()} over ${projections.length} years`
  );

  // Medicare transition insight
  const medicareTransition = transitions.find(t => t.type === 'medicare-eligible');
  if (medicareTransition) {
    insights.push(
      'Medicare eligibility at age 65 typically reduces monthly costs but requires careful planning for enrollment deadlines'
    );
  }

  // Age rating insight
  const ageRatingIncrease = last.ageRatingFactor - first.ageRatingFactor;
  if (ageRatingIncrease > 0.3) {
    insights.push(
      `Age-based premium rating will increase premiums by ${((ageRatingIncrease / first.ageRatingFactor) * 100).toFixed(0)}% due to ACA age curve`
    );
  }

  // Inflation impact
  const inflationImpact = (Math.pow(1 + inflation.premiumInflation, projections.length - 1) - 1) * 100;
  insights.push(
    `Healthcare inflation (${(inflation.premiumInflation * 100).toFixed(1)}% annually) adds approximately ${inflationImpact.toFixed(0)}% to costs over the projection period`
  );

  return insights;
}

// ============================================================================
// QUICK PROJECTION HELPERS
// ============================================================================

/**
 * Generate a quick 5-year projection with defaults
 */
export function quickFiveYearProjection(
  currentAge: number,
  state: string,
  metalTier: MetalTier = 'Silver'
): LifetimeProjection {
  return generateMultiYearProjection({
    currentAge,
    yearsToProject: 5,
    state,
    metalTier,
  });
}

/**
 * Generate projection from current age to Medicare eligibility
 */
export function projectToMedicare(
  currentAge: number,
  state: string,
  metalTier: MetalTier = 'Silver'
): LifetimeProjection {
  if (currentAge >= 65) {
    return generateMultiYearProjection({
      currentAge,
      yearsToProject: 10,
      state,
      metalTier,
    });
  }

  return generateMultiYearProjection({
    currentAge,
    endAge: 65,
    state,
    metalTier,
  });
}

/**
 * Calculate break-even point between two scenarios
 */
export function calculateYearlyBreakdown(projection: LifetimeProjection): {
  year: number;
  premium: number;
  medical: number;
  oop: number;
  total: number;
}[] {
  return projection.projections.map(p => ({
    year: p.calendarYear,
    premium: p.projectedAnnualPremium,
    medical: p.projectedMedicalCosts,
    oop: p.projectedOOP,
    total: p.totalAnnualCost,
  }));
}
