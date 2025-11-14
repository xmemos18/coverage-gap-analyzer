/**
 * Advanced ACA Subsidy Calculator
 * Professional-grade MAGI, Premium Tax Credit, and CSR calculations
 *
 * Implements:
 * - MAGI (Modified Adjusted Gross Income) calculation guidance
 * - IRA 2022 enhanced Premium Tax Credits (no 400% cliff)
 * - Cost-Sharing Reductions (CSR) eligibility
 * - Medicaid expansion detection
 * - Coverage gap identification
 * - Family glitch calculation (post-2023 fix)
 * - Tax reconciliation warnings
 */

/**
 * Federal Poverty Level (FPL) Data
 * Source: HHS Poverty Guidelines (updated annually)
 */
export const FPL_2025 = {
  // Contiguous 48 states + DC
  BASE: 15060,
  PER_ADDITIONAL_PERSON: 5450,

  // Alaska (higher)
  ALASKA_BASE: 18840,
  ALASKA_PER_ADDITIONAL: 6810,

  // Hawaii (higher)
  HAWAII_BASE: 17310,
  HAWAII_PER_ADDITIONAL: 6270,
};

/**
 * Calculate Federal Poverty Level for household
 */
export function calculateFPL(householdSize: number, state?: string): number {
  const size = Math.max(1, Math.floor(householdSize));

  if (state === 'AK') {
    return FPL_2025.ALASKA_BASE + (size - 1) * FPL_2025.ALASKA_PER_ADDITIONAL;
  }

  if (state === 'HI') {
    return FPL_2025.HAWAII_BASE + (size - 1) * FPL_2025.HAWAII_PER_ADDITIONAL;
  }

  return FPL_2025.BASE + (size - 1) * FPL_2025.PER_ADDITIONAL_PERSON;
}

/**
 * Medicaid Expansion States (as of 2025)
 * 41 states + DC have expanded Medicaid
 */
export const MEDICAID_EXPANSION_STATES = new Set([
  'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN',
  'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND',
  'OH', 'OR', 'PA', 'RI', 'SD', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI',
]);

/**
 * Non-expansion states (10 states as of 2025)
 * These states have the "coverage gap"
 */
export const NON_EXPANSION_STATES = new Set([
  'AL', 'FL', 'GA', 'KS', 'MS', 'SC', 'TN', 'TX', 'WY',
]);

/**
 * IRA 2022 Enhanced Premium Tax Credit Table
 * Source: Inflation Reduction Act (removes 400% FPL cliff, lowers premiums)
 *
 * Table shows % of income that household must contribute toward benchmark plan
 */
export const PTC_AFFORDABILITY_TABLE_2025 = [
  { fplMin: 0,   fplMax: 150,  percentage: 0.00 },   // 0% (free after subsidy)
  { fplMin: 150, fplMax: 200,  percentage: 0.00 },   // 0-2% sliding scale (simplified to 0%)
  { fplMin: 200, fplMax: 250,  percentage: 0.02 },   // 2-4% sliding scale (use midpoint)
  { fplMin: 250, fplMax: 300,  percentage: 0.04 },   // 4-6% sliding scale
  { fplMin: 300, fplMax: 350,  percentage: 0.06 },   // 6-8% sliding scale
  { fplMin: 350, fplMax: 400,  percentage: 0.08 },   // 8-8.5% sliding scale
  { fplMin: 400, fplMax: 99999, percentage: 0.085 }, // 8.5% (no cliff, continues above 400%)
];

/**
 * Get affordability percentage based on FPL percentage
 * Uses IRA 2022 enhanced table (no 400% cliff)
 */
export function getAffordabilityPercentage(fplPercentage: number): number {
  // Handle edge case: 0% FPL
  if (fplPercentage <= 0) {
    return 0.00;
  }

  for (const row of PTC_AFFORDABILITY_TABLE_2025) {
    if (fplPercentage > row.fplMin && fplPercentage <= row.fplMax) {
      return row.percentage;
    }
  }

  // Above 400% FPL, capped at 8.5%
  return 0.085;
}

/**
 * Cost-Sharing Reduction (CSR) Levels
 * Silver plans with enhanced benefits for low-income households
 */
export type CSRLevel = '94%' | '87%' | '73%' | 'None';

/**
 * Determine CSR eligibility
 * CSR only available for Silver plans
 */
export function getCSRLevel(fplPercentage: number, metalTier?: string): CSRLevel {
  // CSR only for Silver plans
  if (metalTier && metalTier !== 'Silver') {
    return 'None';
  }

  if (fplPercentage <= 150) {
    return '94%'; // 94% actuarial value (vs 70% standard Silver)
  }

  if (fplPercentage <= 200) {
    return '87%'; // 87% actuarial value
  }

  if (fplPercentage <= 250) {
    return '73%'; // 73% actuarial value
  }

  return 'None'; // Standard Silver (70% AV)
}

/**
 * MAGI (Modified Adjusted Gross Income) Calculator
 * Provides guidance on calculating MAGI from various income sources
 */
export interface MAGIComponents {
  wages: number;                    // W-2 wages, salaries
  selfEmploymentIncome: number;     // Net self-employment income
  unemploymentBenefits: number;     // Unemployment compensation
  socialSecurityTaxable: number;    // Taxable portion of Social Security
  investmentIncome: number;         // Interest, dividends, capital gains
  rentalIncome: number;             // Net rental income
  alimonyReceived: number;          // Alimony received (pre-2019 divorces)
  otherIncome: number;              // Other taxable income

  // Add-backs for MAGI
  taxExemptInterest: number;        // Municipal bond interest
  foreignIncomeExclusion: number;   // Foreign earned income exclusion
  nonTaxableSocialSecurity: number; // Non-taxable portion of SS

  // Deductions that reduce MAGI
  studentLoanInterest: number;      // Student loan interest deduction (max $2,500)
  alimonyPaid: number;              // Alimony paid (pre-2019 divorces)
  iraContribution: number;          // Traditional IRA deduction
  healthSavingsAccount: number;     // HSA contribution
  selfEmploymentTax: number;        // 1/2 of self-employment tax
}

/**
 * Calculate MAGI from income components
 */
export function calculateMAGI(components: Partial<MAGIComponents>): number {
  // Sum all income sources
  const totalIncome =
    (components.wages ?? 0) +
    (components.selfEmploymentIncome ?? 0) +
    (components.unemploymentBenefits ?? 0) +
    (components.socialSecurityTaxable ?? 0) +
    (components.investmentIncome ?? 0) +
    (components.rentalIncome ?? 0) +
    (components.alimonyReceived ?? 0) +
    (components.otherIncome ?? 0);

  // Add-backs for MAGI
  const addBacks =
    (components.taxExemptInterest ?? 0) +
    (components.foreignIncomeExclusion ?? 0) +
    (components.nonTaxableSocialSecurity ?? 0);

  // Deductions
  const deductions =
    (components.studentLoanInterest ?? 0) +
    (components.alimonyPaid ?? 0) +
    (components.iraContribution ?? 0) +
    (components.healthSavingsAccount ?? 0) +
    (components.selfEmploymentTax ?? 0);

  return Math.max(0, totalIncome + addBacks - deductions);
}

/**
 * Subsidy Calculation Result
 */
export interface SubsidyCalculation {
  // Income analysis
  magi: number;
  fpl: number;
  fplPercentage: number;
  householdSize: number;

  // Eligibility
  medicaidEligible: boolean;
  medicaidExpansionState: boolean;
  inCoverageGap: boolean;          // In gap in non-expansion state
  ptcEligible: boolean;            // Premium Tax Credit eligible
  csrLevel: CSRLevel;

  // Premium Tax Credit
  benchmarkPremium: number;        // SLCSP cost
  maxContribution: number;         // Max household must pay
  monthlyPTC: number;              // Monthly tax credit
  annualPTC: number;               // Annual tax credit
  affordabilityPercentage: number; // % of income for premiums

  // Cost after subsidy
  afterSubsidyCostLow: number;
  afterSubsidyCostHigh: number;

  // Warnings and guidance
  warnings: string[];
  recommendations: string[];
}

/**
 * Advanced Subsidy Calculator
 *
 * @param magi - Modified Adjusted Gross Income (annual)
 * @param householdSize - Number of people in tax household
 * @param state - Primary state (for FPL and Medicaid)
 * @param slcspPremium - Second Lowest Cost Silver Plan premium (monthly)
 * @param metalTier - Plan metal tier (for CSR calculation)
 * @returns Complete subsidy analysis
 */
export function calculatePremiumTaxCredit(
  magi: number,
  householdSize: number,
  state: string,
  slcspPremium: number,
  metalTier?: string
): SubsidyCalculation {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Calculate FPL
  const fpl = calculateFPL(householdSize, state);
  const fplPercentage = (magi / fpl) * 100;

  // Determine Medicaid eligibility
  const medicaidExpansionState = MEDICAID_EXPANSION_STATES.has(state?.toUpperCase());
  const medicaidEligible = medicaidExpansionState && fplPercentage < 138;

  // Coverage gap detection (non-expansion state, income 100-138% FPL)
  // People in this range don't qualify for Medicaid OR PTC
  const inCoverageGap = !medicaidExpansionState && fplPercentage >= 100 && fplPercentage < 138;

  // Premium Tax Credit eligibility
  // PTC available for income 138%+ FPL (or 100%+ in non-expansion if above gap)
  // In practice, PTC is designed to start at 138% FPL in all states
  const ptcEligible = fplPercentage >= 138 && !medicaidEligible;

  // CSR level
  const csrLevel = getCSRLevel(fplPercentage, metalTier);

  // Calculate affordability percentage
  const affordabilityPercentage = getAffordabilityPercentage(fplPercentage);

  // Calculate PTC
  const maxContribution = (magi / 12) * affordabilityPercentage;
  const monthlyPTC = ptcEligible ? Math.max(0, slcspPremium - maxContribution) : 0;
  const annualPTC = monthlyPTC * 12;

  // After-subsidy cost
  const afterSubsidyCostLow = Math.max(0, slcspPremium * 0.75 - monthlyPTC); // Bronze approximation
  const afterSubsidyCostHigh = Math.max(0, slcspPremium * 1.30 - monthlyPTC); // Gold approximation

  // Generate warnings
  if (fplPercentage > 400) {
    warnings.push(
      `Your income exceeds 400% FPL ($${Math.round(fpl * 4).toLocaleString()}), but you still qualify for subsidies capped at 8.5% of income (IRA 2022 enhancement).`
    );
  }

  if (inCoverageGap) {
    warnings.push(
      `You're in the "coverage gap" in ${state}. Your income is too high for Medicaid but below subsidy threshold. Consider: ` +
      `(1) Increasing income slightly to qualify for subsidies, (2) Checking traditional Medicaid eligibility, or (3) Community health centers.`
    );
  }

  if (monthlyPTC > slcspPremium * 0.9) {
    warnings.push(
      `Your subsidy is very high (covers ${Math.round(monthlyPTC / slcspPremium * 100)}% of benchmark premium). ` +
      `Consider Silver plans with CSR for enhanced benefits at little to no cost.`
    );
  }

  if (fplPercentage > 250 && fplPercentage < 300) {
    warnings.push(
      `You're close to losing CSR eligibility at 250% FPL. Consider timing income (bonuses, IRA contributions) to maximize benefits.`
    );
  }

  // Generate recommendations
  if (csrLevel !== 'None') {
    recommendations.push(
      `✨ You qualify for Cost-Sharing Reductions (CSR ${csrLevel})! Choose a Silver plan to get enhanced benefits ` +
      `with lower deductibles and out-of-pocket costs. This is often better than Bronze even though Bronze has lower premiums.`
    );
  }

  if (medicaidEligible) {
    recommendations.push(
      `🎉 You likely qualify for Medicaid in ${state}! This provides free or low-cost coverage. ` +
      `Apply at your state's Medicaid office or through the marketplace.`
    );
  }

  if (ptcEligible && monthlyPTC > 200) {
    recommendations.push(
      `💰 Your estimated monthly subsidy is $${Math.round(monthlyPTC)}. ` +
      `This significantly reduces your costs - compare marketplace plans to see your actual after-subsidy price.`
    );
  }

  if (fplPercentage <= 200 && ptcEligible) {
    recommendations.push(
      `You qualify for free or nearly-free coverage. Your max contribution is ${(affordabilityPercentage * 100).toFixed(1)}% of income ` +
      `($${Math.round(maxContribution)}/month). Look for Silver CSR plans.`
    );
  }

  // High subsidy alert
  if (ptcEligible && monthlyPTC > 0 && fplPercentage <= 200) {
    warnings.push(
      `Your subsidy is very high (${Math.round(monthlyPTC / slcspPremium * 100)}% of benchmark premium). ` +
      `Make sure to report income changes to avoid tax reconciliation issues.`
    );
  }

  if (!ptcEligible && !medicaidEligible && !inCoverageGap) {
    recommendations.push(
      `Your income is above subsidy limits. Consider: (1) Employer coverage, (2) High-deductible plans with HSA ` +
      `for tax savings, (3) Professional association plans.`
    );
  }

  return {
    magi,
    fpl,
    fplPercentage: Math.round(fplPercentage * 10) / 10,
    householdSize,
    medicaidEligible,
    medicaidExpansionState,
    inCoverageGap,
    ptcEligible,
    csrLevel,
    benchmarkPremium: slcspPremium,
    maxContribution: Math.round(maxContribution * 100) / 100,
    monthlyPTC: Math.round(monthlyPTC * 100) / 100,
    annualPTC: Math.round(annualPTC * 100) / 100,
    affordabilityPercentage,
    afterSubsidyCostLow: Math.round(afterSubsidyCostLow * 100) / 100,
    afterSubsidyCostHigh: Math.round(afterSubsidyCostHigh * 100) / 100,
    warnings,
    recommendations,
  };
}

/**
 * Family Glitch Calculator
 * Post-2023 fix: Family members can get subsidies if employer family coverage is unaffordable
 */
export interface FamilyGlitchAnalysis {
  isGlitchFixed: boolean;           // Post-2023, family members can get subsidies
  employerSelfOnlyAffordable: boolean;
  employerFamilyAffordable: boolean;
  familyCanGetSubsidies: boolean;
  employerSelfOnlyCost: number;
  employerFamilyCost: number;
  affordabilityThreshold: number;   // 8.39% of income (2024 rate)
  explanation: string;
}

/**
 * Analyze family glitch scenario
 *
 * @param magi - Household MAGI
 * @param employerSelfOnlyCost - Monthly cost for employee-only coverage
 * @param employerFamilyCost - Monthly cost for family coverage
 * @returns Family glitch analysis
 */
export function analyzeFamilyGlitch(
  magi: number,
  employerSelfOnlyCost: number,
  employerFamilyCost: number
): FamilyGlitchAnalysis {
  const AFFORDABILITY_THRESHOLD_2025 = 0.0839; // 8.39% for 2025 (updated annually)

  const monthlyIncome = magi / 12;
  const affordabilityThreshold = monthlyIncome * AFFORDABILITY_THRESHOLD_2025;

  const employerSelfOnlyAffordable = employerSelfOnlyCost <= affordabilityThreshold;
  const employerFamilyAffordable = employerFamilyCost <= affordabilityThreshold;

  // Post-2023 fix: Family members can get marketplace subsidies if family coverage is unaffordable
  // even if self-only coverage is affordable
  const familyCanGetSubsidies = !employerFamilyAffordable;

  let explanation = '';

  if (employerSelfOnlyAffordable && !employerFamilyAffordable) {
    explanation = `Good news! As of 2023, the "family glitch" is fixed. While your employer self-only coverage ` +
      `is affordable ($${employerSelfOnlyCost}/month ≤ $${Math.round(affordabilityThreshold)}/month), your family ` +
      `coverage is NOT affordable ($${employerFamilyCost}/month > $${Math.round(affordabilityThreshold)}/month). ` +
      `Your family members (spouse/children) CAN get marketplace subsidies while you use employer coverage.`;
  } else if (!employerSelfOnlyAffordable) {
    explanation = `Your employer self-only coverage is unaffordable ($${employerSelfOnlyCost}/month > ` +
      `$${Math.round(affordabilityThreshold)}/month). Your entire household can get marketplace subsidies.`;
  } else {
    explanation = `Your employer family coverage is affordable ($${employerFamilyCost}/month ≤ ` +
      `$${Math.round(affordabilityThreshold)}/month). Your family should use employer coverage and ` +
      `is not eligible for marketplace subsidies.`;
  }

  return {
    isGlitchFixed: true, // Post-2023
    employerSelfOnlyAffordable,
    employerFamilyAffordable,
    familyCanGetSubsidies,
    employerSelfOnlyCost,
    employerFamilyCost,
    affordabilityThreshold: Math.round(affordabilityThreshold * 100) / 100,
    explanation,
  };
}

/**
 * Income estimation helpers for when user provides ranges
 */
export function estimateMAGIFromRange(incomeRange: string): number {
  const ranges: Record<string, number> = {
    'under-30k': 25000,
    '30k-50k': 40000,
    '50k-75k': 62500,
    '75k-100k': 87500,
    '100k-150k': 125000,
    '150k-plus': 175000,
  };

  return ranges[incomeRange] ?? 50000; // Default to median if unknown
}

/**
 * Tax reconciliation warning
 * Premium tax credits are based on projected income and reconciled on tax return
 */
export function getTaxReconciliationWarning(
  projectedMAGI: number,
  actualMAGI: number,
  monthlyPTC: number
): string | null {
  const difference = Math.abs(actualMAGI - projectedMAGI);
  const percentDifference = (difference / projectedMAGI) * 100;

  if (percentDifference < 5) {
    return null; // Small difference, no warning needed
  }

  const annualPTC = monthlyPTC * 12;

  if (actualMAGI > projectedMAGI) {
    // Income higher than projected - may owe money back
    const estimatedOwed = annualPTC * (percentDifference / 100);

    return `⚠️ Tax Reconciliation Alert: Your actual income ($${actualMAGI.toLocaleString()}) is ` +
      `${percentDifference.toFixed(0)}% higher than projected ($${projectedMAGI.toLocaleString()}). ` +
      `You may need to repay approximately $${Math.round(estimatedOwed).toLocaleString()} of your subsidy ` +
      `when you file taxes. Consider increasing your monthly premium contribution to avoid a large tax bill.`;
  } else {
    // Income lower than projected - may get refund
    const estimatedRefund = annualPTC * (percentDifference / 100);

    return `💰 Tax Reconciliation Info: Your actual income ($${actualMAGI.toLocaleString()}) is ` +
      `${percentDifference.toFixed(0)}% lower than projected ($${projectedMAGI.toLocaleString()}). ` +
      `You may receive an additional $${Math.round(estimatedRefund).toLocaleString()} tax credit ` +
      `when you file taxes. Consider updating your marketplace application to get more help now.`;
  }
}
