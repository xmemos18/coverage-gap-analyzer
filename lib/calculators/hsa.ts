/**
 * HSA Contribution Calculator
 *
 * Helps users optimize Health Savings Account contributions,
 * calculate tax benefits, and project investment growth.
 */

// Types
export interface HSAInput {
  /** Coverage type */
  coverageType: 'individual' | 'family';
  /** Age of account holder */
  age: number;
  /** Current HSA balance */
  currentBalance?: number;
  /** Annual household income */
  annualIncome: number;
  /** Federal tax bracket (decimal, e.g., 0.22) */
  federalTaxRate: number;
  /** State tax rate (decimal) */
  stateTaxRate?: number;
  /** Employer HSA contribution */
  employerContribution?: number;
  /** Expected annual healthcare expenses */
  expectedExpenses?: number;
  /** Monthly premium for HDHP */
  monthlyPremium: number;
  /** HDHP deductible */
  deductible: number;
  /** Years until retirement */
  yearsToRetirement?: number;
  /** Expected investment return (decimal) */
  expectedReturn?: number;
  /** Expected healthcare inflation (decimal) */
  healthcareInflation?: number;
}

export interface HSAContributionLimits {
  /** Base contribution limit */
  baseLimit: number;
  /** Catch-up contribution (if age 55+) */
  catchUpContribution: number;
  /** Total contribution limit */
  totalLimit: number;
  /** Already contributed by employer */
  employerContribution: number;
  /** Maximum employee contribution */
  maxEmployeeContribution: number;
}

export interface HSATaxSavings {
  /** Federal tax savings */
  federalTaxSavings: number;
  /** State tax savings */
  stateTaxSavings: number;
  /** FICA savings (7.65%) */
  ficaSavings: number;
  /** Total annual tax savings */
  totalAnnualSavings: number;
  /** Effective cost per dollar contributed */
  effectiveCostPerDollar: number;
}

export interface HSAProjection {
  /** Year */
  year: number;
  /** Age */
  age: number;
  /** Beginning balance */
  beginningBalance: number;
  /** Contribution */
  contribution: number;
  /** Investment growth */
  investmentGrowth: number;
  /** Expenses paid */
  expensesPaid: number;
  /** Ending balance */
  endingBalance: number;
}

export interface HSAAnalysis {
  /** Contribution limits */
  limits: HSAContributionLimits;
  /** Recommended contribution */
  recommendedContribution: number;
  /** Tax savings */
  taxSavings: HSATaxSavings;
  /** Is user eligible for catch-up */
  catchUpEligible: boolean;
  /** Projections */
  projections: HSAProjection[];
  /** Balance at retirement */
  retirementBalance: number;
  /** Recommendations */
  recommendations: string[];
  /** Comparison with FSA */
  fsaComparison: {
    hsaAdvantage: string[];
    fsaAdvantage: string[];
  };
}

// 2024 HSA Limits
const HSA_LIMITS_2024 = {
  individual: 4150,
  family: 8300,
  catchUp: 1000, // Age 55+
};

// 2024 HDHP Requirements
const HDHP_REQUIREMENTS_2024 = {
  minDeductible: {
    individual: 1600,
    family: 3200,
  },
  maxOutOfPocket: {
    individual: 8050,
    family: 16100,
  },
};

// FICA rate (Social Security + Medicare)
const FICA_RATE = 0.0765;

/**
 * Calculate HSA contribution optimization
 */
export function calculateHSAOptimization(input: HSAInput): HSAAnalysis {
  const limits = calculateContributionLimits(input);
  const taxSavings = calculateTaxSavings(input, limits.maxEmployeeContribution);
  const catchUpEligible = input.age >= 55;

  // Calculate recommended contribution
  const recommendedContribution = calculateRecommendedContribution(input, limits);

  // Generate projections
  const projections = generateProjections(input, recommendedContribution);

  // Calculate retirement balance
  const retirementBalance =
    projections.length > 0
      ? projections[projections.length - 1]?.endingBalance || 0
      : input.currentBalance || 0;

  // Generate recommendations
  const recommendations = generateRecommendations(input, limits, taxSavings);

  // FSA comparison
  const fsaComparison = compareFSA();

  return {
    limits,
    recommendedContribution,
    taxSavings,
    catchUpEligible,
    projections,
    retirementBalance: Math.round(retirementBalance),
    recommendations,
    fsaComparison,
  };
}

/**
 * Calculate HSA contribution limits
 */
function calculateContributionLimits(input: HSAInput): HSAContributionLimits {
  const baseLimit =
    input.coverageType === 'family'
      ? HSA_LIMITS_2024.family
      : HSA_LIMITS_2024.individual;

  const catchUpContribution = input.age >= 55 ? HSA_LIMITS_2024.catchUp : 0;
  const totalLimit = baseLimit + catchUpContribution;
  const employerContribution = input.employerContribution || 0;
  const maxEmployeeContribution = Math.max(0, totalLimit - employerContribution);

  return {
    baseLimit,
    catchUpContribution,
    totalLimit,
    employerContribution,
    maxEmployeeContribution,
  };
}

/**
 * Calculate tax savings from HSA contributions
 */
function calculateTaxSavings(
  input: HSAInput,
  contribution: number
): HSATaxSavings {
  const federalTaxSavings = contribution * input.federalTaxRate;
  const stateTaxSavings = contribution * (input.stateTaxRate || 0);

  // FICA savings only apply to contributions made through payroll deduction
  // Assuming payroll deduction
  const ficaSavings = contribution * FICA_RATE;

  const totalAnnualSavings =
    federalTaxSavings + stateTaxSavings + ficaSavings;

  const effectiveCostPerDollar = 1 - totalAnnualSavings / contribution;

  return {
    federalTaxSavings: Math.round(federalTaxSavings),
    stateTaxSavings: Math.round(stateTaxSavings),
    ficaSavings: Math.round(ficaSavings),
    totalAnnualSavings: Math.round(totalAnnualSavings),
    effectiveCostPerDollar: Math.round(effectiveCostPerDollar * 100) / 100,
  };
}

/**
 * Calculate recommended contribution amount
 */
function calculateRecommendedContribution(
  input: HSAInput,
  limits: HSAContributionLimits
): number {
  const expectedExpenses = input.expectedExpenses || 0;

  // Strategy: Maximize if income supports it
  const affordableContribution = input.annualIncome * 0.1; // 10% of income as max

  // At minimum, cover expected expenses
  const minRecommended = Math.max(expectedExpenses, limits.employerContribution);

  // Recommend max if affordable
  if (affordableContribution >= limits.totalLimit) {
    return limits.maxEmployeeContribution;
  }

  // Otherwise recommend minimum of expected expenses or affordable amount
  const recommended = Math.min(
    limits.maxEmployeeContribution,
    Math.max(minRecommended, affordableContribution) - limits.employerContribution
  );

  return Math.round(Math.max(0, recommended));
}

/**
 * Generate multi-year projections
 */
function generateProjections(
  input: HSAInput,
  annualContribution: number
): HSAProjection[] {
  const projections: HSAProjection[] = [];
  const years = input.yearsToRetirement || 20;
  const expectedReturn = input.expectedReturn || 0.07;
  const healthcareInflation = input.healthcareInflation || 0.05;
  const employerContribution = input.employerContribution || 0;

  let balance = input.currentBalance || 0;
  let expenses = input.expectedExpenses || 0;

  for (let year = 1; year <= years; year++) {
    const age = input.age + year;
    const beginningBalance = balance;

    // Total contribution (employee + employer)
    const totalContribution = annualContribution + employerContribution;

    // Investment growth on beginning balance
    const investmentGrowth = beginningBalance * expectedReturn;

    // Adjust expenses for inflation
    expenses = year === 1 ? expenses : expenses * (1 + healthcareInflation);

    // Pay expenses from HSA
    const expensesPaid = Math.min(
      beginningBalance + totalContribution + investmentGrowth,
      expenses
    );

    // Ending balance
    balance =
      beginningBalance + totalContribution + investmentGrowth - expensesPaid;

    projections.push({
      year,
      age,
      beginningBalance: Math.round(beginningBalance),
      contribution: Math.round(totalContribution),
      investmentGrowth: Math.round(investmentGrowth),
      expensesPaid: Math.round(expensesPaid),
      endingBalance: Math.round(balance),
    });
  }

  return projections;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  input: HSAInput,
  limits: HSAContributionLimits,
  taxSavings: HSATaxSavings
): string[] {
  const recommendations: string[] = [];

  // Max contribution recommendation
  if (input.annualIncome >= 50000) {
    recommendations.push(
      `Maximize your HSA contribution to $${limits.totalLimit}/year to get the full tax benefit of $${taxSavings.totalAnnualSavings} in annual savings.`
    );
  }

  // Catch-up contribution
  if (input.age >= 55) {
    recommendations.push(
      `You're eligible for the $${HSA_LIMITS_2024.catchUp} catch-up contribution. Take advantage of this additional tax-advantaged savings.`
    );
  } else if (input.age >= 50) {
    recommendations.push(
      `In ${55 - input.age} years, you'll be eligible for an additional $${HSA_LIMITS_2024.catchUp} catch-up contribution.`
    );
  }

  // Investment recommendation
  if ((input.currentBalance || 0) < 5000) {
    recommendations.push(
      'Consider building your HSA balance to at least $5,000 before investing. Keep some cash for near-term expenses.'
    );
  } else {
    recommendations.push(
      'With a healthy balance, consider investing HSA funds for long-term growth. HSA investments grow tax-free.'
    );
  }

  // HDHP validation
  if (input.deductible < HDHP_REQUIREMENTS_2024.minDeductible[input.coverageType]) {
    recommendations.push(
      `Warning: Your deductible ($${input.deductible}) is below the HDHP minimum ($${HDHP_REQUIREMENTS_2024.minDeductible[input.coverageType]}). Verify your plan qualifies.`
    );
  }

  // Tax strategy
  if (input.federalTaxRate >= 0.24) {
    recommendations.push(
      'At your tax bracket, HSA contributions provide significant tax savings. Consider maximizing contributions before other investment accounts.'
    );
  }

  // State tax note
  if (!input.stateTaxRate || input.stateTaxRate === 0) {
    recommendations.push(
      'Note: Some states (CA, NJ) do not recognize HSA tax benefits. Check your state tax laws.'
    );
  }

  // Expense strategy
  if ((input.expectedExpenses || 0) < limits.totalLimit) {
    recommendations.push(
      'Consider paying medical expenses out-of-pocket and letting your HSA grow tax-free. Save receipts to reimburse yourself years later.'
    );
  }

  return recommendations;
}

/**
 * Compare HSA vs FSA advantages
 */
function compareFSA(): HSAAnalysis['fsaComparison'] {
  return {
    hsaAdvantage: [
      'Funds roll over year to year (no "use it or lose it")',
      'Account stays with you if you change jobs',
      'Can be invested for long-term growth',
      'Triple tax advantage: deduction, growth, and withdrawals',
      'Can be used for Medicare premiums after 65',
      'Catch-up contributions available at age 55',
    ],
    fsaAdvantage: [
      'Available with any health plan (not just HDHP)',
      'Full amount available on January 1st',
      'Lower deductible plans often available',
      'Good for predictable, high medical expenses',
    ],
  };
}

/**
 * Validate HDHP eligibility
 */
export function validateHDHPEligibility(
  coverageType: 'individual' | 'family',
  deductible: number,
  outOfPocketMax: number
): {
  eligible: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const minDeductible = HDHP_REQUIREMENTS_2024.minDeductible[coverageType];
  const maxOOP = HDHP_REQUIREMENTS_2024.maxOutOfPocket[coverageType];

  if (deductible < minDeductible) {
    issues.push(
      `Deductible ($${deductible}) is below the HDHP minimum ($${minDeductible})`
    );
  }

  if (outOfPocketMax > maxOOP) {
    issues.push(
      `Out-of-pocket maximum ($${outOfPocketMax}) exceeds the HDHP limit ($${maxOOP})`
    );
  }

  return {
    eligible: issues.length === 0,
    issues,
  };
}

/**
 * Calculate contribution per paycheck
 */
export function calculatePaycheckContribution(
  annualContribution: number,
  payPeriodsPerYear: number
): number {
  return Math.ceil(annualContribution / payPeriodsPerYear * 100) / 100;
}

/**
 * Estimate retirement healthcare costs
 */
export function estimateRetirementHealthcareCosts(
  currentAge: number,
  retirementAge: number,
  currentAnnualCosts: number,
  healthcareInflation: number = 0.05
): {
  yearlyEstimates: { age: number; estimatedCost: number }[];
  totalLifetimeCost: number;
} {
  const yearlyEstimates: { age: number; estimatedCost: number }[] = [];
  let totalLifetimeCost = 0;
  const assumedLifeExpectancy = 85;

  for (let age = retirementAge; age <= assumedLifeExpectancy; age++) {
    // Adjust cost for inflation from current age
    const yearsFromNow = age - currentAge;
    const estimatedCost = currentAnnualCosts * Math.pow(1 + healthcareInflation, yearsFromNow);

    yearlyEstimates.push({
      age,
      estimatedCost: Math.round(estimatedCost),
    });

    totalLifetimeCost += estimatedCost;
  }

  return {
    yearlyEstimates,
    totalLifetimeCost: Math.round(totalLifetimeCost),
  };
}

/**
 * Get HSA limits for a given year
 */
export function getHSALimits(
  year: number = 2024
): {
  individual: number;
  family: number;
  catchUp: number;
} {
  // For now, only 2024 limits are available
  // In production, this would fetch from a database or API
  if (year >= 2024) {
    return HSA_LIMITS_2024;
  }

  // Historical limits (simplified)
  const historicalLimits: Record<number, typeof HSA_LIMITS_2024> = {
    2023: { individual: 3850, family: 7750, catchUp: 1000 },
    2022: { individual: 3650, family: 7300, catchUp: 1000 },
    2021: { individual: 3600, family: 7200, catchUp: 1000 },
  };

  return historicalLimits[year] || HSA_LIMITS_2024;
}

/**
 * Calculate tax-equivalent yield
 */
export function calculateTaxEquivalentYield(
  hsaYield: number,
  federalTaxRate: number,
  stateTaxRate: number = 0
): number {
  // HSA growth is tax-free, so equivalent taxable yield is higher
  const combinedRate = federalTaxRate + stateTaxRate;
  return hsaYield / (1 - combinedRate);
}
