/**
 * Job Change Coverage Wizard
 *
 * Helps users compare COBRA continuation coverage vs marketplace options
 * during job transitions. Calculates costs, coverage gaps, and provides
 * recommendations based on individual circumstances.
 */

import { getCostAdjustmentFactor } from '@/lib/geography';

// Types
export interface JobChangeScenario {
  /** Job separation date */
  separationDate: Date;
  /** Current employer premium (employee portion) */
  currentPremium: number;
  /** Full COBRA premium (employer + employee) */
  cobraPremium: number;
  /** Household income for subsidy calculation */
  householdIncome: number;
  /** Household size */
  householdSize: number;
  /** State code for marketplace */
  state: string;
  /** ZIP code for cost adjustment */
  zipCode?: string;
  /** Age of primary applicant */
  age: number;
  /** Ages of additional family members */
  dependentAges?: number[];
  /** Whether user is tobacco user */
  tobaccoUser?: boolean;
  /** Expected medical utilization */
  expectedUtilization: 'low' | 'medium' | 'high';
  /** Has new job offer with coverage */
  hasNewJobOffer?: boolean;
  /** New job start date (if applicable) */
  newJobStartDate?: Date;
  /** New job waiting period in days */
  newJobWaitingPeriod?: number;
  /** Ongoing prescriptions requiring coverage */
  hasOngoingPrescriptions?: boolean;
  /** Current provider relationships to maintain */
  wantsToKeepProviders?: boolean;
}

export interface CoverageOption {
  /** Option type */
  type: 'cobra' | 'marketplace' | 'short-term' | 'gap';
  /** Option name */
  name: string;
  /** Monthly premium */
  monthlyPremium: number;
  /** Annual premium */
  annualPremium: number;
  /** Estimated annual out-of-pocket (including premium) */
  estimatedAnnualCost: number;
  /** Coverage duration in months */
  durationMonths: number;
  /** Start date */
  startDate: Date;
  /** End date */
  endDate: Date;
  /** Key benefits */
  benefits: string[];
  /** Key drawbacks */
  drawbacks: string[];
  /** Provider network compatibility */
  networkCompatibility: 'same' | 'different' | 'varies';
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high';
}

export interface JobChangeAnalysis {
  /** All coverage options analyzed */
  options: CoverageOption[];
  /** Recommended option */
  recommendedOption: CoverageOption;
  /** Recommendation reasoning */
  reasoning: string[];
  /** Coverage gap warning (if any) */
  coverageGapWarning?: string;
  /** Special enrollment period info */
  sepInfo: {
    deadline: Date;
    daysRemaining: number;
    qualifyingEvent: string;
  };
  /** Key dates timeline */
  timeline: TimelineEvent[];
  /** Cost comparison summary */
  costComparison: {
    cobraTotal: number;
    marketplaceTotal: number;
    savings: number;
    savingsPercent: number;
  };
  /** Subsidy eligibility */
  subsidyInfo?: {
    eligible: boolean;
    estimatedMonthlySubsidy: number;
    estimatedAnnualSubsidy: number;
    fpl: number;
    fplPercent: number;
  };
}

export interface TimelineEvent {
  date: Date;
  event: string;
  action: string;
  urgent: boolean;
}

// 2024 Federal Poverty Levels (annual)
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

// Additional person above 8
const FPL_ADDITIONAL_PERSON = 5140;

/**
 * Analyze job change coverage options
 */
export function analyzeJobChange(scenario: JobChangeScenario): JobChangeAnalysis {
  const options: CoverageOption[] = [];
  const timeline: TimelineEvent[] = [];
  const reasoning: string[] = [];

  // Calculate key dates
  const sepDeadline = new Date(scenario.separationDate);
  sepDeadline.setDate(sepDeadline.getDate() + 60); // 60-day SEP window

  const cobraDeadline = new Date(scenario.separationDate);
  cobraDeadline.setDate(cobraDeadline.getDate() + 60); // 60 days to elect COBRA

  const today = new Date();
  const daysUntilSepDeadline = Math.ceil(
    (sepDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Add timeline events
  timeline.push({
    date: scenario.separationDate,
    event: 'Job Separation',
    action: 'Coverage ends at end of month (typically)',
    urgent: false,
  });

  timeline.push({
    date: cobraDeadline,
    event: 'COBRA Election Deadline',
    action: 'Must elect COBRA within 60 days of separation',
    urgent: daysUntilSepDeadline < 14,
  });

  timeline.push({
    date: sepDeadline,
    event: 'Marketplace SEP Deadline',
    action: 'Must enroll in marketplace plan within 60 days',
    urgent: daysUntilSepDeadline < 14,
  });

  // Calculate subsidy eligibility
  const fpl = getFPL(scenario.householdSize);
  const fplPercent = (scenario.householdIncome / fpl) * 100;
  const subsidyEligible = fplPercent >= 100 && fplPercent <= 400;

  // Estimate marketplace premium
  const baseMarketplacePremium = estimateMarketplacePremium(
    scenario.age,
    scenario.state,
    scenario.zipCode,
    scenario.dependentAges
  );

  // Calculate subsidy
  let monthlySubsidy = 0;
  if (subsidyEligible) {
    monthlySubsidy = calculatePremiumSubsidy(
      scenario.householdIncome,
      scenario.householdSize,
      baseMarketplacePremium
    );
  }

  const subsidizedPremium = Math.max(0, baseMarketplacePremium - monthlySubsidy);

  // Calculate coverage duration
  let coverageDurationMonths = 12; // Default to full year
  if (scenario.hasNewJobOffer && scenario.newJobStartDate) {
    const waitingEndDate = new Date(scenario.newJobStartDate);
    waitingEndDate.setDate(
      waitingEndDate.getDate() + (scenario.newJobWaitingPeriod || 0)
    );
    const monthsUntilNewCoverage = Math.ceil(
      (waitingEndDate.getTime() - scenario.separationDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    );
    coverageDurationMonths = Math.max(1, Math.min(12, monthsUntilNewCoverage));

    timeline.push({
      date: scenario.newJobStartDate,
      event: 'New Job Start',
      action: 'Begin new employment',
      urgent: false,
    });

    if (scenario.newJobWaitingPeriod && scenario.newJobWaitingPeriod > 0) {
      timeline.push({
        date: waitingEndDate,
        event: 'New Coverage Begins',
        action: 'Employer coverage becomes effective',
        urgent: false,
      });
    }
  }

  // Cost adjustment for location
  const costFactor = getCostAdjustmentFactor(scenario.state, scenario.zipCode);

  // Option 1: COBRA
  const cobraTotal = scenario.cobraPremium * 1.02; // COBRA is full premium + 2% admin
  const cobraEndDate = new Date(scenario.separationDate);
  cobraEndDate.setMonth(cobraEndDate.getMonth() + Math.min(18, coverageDurationMonths));

  const cobraOOP = estimateOOP(scenario.expectedUtilization, costFactor, 'ppo');

  options.push({
    type: 'cobra',
    name: 'COBRA Continuation',
    monthlyPremium: Math.round(cobraTotal),
    annualPremium: Math.round(cobraTotal * 12),
    estimatedAnnualCost: Math.round(cobraTotal * coverageDurationMonths + cobraOOP * (coverageDurationMonths / 12)),
    durationMonths: Math.min(18, coverageDurationMonths),
    startDate: scenario.separationDate,
    endDate: cobraEndDate,
    benefits: [
      'Keep same doctors and network',
      'No gap in coverage (retroactive to separation)',
      'Same plan benefits you know',
      'Pre-existing conditions fully covered',
    ],
    drawbacks: [
      `High cost: $${Math.round(cobraTotal)}/month (full premium + 2%)`,
      'Must pay entire premium yourself',
      'Limited to 18 months (36 for certain events)',
      'Payment due within 45 days of election',
    ],
    networkCompatibility: 'same',
    riskLevel: 'low',
  });

  // Option 2: Marketplace
  const marketplaceEndDate = new Date(scenario.separationDate);
  marketplaceEndDate.setMonth(marketplaceEndDate.getMonth() + coverageDurationMonths);

  const marketplaceOOP = estimateOOP(scenario.expectedUtilization, costFactor, 'marketplace');

  options.push({
    type: 'marketplace',
    name: subsidyEligible ? 'Marketplace with Subsidy' : 'Marketplace (Unsubsidized)',
    monthlyPremium: Math.round(subsidizedPremium),
    annualPremium: Math.round(subsidizedPremium * 12),
    estimatedAnnualCost: Math.round(subsidizedPremium * coverageDurationMonths + marketplaceOOP * (coverageDurationMonths / 12)),
    durationMonths: coverageDurationMonths,
    startDate: new Date(scenario.separationDate.getFullYear(), scenario.separationDate.getMonth() + 1, 1),
    endDate: marketplaceEndDate,
    benefits: [
      subsidyEligible
        ? `Premium subsidy available: ~$${Math.round(monthlySubsidy)}/month`
        : 'Full plan selection available',
      'Multiple plan options (Bronze to Platinum)',
      'Can switch plans during Open Enrollment',
      'Cost-sharing reductions if income qualifies',
    ],
    drawbacks: [
      'May need to change doctors/network',
      'Coverage starts 1st of next month (potential gap)',
      'Must re-enroll annually during Open Enrollment',
      subsidyEligible ? 'Must reconcile subsidy at tax time' : 'No subsidy available at your income level',
    ],
    networkCompatibility: 'different',
    riskLevel: 'medium',
  });

  // Option 3: Short-term health insurance (if gap needed)
  if (coverageDurationMonths <= 3) {
    const shortTermPremium = estimateShortTermPremium(scenario.age, scenario.state);

    options.push({
      type: 'short-term',
      name: 'Short-Term Health Insurance',
      monthlyPremium: Math.round(shortTermPremium),
      annualPremium: Math.round(shortTermPremium * coverageDurationMonths),
      estimatedAnnualCost: Math.round(shortTermPremium * coverageDurationMonths + 5000), // High OOP risk
      durationMonths: coverageDurationMonths,
      startDate: scenario.separationDate,
      endDate: marketplaceEndDate,
      benefits: [
        'Lower premiums than COBRA/marketplace',
        'Quick enrollment (can start immediately)',
        'Good for healthy individuals',
      ],
      drawbacks: [
        'Limited coverage (may exclude pre-existing)',
        'Not ACA-compliant (no essential benefits guarantee)',
        'May have lifetime/annual caps',
        'Not available in all states',
      ],
      networkCompatibility: 'varies',
      riskLevel: 'high',
    });
  }

  // Calculate cost comparison
  const cobraTotalCost = Math.round(cobraTotal * coverageDurationMonths);
  const marketplaceTotalCost = Math.round(subsidizedPremium * coverageDurationMonths);
  const savings = cobraTotalCost - marketplaceTotalCost;
  const savingsPercent = cobraTotalCost > 0 ? Math.round((savings / cobraTotalCost) * 100) : 0;

  // Determine recommendation
  // COBRA is always the first option added, so we can safely reference it
  const cobraOption = options.find(o => o.type === 'cobra')!;
  const marketplaceOption = options.find(o => o.type === 'marketplace')!;
  let recommendedOption: CoverageOption;

  if (scenario.wantsToKeepProviders && scenario.hasOngoingPrescriptions) {
    // Prioritize continuity of care
    recommendedOption = cobraOption;
    reasoning.push('COBRA recommended to maintain current provider relationships and prescription coverage.');
  } else if (savings > 200 * coverageDurationMonths && subsidyEligible) {
    // Significant savings with marketplace
    recommendedOption = marketplaceOption;
    reasoning.push(`Marketplace saves ~$${savings} over ${coverageDurationMonths} months with subsidies.`);
  } else if (coverageDurationMonths <= 2 && !scenario.hasOngoingPrescriptions) {
    // Short gap, consider short-term or COBRA
    recommendedOption = cobraOption;
    reasoning.push('COBRA recommended for short coverage gaps to avoid network disruption.');
  } else {
    // Default comparison
    if (marketplaceTotalCost < cobraTotalCost * 0.8) {
      recommendedOption = marketplaceOption;
      reasoning.push('Marketplace is significantly more affordable for your situation.');
    } else {
      recommendedOption = cobraOption;
      reasoning.push('COBRA provides better value considering continuity of care.');
    }
  }

  // Add income-based reasoning
  if (fplPercent < 100) {
    reasoning.push('Income below poverty level - may qualify for Medicaid. Check state eligibility.');
  } else if (fplPercent <= 150) {
    reasoning.push('Low income qualifies for maximum subsidies and cost-sharing reductions.');
  } else if (fplPercent > 400) {
    reasoning.push('Income above 400% FPL - no premium subsidies available.');
  }

  // Coverage gap warning
  let coverageGapWarning: string | undefined;
  const marketplaceStartDate = options.find(o => o.type === 'marketplace')?.startDate;
  if (marketplaceStartDate && marketplaceStartDate > scenario.separationDate) {
    const gapDays = Math.ceil(
      (marketplaceStartDate.getTime() - scenario.separationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (gapDays > 0) {
      coverageGapWarning = `Warning: Marketplace coverage starts ${gapDays} days after separation. Consider COBRA to bridge the gap (you can enroll retroactively within 60 days).`;
    }
  }

  // Sort timeline by date
  timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    options,
    recommendedOption,
    reasoning,
    coverageGapWarning,
    sepInfo: {
      deadline: sepDeadline,
      daysRemaining: Math.max(0, daysUntilSepDeadline),
      qualifyingEvent: 'Loss of job-based coverage',
    },
    timeline,
    costComparison: {
      cobraTotal: cobraTotalCost,
      marketplaceTotal: marketplaceTotalCost,
      savings,
      savingsPercent,
    },
    subsidyInfo: {
      eligible: subsidyEligible,
      estimatedMonthlySubsidy: Math.round(monthlySubsidy),
      estimatedAnnualSubsidy: Math.round(monthlySubsidy * 12),
      fpl,
      fplPercent: Math.round(fplPercent),
    },
  };
}

/**
 * Get Federal Poverty Level for household size
 */
function getFPL(householdSize: number): number {
  if (householdSize <= 8) {
    const fpl = FPL_2024[householdSize];
    return fpl !== undefined ? fpl : FPL_2024[1]!;
  }
  return FPL_2024[8]! + FPL_ADDITIONAL_PERSON * (householdSize - 8);
}

/**
 * Estimate marketplace premium based on age and location
 * Uses simplified age-rating bands
 */
function estimateMarketplacePremium(
  age: number,
  state: string,
  zipCode?: string,
  dependentAges?: number[]
): number {
  // Base premium for 40-year-old (benchmark)
  const basePremium = 450;

  // Age factor (ACA allows 3:1 ratio max)
  let ageFactor = 1.0;
  if (age < 21) ageFactor = 0.635;
  else if (age <= 24) ageFactor = 0.635 + (age - 21) * 0.03;
  else if (age <= 29) ageFactor = 0.725 + (age - 25) * 0.02;
  else if (age <= 34) ageFactor = 0.825 + (age - 30) * 0.02;
  else if (age <= 39) ageFactor = 0.925 + (age - 35) * 0.015;
  else if (age <= 44) ageFactor = 1.0 + (age - 40) * 0.02;
  else if (age <= 49) ageFactor = 1.1 + (age - 45) * 0.03;
  else if (age <= 54) ageFactor = 1.25 + (age - 50) * 0.04;
  else if (age <= 59) ageFactor = 1.45 + (age - 55) * 0.05;
  else ageFactor = 1.7 + (Math.min(age, 64) - 60) * 0.06;

  // Location factor
  const locationFactor = getCostAdjustmentFactor(state, zipCode);

  // Calculate primary member premium
  let totalPremium = basePremium * ageFactor * locationFactor;

  // Add dependents
  if (dependentAges && dependentAges.length > 0) {
    for (const depAge of dependentAges) {
      let depFactor = 0.635; // Child rate
      if (depAge >= 21) {
        depFactor = depAge < 40 ? 0.8 : 1.0;
      }
      totalPremium += basePremium * depFactor * locationFactor * 0.7; // Dependent discount
    }
  }

  return totalPremium;
}

/**
 * Calculate premium tax credit (subsidy)
 */
function calculatePremiumSubsidy(
  income: number,
  householdSize: number,
  benchmarkPremium: number
): number {
  const fpl = getFPL(householdSize);
  const fplPercent = (income / fpl) * 100;

  // Expected contribution percentages (2024 ACA rates)
  let expectedContributionPercent: number;

  if (fplPercent <= 150) {
    expectedContributionPercent = 0;
  } else if (fplPercent <= 200) {
    expectedContributionPercent = 0 + (fplPercent - 150) * 0.04;
  } else if (fplPercent <= 250) {
    expectedContributionPercent = 2 + (fplPercent - 200) * 0.04;
  } else if (fplPercent <= 300) {
    expectedContributionPercent = 4 + (fplPercent - 250) * 0.04;
  } else if (fplPercent <= 400) {
    expectedContributionPercent = 6 + (fplPercent - 300) * 0.025;
  } else {
    return 0; // No subsidy above 400% FPL
  }

  const monthlyContribution = (income * (expectedContributionPercent / 100)) / 12;
  const subsidy = benchmarkPremium - monthlyContribution;

  return Math.max(0, subsidy);
}

/**
 * Estimate out-of-pocket costs based on utilization
 */
function estimateOOP(
  utilization: 'low' | 'medium' | 'high',
  costFactor: number,
  planType: 'ppo' | 'marketplace'
): number {
  const baseOOP = {
    low: { ppo: 500, marketplace: 800 },
    medium: { ppo: 2500, marketplace: 3500 },
    high: { ppo: 5000, marketplace: 6500 },
  };

  return baseOOP[utilization][planType] * costFactor;
}

/**
 * Estimate short-term health insurance premium
 */
function estimateShortTermPremium(age: number, state: string): number {
  // Short-term is not age-rated under ACA rules
  // But varies significantly by state and health status
  let basePremium = 150;

  // Age adjustment (not regulated like ACA)
  if (age < 30) basePremium = 100;
  else if (age < 40) basePremium = 130;
  else if (age < 50) basePremium = 180;
  else if (age < 60) basePremium = 250;
  else basePremium = 350;

  // Some states restrict or ban short-term insurance
  const restrictedStates = ['CA', 'NY', 'NJ', 'MA', 'VT', 'RI'];
  if (restrictedStates.includes(state.toUpperCase())) {
    return 0; // Not available
  }

  return basePremium;
}

/**
 * Quick comparison helper
 */
export function quickCOBRAvsMarketplace(
  cobraPremium: number,
  age: number,
  income: number,
  householdSize: number,
  state: string
): {
  cobraMonthlyCost: number;
  marketplaceMonthlyCost: number;
  recommendation: 'cobra' | 'marketplace';
  monthlySavings: number;
} {
  const cobraCost = cobraPremium * 1.02;
  const marketplacePremium = estimateMarketplacePremium(age, state);
  const subsidy = calculatePremiumSubsidy(income, householdSize, marketplacePremium);
  const marketplaceCost = Math.max(0, marketplacePremium - subsidy);

  return {
    cobraMonthlyCost: Math.round(cobraCost),
    marketplaceMonthlyCost: Math.round(marketplaceCost),
    recommendation: marketplaceCost < cobraCost * 0.8 ? 'marketplace' : 'cobra',
    monthlySavings: Math.round(cobraCost - marketplaceCost),
  };
}
