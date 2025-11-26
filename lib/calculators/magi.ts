/**
 * MAGI Optimizer
 *
 * Helps users understand and optimize their Modified Adjusted Gross Income
 * for ACA marketplace subsidies. Calculates subsidy cliffs, optimal income
 * levels, and strategies to reduce MAGI.
 */

// Types
export interface MAGIOptimizerInput {
  /** Current estimated MAGI */
  estimatedMAGI: number;
  /** Household size */
  householdSize: number;
  /** Filing status */
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
  /** State of residence */
  state: string;
  /** Age of primary applicant */
  age: number;
  /** Benchmark silver plan premium (if known) */
  benchmarkPremium?: number;
  /** Current retirement contributions */
  currentRetirementContributions?: number;
  /** Current HSA contributions */
  currentHSAContributions?: number;
  /** Has access to employer 401k */
  has401kAccess?: boolean;
  /** Has HDHP for HSA eligibility */
  hasHDHP?: boolean;
  /** Self-employment income */
  selfEmploymentIncome?: number;
}

export interface SubsidyBreakpoint {
  /** FPL percentage */
  fplPercent: number;
  /** Income at this FPL level */
  incomeAtFPL: number;
  /** Expected contribution percentage */
  expectedContributionPercent: number;
  /** Monthly subsidy at this level */
  monthlySubsidy: number;
  /** Annual subsidy at this level */
  annualSubsidy: number;
}

export interface MAGIStrategy {
  /** Strategy name */
  name: string;
  /** Description */
  description: string;
  /** Maximum reduction possible */
  maxReduction: number;
  /** Recommended reduction */
  recommendedReduction: number;
  /** Annual subsidy increase */
  subsidyIncrease: number;
  /** Net benefit (subsidy increase minus contribution) */
  netBenefit: number;
  /** Priority ranking */
  priority: number;
  /** Applicable to user */
  applicable: boolean;
  /** Reason if not applicable */
  notApplicableReason?: string;
}

export interface MAGIAnalysis {
  /** Current MAGI details */
  current: {
    magi: number;
    fplPercent: number;
    tier: 'medicaid' | 'subsidy' | 'cliff' | 'above_cliff';
    monthlySubsidy: number;
    annualSubsidy: number;
    expectedContribution: number;
    effectivePremium: number;
  };
  /** Subsidy breakpoints for reference */
  breakpoints: SubsidyBreakpoint[];
  /** Optimal MAGI target */
  optimal: {
    targetMAGI: number;
    targetFPL: number;
    monthlySubsidy: number;
    annualSubsidy: number;
    reductionNeeded: number;
    additionalAnnualSubsidy: number;
  };
  /** MAGI reduction strategies */
  strategies: MAGIStrategy[];
  /** Cliff analysis */
  cliffAnalysis: {
    nearCliff: boolean;
    distanceFromCliff: number;
    cliffAmount: number;
    subsidyAtRisk: number;
    safetyBuffer: number;
  };
  /** Warnings and important notes */
  warnings: string[];
  /** Recommendations */
  recommendations: string[];
}

// 2024 Federal Poverty Levels
const FPL_2024: Record<number, number> = {
  1: 14580,
  2: 19720,
  3: 24860,
  4: 30000,
  5: 35140,
  6: 40280,
  7: 45420,
  8: 50560,
};
const FPL_ADDITIONAL_PERSON = 5140;

// 2024 ACA Expected Contribution Percentages (enhanced through 2025)
// These are percentages of income, not FPL
const CONTRIBUTION_BRACKETS = [
  { maxFPL: 150, minPercent: 0, maxPercent: 0 },
  { maxFPL: 200, minPercent: 0, maxPercent: 2.0 },
  { maxFPL: 250, minPercent: 2.0, maxPercent: 4.0 },
  { maxFPL: 300, minPercent: 4.0, maxPercent: 6.0 },
  { maxFPL: 400, minPercent: 6.0, maxPercent: 8.5 },
  { maxFPL: Infinity, minPercent: 8.5, maxPercent: 8.5 }, // Enhanced subsidies extend above 400%
];

// Contribution limits for 2024
const CONTRIBUTION_LIMITS_2024 = {
  traditional401k: 23000,
  traditional401kCatchUp: 7500, // Age 50+
  traditionalIRA: 7000,
  traditionalIRACatchUp: 1000, // Age 50+
  hsaIndividual: 4150,
  hsaFamily: 8300,
  hsaCatchUp: 1000, // Age 55+
};

// Medicaid expansion states (simplified list)
const MEDICAID_EXPANSION_STATES = [
  'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'HI', 'IL', 'IN', 'IA', 'KY',
  'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SD', 'VA', 'VT',
  'WA', 'WV',
];

/**
 * Analyze MAGI and provide optimization strategies
 */
export function analyzeMAGI(input: MAGIOptimizerInput): MAGIAnalysis {
  const fpl = getFPL(input.householdSize);
  const fplPercent = (input.estimatedMAGI / fpl) * 100;

  // Estimate benchmark premium if not provided
  const benchmarkPremium = input.benchmarkPremium || estimateBenchmarkPremium(input.age, input.state);

  // Calculate current subsidy
  const currentSubsidy = calculateSubsidy(input.estimatedMAGI, fpl, benchmarkPremium);
  const currentTier = determineTier(fplPercent, input.state);

  // Calculate breakpoints
  const breakpoints = calculateBreakpoints(fpl, benchmarkPremium);

  // Find optimal MAGI
  const optimal = findOptimalMAGI(input, fpl, benchmarkPremium);

  // Generate strategies
  const strategies = generateStrategies(input, optimal.reductionNeeded);

  // Analyze cliff risk
  const cliffAnalysis = analyzeCliffRisk(input.estimatedMAGI, fpl, benchmarkPremium);

  // Generate warnings and recommendations
  const warnings = generateWarnings(input, fplPercent, currentTier);
  const recommendations = generateRecommendations(input, optimal, strategies);

  return {
    current: {
      magi: input.estimatedMAGI,
      fplPercent: Math.round(fplPercent),
      tier: currentTier,
      monthlySubsidy: currentSubsidy.monthlySubsidy,
      annualSubsidy: currentSubsidy.annualSubsidy,
      expectedContribution: currentSubsidy.expectedContribution,
      effectivePremium: Math.max(0, benchmarkPremium - currentSubsidy.monthlySubsidy),
    },
    breakpoints,
    optimal,
    strategies,
    cliffAnalysis,
    warnings,
    recommendations,
  };
}

/**
 * Get Federal Poverty Level for household size
 */
function getFPL(householdSize: number): number {
  if (householdSize <= 8) {
    return FPL_2024[householdSize] || FPL_2024[1]!;
  }
  return FPL_2024[8]! + FPL_ADDITIONAL_PERSON * (householdSize - 8);
}

/**
 * Estimate benchmark silver plan premium
 */
function estimateBenchmarkPremium(age: number, state: string): number {
  // Base premium for 40-year-old
  const basePremium = 450;

  // Age factor (simplified)
  let ageFactor = 1.0;
  if (age < 21) ageFactor = 0.635;
  else if (age <= 29) ageFactor = 0.8;
  else if (age <= 39) ageFactor = 0.95;
  else if (age <= 49) ageFactor = 1.1;
  else if (age <= 59) ageFactor = 1.5;
  else ageFactor = 1.8;

  // State factor (simplified)
  const expensiveStates = ['AK', 'WY', 'NY', 'VT', 'WV'];
  const cheapStates = ['UT', 'NH', 'MN', 'MI', 'OH'];
  let stateFactor = 1.0;
  if (expensiveStates.includes(state.toUpperCase())) stateFactor = 1.3;
  else if (cheapStates.includes(state.toUpperCase())) stateFactor = 0.85;

  return Math.round(basePremium * ageFactor * stateFactor);
}

/**
 * Calculate subsidy for given MAGI
 */
function calculateSubsidy(
  magi: number,
  fpl: number,
  benchmarkPremium: number
): {
  monthlySubsidy: number;
  annualSubsidy: number;
  expectedContribution: number;
  contributionPercent: number;
} {
  const fplPercent = (magi / fpl) * 100;

  // Below 100% FPL - no marketplace subsidy (Medicaid eligible in expansion states)
  if (fplPercent < 100) {
    return {
      monthlySubsidy: 0,
      annualSubsidy: 0,
      expectedContribution: 0,
      contributionPercent: 0,
    };
  }

  // Find applicable contribution percentage
  let contributionPercent = 8.5; // Default above 400%
  for (const bracket of CONTRIBUTION_BRACKETS) {
    if (fplPercent <= bracket.maxFPL) {
      // Linear interpolation within bracket
      const prevBracket = CONTRIBUTION_BRACKETS[CONTRIBUTION_BRACKETS.indexOf(bracket) - 1];
      const minFPL = prevBracket ? prevBracket.maxFPL : 100;
      const range = bracket.maxFPL - minFPL;
      const position = (fplPercent - minFPL) / range;
      contributionPercent = bracket.minPercent + position * (bracket.maxPercent - bracket.minPercent);
      break;
    }
  }

  const monthlyContribution = (magi * (contributionPercent / 100)) / 12;
  const monthlySubsidy = Math.max(0, benchmarkPremium - monthlyContribution);
  const annualSubsidy = monthlySubsidy * 12;

  return {
    monthlySubsidy: Math.round(monthlySubsidy),
    annualSubsidy: Math.round(annualSubsidy),
    expectedContribution: Math.round(monthlyContribution * 12),
    contributionPercent: Math.round(contributionPercent * 100) / 100,
  };
}

/**
 * Determine subsidy tier
 */
function determineTier(
  fplPercent: number,
  state: string
): 'medicaid' | 'subsidy' | 'cliff' | 'above_cliff' {
  const isMedicaidExpansion = MEDICAID_EXPANSION_STATES.includes(state.toUpperCase());

  if (fplPercent < 100) {
    return isMedicaidExpansion ? 'medicaid' : 'subsidy'; // Coverage gap states may still qualify
  }
  if (fplPercent < 138 && isMedicaidExpansion) {
    return 'medicaid';
  }
  if (fplPercent <= 400) {
    return 'subsidy';
  }
  if (fplPercent <= 450) {
    return 'cliff'; // Enhanced subsidies taper, but near cliff
  }
  return 'above_cliff';
}

/**
 * Calculate subsidy breakpoints
 */
function calculateBreakpoints(
  fpl: number,
  benchmarkPremium: number
): SubsidyBreakpoint[] {
  const breakpoints: SubsidyBreakpoint[] = [];
  const fplLevels = [100, 150, 200, 250, 300, 350, 400, 450, 500];

  for (const fplPercent of fplLevels) {
    const income = (fpl * fplPercent) / 100;
    const subsidy = calculateSubsidy(income, fpl, benchmarkPremium);

    breakpoints.push({
      fplPercent,
      incomeAtFPL: Math.round(income),
      expectedContributionPercent: subsidy.contributionPercent,
      monthlySubsidy: subsidy.monthlySubsidy,
      annualSubsidy: subsidy.annualSubsidy,
    });
  }

  return breakpoints;
}

/**
 * Find optimal MAGI for maximum net benefit
 */
function findOptimalMAGI(
  input: MAGIOptimizerInput,
  fpl: number,
  benchmarkPremium: number
): MAGIAnalysis['optimal'] {
  const currentSubsidy = calculateSubsidy(input.estimatedMAGI, fpl, benchmarkPremium);

  // Test different FPL levels to find optimal
  let optimalMAGI = input.estimatedMAGI;
  let optimalSubsidy = currentSubsidy.annualSubsidy;
  let optimalFPL = (input.estimatedMAGI / fpl) * 100;

  // Check key FPL thresholds
  const testLevels = [150, 200, 250, 300, 350, 400];

  for (const fplPercent of testLevels) {
    const testMAGI = (fpl * fplPercent) / 100;

    // Only consider if it would require reducing MAGI
    if (testMAGI < input.estimatedMAGI) {
      const testSubsidy = calculateSubsidy(testMAGI, fpl, benchmarkPremium);

      // Check if subsidy increase is worth the income reduction
      const incomeReduction = input.estimatedMAGI - testMAGI;
      const subsidyIncrease = testSubsidy.annualSubsidy - currentSubsidy.annualSubsidy;

      // If subsidy increase is greater than income reduction (considering tax savings)
      // Assume ~25% effective tax rate on the reduced income
      const netBenefit = subsidyIncrease - incomeReduction * 0.75;

      if (netBenefit > 0 && testSubsidy.annualSubsidy > optimalSubsidy) {
        optimalMAGI = testMAGI;
        optimalSubsidy = testSubsidy.annualSubsidy;
        optimalFPL = fplPercent;
      }
    }
  }

  const reductionNeeded = Math.max(0, input.estimatedMAGI - optimalMAGI);
  const subsidyAtOptimal = calculateSubsidy(optimalMAGI, fpl, benchmarkPremium);

  return {
    targetMAGI: Math.round(optimalMAGI),
    targetFPL: Math.round(optimalFPL),
    monthlySubsidy: subsidyAtOptimal.monthlySubsidy,
    annualSubsidy: subsidyAtOptimal.annualSubsidy,
    reductionNeeded: Math.round(reductionNeeded),
    additionalAnnualSubsidy: Math.round(subsidyAtOptimal.annualSubsidy - currentSubsidy.annualSubsidy),
  };
}

/**
 * Generate MAGI reduction strategies
 */
function generateStrategies(
  input: MAGIOptimizerInput,
  reductionNeeded: number
): MAGIStrategy[] {
  const strategies: MAGIStrategy[] = [];
  const age = input.age;
  const currentRetirement = input.currentRetirementContributions || 0;
  const currentHSA = input.currentHSAContributions || 0;

  // Strategy 1: Traditional 401(k)
  if (input.has401kAccess !== false) {
    const maxContribution =
      CONTRIBUTION_LIMITS_2024.traditional401k +
      (age >= 50 ? CONTRIBUTION_LIMITS_2024.traditional401kCatchUp : 0);
    const available = Math.max(0, maxContribution - currentRetirement);

    strategies.push({
      name: 'Traditional 401(k) Contribution',
      description: 'Increase pre-tax 401(k) contributions to reduce MAGI',
      maxReduction: available,
      recommendedReduction: Math.min(available, reductionNeeded),
      subsidyIncrease: 0, // Will be calculated
      netBenefit: 0, // Will be calculated
      priority: 1,
      applicable: true,
      notApplicableReason: undefined,
    });
  } else {
    // 401k not available
    strategies.push({
      name: 'Traditional 401(k) Contribution',
      description: 'Increase pre-tax 401(k) contributions to reduce MAGI',
      maxReduction: 0,
      recommendedReduction: 0,
      subsidyIncrease: 0,
      netBenefit: 0,
      priority: 1,
      applicable: false,
      notApplicableReason: 'No 401(k) access',
    });
  }

  // Strategy 2: Traditional IRA
  const iraMax =
    CONTRIBUTION_LIMITS_2024.traditionalIRA +
    (age >= 50 ? CONTRIBUTION_LIMITS_2024.traditionalIRACatchUp : 0);

  strategies.push({
    name: 'Traditional IRA Contribution',
    description: 'Contribute to traditional IRA for tax deduction',
    maxReduction: iraMax,
    recommendedReduction: Math.min(iraMax, Math.max(0, reductionNeeded - currentRetirement)),
    subsidyIncrease: 0,
    netBenefit: 0,
    priority: 2,
    applicable: true,
  });

  // Strategy 3: HSA Contribution
  if (input.hasHDHP) {
    const hsaMax =
      CONTRIBUTION_LIMITS_2024.hsaFamily + // Assume family for max
      (age >= 55 ? CONTRIBUTION_LIMITS_2024.hsaCatchUp : 0);
    const hsaAvailable = Math.max(0, hsaMax - currentHSA);

    strategies.push({
      name: 'HSA Contribution',
      description: 'Max out HSA contributions (requires HDHP)',
      maxReduction: hsaAvailable,
      recommendedReduction: Math.min(hsaAvailable, reductionNeeded),
      subsidyIncrease: 0,
      netBenefit: 0,
      priority: 1, // High priority due to triple tax advantage
      applicable: true,
    });
  } else {
    strategies.push({
      name: 'HSA Contribution',
      description: 'Max out HSA contributions (requires HDHP)',
      maxReduction: 0,
      recommendedReduction: 0,
      subsidyIncrease: 0,
      netBenefit: 0,
      priority: 3,
      applicable: false,
      notApplicableReason: 'Requires High Deductible Health Plan (HDHP)',
    });
  }

  // Strategy 4: Self-employment deductions
  if (input.selfEmploymentIncome && input.selfEmploymentIncome > 0) {
    const seHealthInsurance = input.selfEmploymentIncome * 0.1; // Estimate
    const seTax = input.selfEmploymentIncome * 0.0765; // Half of SE tax

    strategies.push({
      name: 'Self-Employment Deductions',
      description: 'Deduct health insurance premiums and half of SE tax',
      maxReduction: Math.round(seHealthInsurance + seTax),
      recommendedReduction: Math.round(seHealthInsurance + seTax),
      subsidyIncrease: 0,
      netBenefit: 0,
      priority: 2,
      applicable: true,
    });
  }

  // Strategy 5: Timing income/deductions
  strategies.push({
    name: 'Income Timing',
    description: 'Defer bonuses, capital gains, or Roth conversions to next year',
    maxReduction: Math.round(input.estimatedMAGI * 0.1), // Estimate 10% flexibility
    recommendedReduction: Math.min(Math.round(input.estimatedMAGI * 0.1), reductionNeeded),
    subsidyIncrease: 0,
    netBenefit: 0,
    priority: 3,
    applicable: true,
  });

  // Sort by priority
  strategies.sort((a, b) => a.priority - b.priority);

  return strategies;
}

/**
 * Analyze risk of falling off subsidy cliff
 */
function analyzeCliffRisk(
  magi: number,
  fpl: number,
  benchmarkPremium: number
): MAGIAnalysis['cliffAnalysis'] {
  const fplPercent = (magi / fpl) * 100;
  const cliff400 = fpl * 4; // 400% FPL

  // With enhanced subsidies through 2025, cliff is softer
  // But still significant at ~450% FPL
  const effectiveCliff = fpl * 4.5;

  const distanceFromCliff = effectiveCliff - magi;
  const nearCliff = fplPercent >= 380 && fplPercent <= 420;

  // Calculate subsidy at cliff vs just below
  const subsidyJustBelow = calculateSubsidy(cliff400 - 100, fpl, benchmarkPremium);
  const subsidyAtCliff = calculateSubsidy(cliff400 + 100, fpl, benchmarkPremium);
  const subsidyAtRisk = subsidyJustBelow.annualSubsidy - subsidyAtCliff.annualSubsidy;

  // Recommend buffer of ~$500-1000 below cliff
  const safetyBuffer = Math.max(500, fpl * 0.05);

  return {
    nearCliff,
    distanceFromCliff: Math.round(distanceFromCliff),
    cliffAmount: Math.round(effectiveCliff),
    subsidyAtRisk: Math.round(subsidyAtRisk),
    safetyBuffer: Math.round(safetyBuffer),
  };
}

/**
 * Generate warnings
 */
function generateWarnings(
  input: MAGIOptimizerInput,
  fplPercent: number,
  tier: string
): string[] {
  const warnings: string[] = [];

  if (tier === 'medicaid') {
    warnings.push(
      'Your income may qualify you for Medicaid instead of marketplace subsidies. Check your state\'s Medicaid program.'
    );
  }

  if (fplPercent >= 380 && fplPercent <= 420) {
    warnings.push(
      'CAUTION: You are near the subsidy cliff. Small income increases could significantly reduce your subsidy.'
    );
  }

  if (fplPercent < 100 && !MEDICAID_EXPANSION_STATES.includes(input.state.toUpperCase())) {
    warnings.push(
      'Your state has not expanded Medicaid. You may fall into the "coverage gap" with limited options.'
    );
  }

  if (input.filingStatus === 'married_separate') {
    warnings.push(
      'Filing married separately typically disqualifies you from premium tax credits except in cases of domestic abuse or spousal abandonment.'
    );
  }

  warnings.push(
    'MAGI calculations are estimates. Consult a tax professional for your specific situation.'
  );

  return warnings;
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  input: MAGIOptimizerInput,
  optimal: MAGIAnalysis['optimal'],
  strategies: MAGIStrategy[]
): string[] {
  const recommendations: string[] = [];

  if (optimal.reductionNeeded > 0 && optimal.additionalAnnualSubsidy > 1000) {
    recommendations.push(
      `Reducing your MAGI by $${optimal.reductionNeeded.toLocaleString()} could increase your annual subsidy by $${optimal.additionalAnnualSubsidy.toLocaleString()}.`
    );
  }

  // Recommend top applicable strategies
  const applicableStrategies = strategies.filter((s) => s.applicable && s.maxReduction > 0);
  if (applicableStrategies.length > 0) {
    const topStrategy = applicableStrategies[0];
    recommendations.push(
      `Consider ${topStrategy?.name.toLowerCase()}: Up to $${topStrategy?.maxReduction.toLocaleString()} reduction available.`
    );
  }

  // HSA recommendation
  if (input.hasHDHP && (input.currentHSAContributions || 0) < CONTRIBUTION_LIMITS_2024.hsaIndividual) {
    recommendations.push(
      'Maximize HSA contributions for triple tax advantage: tax deduction now, tax-free growth, and tax-free withdrawals for medical expenses.'
    );
  }

  // Retirement recommendation
  if (input.has401kAccess !== false && (input.currentRetirementContributions || 0) < CONTRIBUTION_LIMITS_2024.traditional401k) {
    recommendations.push(
      'Increase traditional 401(k) contributions to reduce MAGI while building retirement savings.'
    );
  }

  // Cliff warning
  const fpl = getFPL(input.householdSize);
  const fplPercent = (input.estimatedMAGI / fpl) * 100;
  if (fplPercent >= 350 && fplPercent <= 400) {
    recommendations.push(
      'You\'re in a high-subsidy zone. Consider strategies to keep income below 400% FPL to maximize benefits.'
    );
  }

  return recommendations;
}

/**
 * Quick subsidy calculator
 */
export function quickSubsidyCalculator(
  magi: number,
  householdSize: number,
  benchmarkPremium: number
): {
  fplPercent: number;
  monthlySubsidy: number;
  annualSubsidy: number;
  expectedMonthlyContribution: number;
  effectiveMonthlyPremium: number;
} {
  const fpl = getFPL(householdSize);
  const fplPercent = (magi / fpl) * 100;
  const subsidy = calculateSubsidy(magi, fpl, benchmarkPremium);

  return {
    fplPercent: Math.round(fplPercent),
    monthlySubsidy: subsidy.monthlySubsidy,
    annualSubsidy: subsidy.annualSubsidy,
    expectedMonthlyContribution: Math.round(subsidy.expectedContribution / 12),
    effectiveMonthlyPremium: Math.max(0, benchmarkPremium - subsidy.monthlySubsidy),
  };
}

/**
 * Calculate FPL percentage
 */
export function calculateFPLPercent(magi: number, householdSize: number): number {
  const fpl = getFPL(householdSize);
  return Math.round((magi / fpl) * 100);
}

/**
 * Get income at specific FPL percentage
 */
export function getIncomeAtFPL(fplPercent: number, householdSize: number): number {
  const fpl = getFPL(householdSize);
  return Math.round((fpl * fplPercent) / 100);
}

/**
 * Check Medicaid expansion status
 */
export function isMedicaidExpansionState(state: string): boolean {
  return MEDICAID_EXPANSION_STATES.includes(state.toUpperCase());
}
