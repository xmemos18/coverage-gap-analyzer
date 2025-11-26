/**
 * Plan Comparison Engine
 *
 * Provides detailed side-by-side comparison of two insurance plans
 * including costs, coverage, network, and overall value assessment.
 */

// Types
export interface PlanDetails {
  /** Plan identifier */
  id: string;
  /** Plan name */
  name: string;
  /** Plan type (e.g., HMO, PPO, EPO) */
  type: 'HMO' | 'PPO' | 'EPO' | 'POS' | 'HDHP';
  /** Metal level */
  metalLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'catastrophic';
  /** Insurance carrier */
  issuer: string;
  /** Monthly premium before subsidy */
  monthlyPremium: number;
  /** Monthly premium after subsidy */
  monthlyPremiumAfterSubsidy?: number;
  /** Annual deductible (individual) */
  deductible: number;
  /** Family deductible */
  familyDeductible?: number;
  /** Out-of-pocket maximum (individual) */
  outOfPocketMax: number;
  /** Family out-of-pocket maximum */
  familyOutOfPocketMax?: number;
  /** Primary care copay */
  primaryCareCopay?: number;
  /** Specialist copay */
  specialistCopay?: number;
  /** Generic drug copay */
  genericDrugCopay?: number;
  /** Brand drug copay */
  brandDrugCopay?: number;
  /** Emergency room copay */
  emergencyRoomCopay?: number;
  /** Urgent care copay */
  urgentCareCopay?: number;
  /** Coinsurance percentage (0-100) */
  coinsurance?: number;
  /** Has HSA eligibility */
  hsaEligible?: boolean;
  /** Network size (estimated providers) */
  networkSize?: number;
  /** Has national network */
  hasNationalNetwork?: boolean;
  /** Quality rating (1-5 stars) */
  qualityRating?: number;
  /** Prescription coverage tier structure */
  prescriptionTiers?: {
    tier1: number;
    tier2: number;
    tier3: number;
    tier4?: number;
  };
  /** Additional benefits */
  additionalBenefits?: string[];
}

export interface UserHealthProfile {
  /** Expected doctor visits per year */
  expectedDoctorVisits: number;
  /** Expected specialist visits per year */
  expectedSpecialistVisits: number;
  /** Expected prescriptions per month */
  expectedPrescriptions: number;
  /** Average prescription cost tier (1-4) */
  avgPrescriptionTier: number;
  /** Expected ER visits per year */
  expectedERVisits: number;
  /** Has planned procedures */
  hasPlannedProcedures: boolean;
  /** Estimated procedure cost if applicable */
  plannedProcedureCost?: number;
  /** Risk tolerance level */
  riskTolerance: 'low' | 'medium' | 'high';
  /** Prioritizes lower premium */
  prioritizesLowerPremium: boolean;
  /** Needs specific providers */
  needsSpecificProviders: boolean;
  /** Has chronic conditions */
  hasChronicConditions: boolean;
}

export interface ComparisonMetric {
  /** Metric name */
  name: string;
  /** Metric category */
  category: 'cost' | 'coverage' | 'network' | 'value';
  /** Plan A value (formatted string) */
  planAValue: string;
  /** Plan B value (formatted string) */
  planBValue: string;
  /** Plan A raw value (for calculations) */
  planARaw?: number;
  /** Plan B raw value */
  planBRaw?: number;
  /** Which plan is better for this metric */
  winner: 'A' | 'B' | 'tie';
  /** Difference explanation */
  difference?: string;
  /** Importance weight (1-5) */
  importance: number;
  /** Tooltip explanation */
  tooltip?: string;
}

export interface CostScenario {
  /** Scenario name */
  name: string;
  /** Scenario description */
  description: string;
  /** Plan A total annual cost */
  planACost: number;
  /** Plan B total annual cost */
  planBCost: number;
  /** Cost difference (positive = A costs more) */
  difference: number;
  /** Winner */
  winner: 'A' | 'B' | 'tie';
  /** Breakdown */
  breakdown: {
    premiums: { planA: number; planB: number };
    outOfPocket: { planA: number; planB: number };
  };
}

export interface PlanComparisonResult {
  /** Plan A details */
  planA: PlanDetails;
  /** Plan B details */
  planB: PlanDetails;
  /** Comparison metrics */
  metrics: ComparisonMetric[];
  /** Cost scenarios */
  scenarios: CostScenario[];
  /** Overall winner */
  overallWinner: {
    plan: 'A' | 'B' | 'tie';
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  };
  /** Recommendation based on user profile */
  recommendation: {
    recommendedPlan: 'A' | 'B';
    reasons: string[];
    caveats: string[];
  };
  /** Key differences */
  keyDifferences: string[];
  /** Summary */
  summary: string;
}

/**
 * Compare two insurance plans
 */
export function comparePlans(
  planA: PlanDetails,
  planB: PlanDetails,
  userProfile?: UserHealthProfile
): PlanComparisonResult {
  // Generate comparison metrics
  const metrics = generateMetrics(planA, planB);

  // Calculate cost scenarios
  const scenarios = calculateScenarios(planA, planB, userProfile);

  // Determine overall winner
  const overallWinner = determineOverallWinner(metrics, scenarios, userProfile);

  // Generate recommendation
  const recommendation = generateRecommendation(planA, planB, metrics, scenarios, userProfile);

  // Identify key differences
  const keyDifferences = identifyKeyDifferences(planA, planB, metrics);

  // Generate summary
  const summary = generateSummary(planA, planB, overallWinner, recommendation);

  return {
    planA,
    planB,
    metrics,
    scenarios,
    overallWinner,
    recommendation,
    keyDifferences,
    summary,
  };
}

/**
 * Generate comparison metrics
 */
function generateMetrics(planA: PlanDetails, planB: PlanDetails): ComparisonMetric[] {
  const metrics: ComparisonMetric[] = [];

  // Cost metrics
  metrics.push({
    name: 'Monthly Premium',
    category: 'cost',
    planAValue: formatCurrency(planA.monthlyPremium),
    planBValue: formatCurrency(planB.monthlyPremium),
    planARaw: planA.monthlyPremium,
    planBRaw: planB.monthlyPremium,
    winner: determineWinner(planA.monthlyPremium, planB.monthlyPremium, 'lower'),
    difference: formatDifference(planA.monthlyPremium, planB.monthlyPremium, '/month'),
    importance: 5,
    tooltip: 'The amount you pay each month regardless of healthcare usage',
  });

  if (planA.monthlyPremiumAfterSubsidy !== undefined || planB.monthlyPremiumAfterSubsidy !== undefined) {
    metrics.push({
      name: 'Premium After Subsidy',
      category: 'cost',
      planAValue: formatCurrency(planA.monthlyPremiumAfterSubsidy ?? planA.monthlyPremium),
      planBValue: formatCurrency(planB.monthlyPremiumAfterSubsidy ?? planB.monthlyPremium),
      planARaw: planA.monthlyPremiumAfterSubsidy ?? planA.monthlyPremium,
      planBRaw: planB.monthlyPremiumAfterSubsidy ?? planB.monthlyPremium,
      winner: determineWinner(
        planA.monthlyPremiumAfterSubsidy ?? planA.monthlyPremium,
        planB.monthlyPremiumAfterSubsidy ?? planB.monthlyPremium,
        'lower'
      ),
      importance: 5,
      tooltip: 'Your actual monthly cost after premium tax credits',
    });
  }

  metrics.push({
    name: 'Annual Premium',
    category: 'cost',
    planAValue: formatCurrency(planA.monthlyPremium * 12),
    planBValue: formatCurrency(planB.monthlyPremium * 12),
    planARaw: planA.monthlyPremium * 12,
    planBRaw: planB.monthlyPremium * 12,
    winner: determineWinner(planA.monthlyPremium, planB.monthlyPremium, 'lower'),
    difference: formatDifference(planA.monthlyPremium * 12, planB.monthlyPremium * 12, '/year'),
    importance: 4,
  });

  metrics.push({
    name: 'Deductible',
    category: 'cost',
    planAValue: formatCurrency(planA.deductible),
    planBValue: formatCurrency(planB.deductible),
    planARaw: planA.deductible,
    planBRaw: planB.deductible,
    winner: determineWinner(planA.deductible, planB.deductible, 'lower'),
    difference: formatDifference(planA.deductible, planB.deductible),
    importance: 4,
    tooltip: 'Amount you pay before insurance kicks in',
  });

  metrics.push({
    name: 'Out-of-Pocket Maximum',
    category: 'cost',
    planAValue: formatCurrency(planA.outOfPocketMax),
    planBValue: formatCurrency(planB.outOfPocketMax),
    planARaw: planA.outOfPocketMax,
    planBRaw: planB.outOfPocketMax,
    winner: determineWinner(planA.outOfPocketMax, planB.outOfPocketMax, 'lower'),
    difference: formatDifference(planA.outOfPocketMax, planB.outOfPocketMax),
    importance: 4,
    tooltip: 'Maximum amount you pay in a year; insurance covers 100% after this',
  });

  // Coverage metrics
  if (planA.primaryCareCopay !== undefined || planB.primaryCareCopay !== undefined) {
    metrics.push({
      name: 'Primary Care Copay',
      category: 'coverage',
      planAValue: planA.primaryCareCopay !== undefined ? formatCurrency(planA.primaryCareCopay) : 'N/A',
      planBValue: planB.primaryCareCopay !== undefined ? formatCurrency(planB.primaryCareCopay) : 'N/A',
      planARaw: planA.primaryCareCopay,
      planBRaw: planB.primaryCareCopay,
      winner: determineWinner(planA.primaryCareCopay ?? 0, planB.primaryCareCopay ?? 0, 'lower'),
      importance: 3,
    });
  }

  if (planA.specialistCopay !== undefined || planB.specialistCopay !== undefined) {
    metrics.push({
      name: 'Specialist Copay',
      category: 'coverage',
      planAValue: planA.specialistCopay !== undefined ? formatCurrency(planA.specialistCopay) : 'N/A',
      planBValue: planB.specialistCopay !== undefined ? formatCurrency(planB.specialistCopay) : 'N/A',
      planARaw: planA.specialistCopay,
      planBRaw: planB.specialistCopay,
      winner: determineWinner(planA.specialistCopay ?? 0, planB.specialistCopay ?? 0, 'lower'),
      importance: 3,
    });
  }

  if (planA.genericDrugCopay !== undefined || planB.genericDrugCopay !== undefined) {
    metrics.push({
      name: 'Generic Drug Copay',
      category: 'coverage',
      planAValue: planA.genericDrugCopay !== undefined ? formatCurrency(planA.genericDrugCopay) : 'N/A',
      planBValue: planB.genericDrugCopay !== undefined ? formatCurrency(planB.genericDrugCopay) : 'N/A',
      planARaw: planA.genericDrugCopay,
      planBRaw: planB.genericDrugCopay,
      winner: determineWinner(planA.genericDrugCopay ?? 0, planB.genericDrugCopay ?? 0, 'lower'),
      importance: 3,
    });
  }

  if (planA.coinsurance !== undefined || planB.coinsurance !== undefined) {
    metrics.push({
      name: 'Coinsurance',
      category: 'coverage',
      planAValue: planA.coinsurance !== undefined ? `${planA.coinsurance}%` : 'N/A',
      planBValue: planB.coinsurance !== undefined ? `${planB.coinsurance}%` : 'N/A',
      planARaw: planA.coinsurance,
      planBRaw: planB.coinsurance,
      winner: determineWinner(planA.coinsurance ?? 0, planB.coinsurance ?? 0, 'lower'),
      importance: 3,
      tooltip: 'Percentage you pay for covered services after deductible',
    });
  }

  // Network metrics
  metrics.push({
    name: 'Plan Type',
    category: 'network',
    planAValue: planA.type,
    planBValue: planB.type,
    winner: 'tie',
    importance: 3,
    tooltip: 'HMO: More restrictive network, lower cost. PPO: Flexible network, higher cost.',
  });

  if (planA.hasNationalNetwork !== undefined || planB.hasNationalNetwork !== undefined) {
    metrics.push({
      name: 'National Network',
      category: 'network',
      planAValue: planA.hasNationalNetwork ? 'Yes' : 'No',
      planBValue: planB.hasNationalNetwork ? 'Yes' : 'No',
      winner: planA.hasNationalNetwork === planB.hasNationalNetwork ? 'tie' :
        planA.hasNationalNetwork ? 'A' : 'B',
      importance: 2,
    });
  }

  // Value metrics
  if (planA.qualityRating !== undefined || planB.qualityRating !== undefined) {
    metrics.push({
      name: 'Quality Rating',
      category: 'value',
      planAValue: planA.qualityRating !== undefined ? `${planA.qualityRating} stars` : 'N/A',
      planBValue: planB.qualityRating !== undefined ? `${planB.qualityRating} stars` : 'N/A',
      planARaw: planA.qualityRating,
      planBRaw: planB.qualityRating,
      winner: determineWinner(planA.qualityRating ?? 0, planB.qualityRating ?? 0, 'higher'),
      importance: 3,
    });
  }

  if (planA.hsaEligible !== undefined || planB.hsaEligible !== undefined) {
    metrics.push({
      name: 'HSA Eligible',
      category: 'value',
      planAValue: planA.hsaEligible ? 'Yes' : 'No',
      planBValue: planB.hsaEligible ? 'Yes' : 'No',
      winner: planA.hsaEligible === planB.hsaEligible ? 'tie' :
        planA.hsaEligible ? 'A' : 'B',
      importance: 3,
      tooltip: 'HSA-eligible plans allow tax-advantaged savings for medical expenses',
    });
  }

  return metrics;
}

/**
 * Calculate cost scenarios
 */
function calculateScenarios(
  planA: PlanDetails,
  planB: PlanDetails,
  userProfile?: UserHealthProfile
): CostScenario[] {
  const scenarios: CostScenario[] = [];
  const annualPremiumA = (planA.monthlyPremiumAfterSubsidy ?? planA.monthlyPremium) * 12;
  const annualPremiumB = (planB.monthlyPremiumAfterSubsidy ?? planB.monthlyPremium) * 12;

  // Scenario 1: Healthy year (minimal usage)
  const healthyOOPA = calculateOOP(planA, 2, 0, 3, 0, 0);
  const healthyOOPB = calculateOOP(planB, 2, 0, 3, 0, 0);
  scenarios.push({
    name: 'Healthy Year',
    description: '2 doctor visits, 3 prescriptions, no major medical events',
    planACost: annualPremiumA + healthyOOPA,
    planBCost: annualPremiumB + healthyOOPB,
    difference: (annualPremiumA + healthyOOPA) - (annualPremiumB + healthyOOPB),
    winner: determineWinner(annualPremiumA + healthyOOPA, annualPremiumB + healthyOOPB, 'lower'),
    breakdown: {
      premiums: { planA: annualPremiumA, planB: annualPremiumB },
      outOfPocket: { planA: healthyOOPA, planB: healthyOOPB },
    },
  });

  // Scenario 2: Moderate usage
  const moderateOOPA = calculateOOP(planA, 6, 2, 12, 0, 0);
  const moderateOOPB = calculateOOP(planB, 6, 2, 12, 0, 0);
  scenarios.push({
    name: 'Moderate Usage',
    description: '6 doctor visits, 2 specialist visits, 12 prescriptions',
    planACost: annualPremiumA + moderateOOPA,
    planBCost: annualPremiumB + moderateOOPB,
    difference: (annualPremiumA + moderateOOPA) - (annualPremiumB + moderateOOPB),
    winner: determineWinner(annualPremiumA + moderateOOPA, annualPremiumB + moderateOOPB, 'lower'),
    breakdown: {
      premiums: { planA: annualPremiumA, planB: annualPremiumB },
      outOfPocket: { planA: moderateOOPA, planB: moderateOOPB },
    },
  });

  // Scenario 3: High usage (chronic condition)
  const highOOPA = calculateOOP(planA, 12, 6, 36, 1, 0);
  const highOOPB = calculateOOP(planB, 12, 6, 36, 1, 0);
  scenarios.push({
    name: 'Chronic Condition',
    description: '12 doctor visits, 6 specialist visits, monthly prescriptions, 1 ER visit',
    planACost: annualPremiumA + highOOPA,
    planBCost: annualPremiumB + highOOPB,
    difference: (annualPremiumA + highOOPA) - (annualPremiumB + highOOPB),
    winner: determineWinner(annualPremiumA + highOOPA, annualPremiumB + highOOPB, 'lower'),
    breakdown: {
      premiums: { planA: annualPremiumA, planB: annualPremiumB },
      outOfPocket: { planA: highOOPA, planB: highOOPB },
    },
  });

  // Scenario 4: Major medical event
  const majorOOPA = Math.min(planA.outOfPocketMax, planA.deductible + 10000);
  const majorOOPB = Math.min(planB.outOfPocketMax, planB.deductible + 10000);
  scenarios.push({
    name: 'Major Medical Event',
    description: 'Surgery, hospitalization, or serious illness ($50,000+ in charges)',
    planACost: annualPremiumA + majorOOPA,
    planBCost: annualPremiumB + majorOOPB,
    difference: (annualPremiumA + majorOOPA) - (annualPremiumB + majorOOPB),
    winner: determineWinner(annualPremiumA + majorOOPA, annualPremiumB + majorOOPB, 'lower'),
    breakdown: {
      premiums: { planA: annualPremiumA, planB: annualPremiumB },
      outOfPocket: { planA: majorOOPA, planB: majorOOPB },
    },
  });

  // Scenario 5: User's expected usage (if profile provided)
  if (userProfile) {
    const userOOPA = calculateOOP(
      planA,
      userProfile.expectedDoctorVisits,
      userProfile.expectedSpecialistVisits,
      userProfile.expectedPrescriptions * 12,
      userProfile.expectedERVisits,
      userProfile.hasPlannedProcedures ? (userProfile.plannedProcedureCost || 5000) : 0
    );
    const userOOPB = calculateOOP(
      planB,
      userProfile.expectedDoctorVisits,
      userProfile.expectedSpecialistVisits,
      userProfile.expectedPrescriptions * 12,
      userProfile.expectedERVisits,
      userProfile.hasPlannedProcedures ? (userProfile.plannedProcedureCost || 5000) : 0
    );
    scenarios.push({
      name: 'Your Expected Usage',
      description: 'Based on your health profile and expected needs',
      planACost: annualPremiumA + userOOPA,
      planBCost: annualPremiumB + userOOPB,
      difference: (annualPremiumA + userOOPA) - (annualPremiumB + userOOPB),
      winner: determineWinner(annualPremiumA + userOOPA, annualPremiumB + userOOPB, 'lower'),
      breakdown: {
        premiums: { planA: annualPremiumA, planB: annualPremiumB },
        outOfPocket: { planA: userOOPA, planB: userOOPB },
      },
    });
  }

  return scenarios;
}

/**
 * Calculate estimated out-of-pocket costs
 */
function calculateOOP(
  plan: PlanDetails,
  doctorVisits: number,
  specialistVisits: number,
  prescriptions: number,
  erVisits: number,
  procedureCost: number
): number {
  let totalOOP = 0;

  // Doctor visits (use copay or estimate)
  const pcCopay = plan.primaryCareCopay ?? 30;
  totalOOP += doctorVisits * pcCopay;

  // Specialist visits
  const specCopay = plan.specialistCopay ?? 60;
  totalOOP += specialistVisits * specCopay;

  // Prescriptions
  const rxCopay = plan.genericDrugCopay ?? 15;
  totalOOP += prescriptions * rxCopay;

  // ER visits
  const erCopay = plan.emergencyRoomCopay ?? 300;
  totalOOP += erVisits * erCopay;

  // Procedure cost (after deductible with coinsurance)
  if (procedureCost > 0) {
    const coinsurance = (plan.coinsurance ?? 20) / 100;
    const afterDeductible = Math.max(0, procedureCost - plan.deductible);
    totalOOP += plan.deductible + (afterDeductible * coinsurance);
  }

  // Cap at out-of-pocket maximum
  return Math.min(totalOOP, plan.outOfPocketMax);
}

/**
 * Determine overall winner
 */
function determineOverallWinner(
  metrics: ComparisonMetric[],
  scenarios: CostScenario[],
  userProfile?: UserHealthProfile
): PlanComparisonResult['overallWinner'] {
  // Score each plan
  let scoreA = 0;
  let scoreB = 0;

  // Count metric wins weighted by importance
  metrics.forEach((m) => {
    if (m.winner === 'A') scoreA += m.importance;
    else if (m.winner === 'B') scoreB += m.importance;
  });

  // Count scenario wins
  scenarios.forEach((s) => {
    if (s.winner === 'A') scoreA += 3;
    else if (s.winner === 'B') scoreB += 3;
  });

  // Adjust for user preferences if provided
  if (userProfile) {
    // Find user's expected usage scenario
    const userScenario = scenarios.find((s) => s.name === 'Your Expected Usage');
    if (userScenario) {
      if (userScenario.winner === 'A') scoreA += 5;
      else if (userScenario.winner === 'B') scoreB += 5;
    }
  }

  const diff = Math.abs(scoreA - scoreB);
  const confidence: 'high' | 'medium' | 'low' = diff > 10 ? 'high' : diff > 5 ? 'medium' : 'low';

  if (scoreA > scoreB) {
    return {
      plan: 'A',
      confidence,
      reasoning: `Plan A wins ${metrics.filter((m) => m.winner === 'A').length} of ${metrics.length} comparison metrics and ${scenarios.filter((s) => s.winner === 'A').length} of ${scenarios.length} cost scenarios.`,
    };
  } else if (scoreB > scoreA) {
    return {
      plan: 'B',
      confidence,
      reasoning: `Plan B wins ${metrics.filter((m) => m.winner === 'B').length} of ${metrics.length} comparison metrics and ${scenarios.filter((s) => s.winner === 'B').length} of ${scenarios.length} cost scenarios.`,
    };
  } else {
    return {
      plan: 'tie',
      confidence: 'low',
      reasoning: 'Both plans are evenly matched across comparison metrics and cost scenarios.',
    };
  }
}

/**
 * Generate recommendation
 */
function generateRecommendation(
  planA: PlanDetails,
  planB: PlanDetails,
  _metrics: ComparisonMetric[],
  scenarios: CostScenario[],
  userProfile?: UserHealthProfile
): PlanComparisonResult['recommendation'] {
  const reasons: string[] = [];
  const caveats: string[] = [];

  // Find cheapest for expected usage
  const userScenario = scenarios.find((s) => s.name === 'Your Expected Usage') || scenarios[1];
  const cheaperPlan = userScenario?.winner ?? 'tie';

  // Find plan with lower premium
  const lowerPremiumPlan = planA.monthlyPremium < planB.monthlyPremium ? 'A' : 'B';

  // Find plan with lower OOP max
  const lowerOOPPlan = planA.outOfPocketMax < planB.outOfPocketMax ? 'A' : 'B';

  // Build reasons
  if (cheaperPlan !== 'tie' && userScenario) {
    reasons.push(
      `${cheaperPlan === 'A' ? planA.name : planB.name} costs ${formatCurrency(Math.abs(userScenario.difference))} less annually for your expected healthcare usage.`
    );
  }

  if (userProfile?.prioritizesLowerPremium && lowerPremiumPlan !== cheaperPlan) {
    caveats.push(
      `While you prefer lower premiums, the higher-premium plan may cost less overall given your healthcare needs.`
    );
  }

  if (userProfile?.hasChronicConditions) {
    reasons.push(
      `With a chronic condition, the plan with lower out-of-pocket maximum provides better protection.`
    );
  }

  if (userProfile?.riskTolerance === 'low') {
    reasons.push(
      `Given your low risk tolerance, consider the plan with lower deductible and out-of-pocket maximum.`
    );
  }

  // Add specific plan benefits
  if (planA.hsaEligible && !planB.hsaEligible) {
    reasons.push(`${planA.name} is HSA-eligible, offering tax advantages for healthcare savings.`);
  } else if (planB.hsaEligible && !planA.hsaEligible) {
    reasons.push(`${planB.name} is HSA-eligible, offering tax advantages for healthcare savings.`);
  }

  const recommendedPlan = cheaperPlan !== 'tie' ? cheaperPlan : lowerOOPPlan;

  return {
    recommendedPlan: recommendedPlan as 'A' | 'B',
    reasons: reasons.length > 0 ? reasons : ['Based on overall cost analysis, this plan offers better value.'],
    caveats: caveats.length > 0 ? caveats : [],
  };
}

/**
 * Identify key differences
 */
function identifyKeyDifferences(
  planA: PlanDetails,
  planB: PlanDetails,
  _metrics: ComparisonMetric[]
): string[] {
  const differences: string[] = [];

  // Premium difference
  const premiumDiff = Math.abs(planA.monthlyPremium - planB.monthlyPremium);
  if (premiumDiff > 50) {
    const cheaper = planA.monthlyPremium < planB.monthlyPremium ? planA : planB;
    differences.push(
      `${cheaper.name} has a ${formatCurrency(premiumDiff)} lower monthly premium.`
    );
  }

  // Deductible difference
  const deductibleDiff = Math.abs(planA.deductible - planB.deductible);
  if (deductibleDiff > 500) {
    const lower = planA.deductible < planB.deductible ? planA : planB;
    differences.push(
      `${lower.name} has a ${formatCurrency(deductibleDiff)} lower deductible.`
    );
  }

  // OOP max difference
  const oopDiff = Math.abs(planA.outOfPocketMax - planB.outOfPocketMax);
  if (oopDiff > 1000) {
    const lower = planA.outOfPocketMax < planB.outOfPocketMax ? planA : planB;
    differences.push(
      `${lower.name} has a ${formatCurrency(oopDiff)} lower out-of-pocket maximum.`
    );
  }

  // Plan type difference
  if (planA.type !== planB.type) {
    differences.push(
      `${planA.name} is a ${planA.type} plan while ${planB.name} is a ${planB.type} plan.`
    );
  }

  // Quality rating difference
  if (planA.qualityRating && planB.qualityRating) {
    const ratingDiff = Math.abs(planA.qualityRating - planB.qualityRating);
    if (ratingDiff >= 1) {
      const higher = planA.qualityRating > planB.qualityRating ? planA : planB;
      differences.push(
        `${higher.name} has a higher quality rating (${higher.qualityRating} vs ${higher === planA ? planB.qualityRating : planA.qualityRating} stars).`
      );
    }
  }

  return differences;
}

/**
 * Generate summary
 */
function generateSummary(
  planA: PlanDetails,
  planB: PlanDetails,
  overallWinner: PlanComparisonResult['overallWinner'],
  recommendation: PlanComparisonResult['recommendation']
): string {
  if (overallWinner.plan === 'tie') {
    return `Both ${planA.name} and ${planB.name} are closely matched. Your choice should depend on your specific healthcare needs and preferences.`;
  }

  const winnerPlan = overallWinner.plan === 'A' ? planA : planB;
  const loserPlan = overallWinner.plan === 'A' ? planB : planA;

  return `Based on our analysis, ${winnerPlan.name} appears to be the better choice with ${overallWinner.confidence} confidence. ${recommendation.reasons[0] || ''} However, ${loserPlan.name} may be preferable if ${overallWinner.plan === 'A' ? 'you expect minimal healthcare usage' : 'you prioritize lower monthly costs'}.`;
}

// Helper functions
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function formatDifference(valueA: number, valueB: number, suffix: string = ''): string {
  const diff = valueA - valueB;
  if (diff === 0) return 'Same';
  const direction = diff > 0 ? 'more' : 'less';
  return `${formatCurrency(Math.abs(diff))} ${direction}${suffix}`;
}

function determineWinner(valueA: number, valueB: number, prefer: 'lower' | 'higher'): 'A' | 'B' | 'tie' {
  if (valueA === valueB) return 'tie';
  if (prefer === 'lower') return valueA < valueB ? 'A' : 'B';
  return valueA > valueB ? 'A' : 'B';
}

/**
 * Quick comparison for two plans
 */
export function quickComparison(
  planA: PlanDetails,
  planB: PlanDetails
): {
  cheaperMonthly: 'A' | 'B' | 'tie';
  cheaperAnnuallyHealthy: 'A' | 'B' | 'tie';
  cheaperAnnuallySick: 'A' | 'B' | 'tie';
  betterProtection: 'A' | 'B' | 'tie';
  summary: string;
} {
  const result = comparePlans(planA, planB);
  const healthyScenario = result.scenarios[0];
  const sickScenario = result.scenarios[3]; // Major medical event

  return {
    cheaperMonthly: planA.monthlyPremium < planB.monthlyPremium ? 'A' :
      planA.monthlyPremium > planB.monthlyPremium ? 'B' : 'tie',
    cheaperAnnuallyHealthy: healthyScenario?.winner ?? 'tie',
    cheaperAnnuallySick: sickScenario?.winner ?? 'tie',
    betterProtection: planA.outOfPocketMax < planB.outOfPocketMax ? 'A' :
      planA.outOfPocketMax > planB.outOfPocketMax ? 'B' : 'tie',
    summary: result.summary,
  };
}
