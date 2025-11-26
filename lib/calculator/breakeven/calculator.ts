/**
 * Break-Even Calculator Module
 *
 * Calculates the break-even point between two insurance plans
 * to help users understand when one plan becomes more cost-effective.
 */

// Types
export interface PlanDetails {
  /** Plan name */
  name: string;
  /** Monthly premium */
  monthlyPremium: number;
  /** Annual deductible */
  deductible: number;
  /** Coinsurance rate after deductible (e.g., 0.2 for 20%) */
  coinsurance: number;
  /** Out-of-pocket maximum */
  outOfPocketMax: number;
  /** Plan metal tier (optional) */
  metalTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'HDHP';
}

export interface CostAtUtilization {
  /** Medical expense level */
  medicalExpense: number;
  /** Total annual cost for plan 1 (premium + OOP) */
  plan1TotalCost: number;
  /** Total annual cost for plan 2 (premium + OOP) */
  plan2TotalCost: number;
  /** Which plan is cheaper at this level */
  cheaperPlan: '1' | '2' | 'equal';
  /** Savings amount (positive if plan 1 cheaper) */
  savingsWithPlan1: number;
}

export interface BreakEvenResult {
  /** Plans being compared */
  plan1: PlanDetails;
  plan2: PlanDetails;
  /** Break-even medical expense (null if no crossover) */
  breakEvenPoint: number | null;
  /** Which plan is better below break-even */
  betterPlanBelowBreakeven: '1' | '2' | 'always-1' | 'always-2';
  /** Which plan is better above break-even */
  betterPlanAboveBreakeven: '1' | '2' | 'always-1' | 'always-2';
  /** Cost at various utilization levels */
  costCurve: CostAtUtilization[];
  /** Analysis summary */
  analysis: BreakEvenAnalysis;
}

export interface BreakEvenAnalysis {
  /** Summary statement */
  summary: string;
  /** Which plan is generally recommended */
  recommendedPlan: '1' | '2';
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';
  /** Key insights */
  insights: string[];
  /** Scenarios where each plan excels */
  planStrengths: {
    plan1: string[];
    plan2: string[];
  };
}

/**
 * Calculate total annual cost for a plan at a given medical expense level
 */
export function calculateAnnualCost(
  plan: PlanDetails,
  medicalExpense: number
): number {
  const annualPremium = plan.monthlyPremium * 12;

  // Calculate out-of-pocket cost
  let outOfPocket = 0;

  if (medicalExpense <= plan.deductible) {
    // All expenses below deductible
    outOfPocket = medicalExpense;
  } else {
    // Deductible + coinsurance on remainder
    outOfPocket = plan.deductible;
    const afterDeductible = medicalExpense - plan.deductible;
    outOfPocket += afterDeductible * plan.coinsurance;
  }

  // Cap at out-of-pocket max
  outOfPocket = Math.min(outOfPocket, plan.outOfPocketMax);

  return annualPremium + outOfPocket;
}

/**
 * Find break-even point between two plans
 * Searches across multiple points to find crossovers
 */
export function findBreakEvenPoint(
  plan1: PlanDetails,
  plan2: PlanDetails,
  precision: number = 100
): number | null {
  // Sample many points to find crossover
  const maxExpense = Math.max(plan1.outOfPocketMax, plan2.outOfPocketMax) * 2;
  const numSamples = 50;

  let previousDiff: number | null = null;
  let crossoverLow = 0;
  let crossoverFound = false;

  for (let i = 0; i <= numSamples; i++) {
    const expense = (maxExpense * i) / numSamples;
    const cost1 = calculateAnnualCost(plan1, expense);
    const cost2 = calculateAnnualCost(plan2, expense);
    const diff = cost1 - cost2;

    // Check for sign change (crossover)
    if (previousDiff !== null && previousDiff * diff < 0) {
      crossoverLow = (maxExpense * (i - 1)) / numSamples;
      crossoverFound = true;
      break;
    }

    previousDiff = diff;
  }

  if (!crossoverFound) {
    return null;
  }

  // Binary search for precise break-even point
  let low = crossoverLow;
  let high = crossoverLow + maxExpense / numSamples;

  const cost1AtLow = calculateAnnualCost(plan1, low);
  const cost2AtLow = calculateAnnualCost(plan2, low);
  const diffAtLow = cost1AtLow - cost2AtLow;

  while (high - low > precision) {
    const mid = (low + high) / 2;
    const cost1Mid = calculateAnnualCost(plan1, mid);
    const cost2Mid = calculateAnnualCost(plan2, mid);
    const diffMid = cost1Mid - cost2Mid;

    if (diffMid * diffAtLow > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.round((low + high) / 2);
}

/**
 * Generate cost curve for visualization
 */
export function generateCostCurve(
  plan1: PlanDetails,
  plan2: PlanDetails,
  numPoints: number = 10
): CostAtUtilization[] {
  const maxExpense = Math.max(plan1.outOfPocketMax, plan2.outOfPocketMax) * 2;
  const curve: CostAtUtilization[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const expense = Math.round((maxExpense * i) / numPoints);
    const cost1 = calculateAnnualCost(plan1, expense);
    const cost2 = calculateAnnualCost(plan2, expense);

    curve.push({
      medicalExpense: expense,
      plan1TotalCost: Math.round(cost1),
      plan2TotalCost: Math.round(cost2),
      cheaperPlan: cost1 < cost2 ? '1' : cost1 > cost2 ? '2' : 'equal',
      savingsWithPlan1: Math.round(cost2 - cost1),
    });
  }

  return curve;
}

/**
 * Analyze break-even results and generate insights
 */
export function analyzeBreakEven(
  plan1: PlanDetails,
  plan2: PlanDetails,
  breakEvenPoint: number | null,
  costCurve: CostAtUtilization[]
): BreakEvenAnalysis {
  const insights: string[] = [];
  const plan1Strengths: string[] = [];
  const plan2Strengths: string[] = [];

  // Premium comparison
  const premiumDiff = plan1.monthlyPremium - plan2.monthlyPremium;
  if (Math.abs(premiumDiff) > 50) {
    if (premiumDiff < 0) {
      insights.push(`${plan1.name} saves $${Math.abs(premiumDiff)}/month on premiums`);
      plan1Strengths.push('Lower monthly premium');
    } else {
      insights.push(`${plan2.name} saves $${Math.abs(premiumDiff)}/month on premiums`);
      plan2Strengths.push('Lower monthly premium');
    }
  }

  // Deductible comparison
  if (plan1.deductible < plan2.deductible) {
    plan1Strengths.push('Lower deductible');
    insights.push(`${plan1.name} has a $${plan2.deductible - plan1.deductible} lower deductible`);
  } else if (plan2.deductible < plan1.deductible) {
    plan2Strengths.push('Lower deductible');
    insights.push(`${plan2.name} has a $${plan1.deductible - plan2.deductible} lower deductible`);
  }

  // OOP max comparison
  if (plan1.outOfPocketMax < plan2.outOfPocketMax) {
    plan1Strengths.push('Lower out-of-pocket maximum');
  } else if (plan2.outOfPocketMax < plan1.outOfPocketMax) {
    plan2Strengths.push('Lower out-of-pocket maximum');
  }

  // Break-even insights
  let summary: string;
  let recommendedPlan: '1' | '2';
  let confidence: 'high' | 'medium' | 'low';

  // Get first point with fallback
  const firstPoint = costCurve[0] ?? { cheaperPlan: '1' as const, plan1TotalCost: 0, plan2TotalCost: 0, medicalExpense: 0, savingsWithPlan1: 0 };

  if (breakEvenPoint === null) {
    // No crossover - one plan always better
    if (firstPoint.cheaperPlan === '1') {
      summary = `${plan1.name} is always more cost-effective regardless of healthcare utilization.`;
      recommendedPlan = '1';
      confidence = 'high';
    } else {
      summary = `${plan2.name} is always more cost-effective regardless of healthcare utilization.`;
      recommendedPlan = '2';
      confidence = 'high';
    }
  } else {
    // There's a break-even point
    const lowUtilPlan = firstPoint.cheaperPlan === '1' ? plan1.name : plan2.name;
    const highUtilPlan = firstPoint.cheaperPlan === '1' ? plan2.name : plan1.name;

    summary = `Break-even at $${breakEvenPoint.toLocaleString()}/year in medical expenses. ` +
      `${lowUtilPlan} is better for low utilization, ${highUtilPlan} is better for high utilization.`;

    insights.push(`Below $${breakEvenPoint.toLocaleString()}/year: Choose ${lowUtilPlan}`);
    insights.push(`Above $${breakEvenPoint.toLocaleString()}/year: Choose ${highUtilPlan}`);

    // Recommend based on typical healthcare spending
    const typicalSpending = 5000; // Average healthcare spending
    if (breakEvenPoint > typicalSpending) {
      recommendedPlan = firstPoint.cheaperPlan === '1' ? '1' : '2';
      insights.push('Based on average healthcare spending, the lower-premium plan may be better');
      confidence = 'medium';
    } else {
      recommendedPlan = firstPoint.cheaperPlan === '1' ? '2' : '1';
      insights.push('Based on average healthcare spending, the higher-coverage plan may be better');
      confidence = 'medium';
    }
  }

  // Add HSA eligibility note
  if (plan1.metalTier === 'HDHP' || (plan1.deductible >= 1600 && plan1.outOfPocketMax <= 8050)) {
    plan1Strengths.push('HSA eligible (tax advantages)');
  }
  if (plan2.metalTier === 'HDHP' || (plan2.deductible >= 1600 && plan2.outOfPocketMax <= 8050)) {
    plan2Strengths.push('HSA eligible (tax advantages)');
  }

  return {
    summary,
    recommendedPlan,
    confidence,
    insights,
    planStrengths: {
      plan1: plan1Strengths,
      plan2: plan2Strengths,
    },
  };
}

/**
 * Main break-even comparison function
 */
export function compareBreakEven(
  plan1: PlanDetails,
  plan2: PlanDetails
): BreakEvenResult {
  // Find break-even point
  const breakEvenPoint = findBreakEvenPoint(plan1, plan2);

  // Generate cost curve
  const costCurve = generateCostCurve(plan1, plan2);

  // Analyze results
  const analysis = analyzeBreakEven(plan1, plan2, breakEvenPoint, costCurve);

  // Determine which plan is better in each region
  const curveFirstPoint = costCurve[0] ?? { cheaperPlan: '1' as const };
  let betterPlanBelowBreakeven: '1' | '2' | 'always-1' | 'always-2';
  let betterPlanAboveBreakeven: '1' | '2' | 'always-1' | 'always-2';

  if (breakEvenPoint === null) {
    const winner = curveFirstPoint.cheaperPlan === '1' ? 'always-1' : 'always-2';
    betterPlanBelowBreakeven = winner;
    betterPlanAboveBreakeven = winner;
  } else {
    betterPlanBelowBreakeven = curveFirstPoint.cheaperPlan === 'equal' ? '1' : curveFirstPoint.cheaperPlan;
    betterPlanAboveBreakeven = curveFirstPoint.cheaperPlan === '1' ? '2' : '1';
  }

  return {
    plan1,
    plan2,
    breakEvenPoint,
    betterPlanBelowBreakeven,
    betterPlanAboveBreakeven,
    costCurve,
    analysis,
  };
}

/**
 * Create plan details from common plan types
 */
export function createPlanFromTier(
  name: string,
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'HDHP',
  monthlyPremium: number
): PlanDetails {
  type TierType = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'HDHP';
  const tierDefaults: Record<TierType, Omit<PlanDetails, 'name' | 'monthlyPremium'>> = {
    Bronze: { deductible: 7000, coinsurance: 0.4, outOfPocketMax: 9450, metalTier: 'Bronze' },
    Silver: { deductible: 5000, coinsurance: 0.3, outOfPocketMax: 9450, metalTier: 'Silver' },
    Gold: { deductible: 1500, coinsurance: 0.2, outOfPocketMax: 8700, metalTier: 'Gold' },
    Platinum: { deductible: 500, coinsurance: 0.1, outOfPocketMax: 4000, metalTier: 'Platinum' },
    HDHP: { deductible: 3200, coinsurance: 0.2, outOfPocketMax: 8050, metalTier: 'HDHP' },
  };

  return {
    name,
    monthlyPremium,
    ...tierDefaults[tier],
  };
}

/**
 * Quick comparison of common plan tier matchups
 */
export function quickCompare(
  tier1: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'HDHP',
  premium1: number,
  tier2: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'HDHP',
  premium2: number
): BreakEvenResult {
  const plan1 = createPlanFromTier(`${tier1} Plan`, tier1, premium1);
  const plan2 = createPlanFromTier(`${tier2} Plan`, tier2, premium2);

  return compareBreakEven(plan1, plan2);
}
