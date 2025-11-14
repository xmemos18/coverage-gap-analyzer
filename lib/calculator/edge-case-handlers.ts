/**
 * Edge Case Handlers
 *
 * Handles common life events and transitions that affect health insurance:
 * - Age transitions (turning 26, 65)
 * - Special Enrollment Periods (SEPs)
 * - Income volatility and mid-year changes
 * - State moves and relocations
 * - Family size changes
 * - Job transitions
 * - Medicare eligibility
 *
 * Professional-grade handling of real-world scenarios.
 */

// ============================================================================
// TYPES
// ============================================================================

export type SpecialEnrollmentReason =
  | 'loss_of_coverage'
  | 'job_change'
  | 'moved'
  | 'marriage'
  | 'divorce'
  | 'birth_adoption'
  | 'death_in_family'
  | 'gained_citizenship'
  | 'released_incarceration'
  | 'income_change'
  | 'error_or_misconduct';

export interface SpecialEnrollmentPeriod {
  reason: SpecialEnrollmentReason;
  eventDate: Date;
  enrollmentWindowStart: Date;
  enrollmentWindowEnd: Date;
  coverageEffectiveDate: Date;
  daysRemaining: number;
  isActive: boolean;
  urgency: 'low' | 'moderate' | 'high' | 'critical';
  instructions: string[];
  requiredDocumentation: string[];
}

export interface AgeTransitionAnalysis {
  currentAge: number;
  birthDate: Date;
  transitions: Array<{
    age: number;
    date: Date;
    daysUntil: number;
    event: string;
    impacts: string[];
    actions: string[];
    urgency: 'low' | 'moderate' | 'high' | 'critical';
  }>;
  immediateConcerns: string[];
  planningRecommendations: string[];
}

export interface IncomeVolatilityAnalysis {
  currentIncome: number;
  projectedIncome: number;
  incomeChange: number;
  percentageChange: number;

  currentFPL: number;
  projectedFPL: number;

  currentEligibility: {
    medicaid: boolean;
    ptc: boolean;
    monthlyPTC: number;
  };

  projectedEligibility: {
    medicaid: boolean;
    ptc: boolean;
    monthlyPTC: number;
  };

  crossesThreshold: boolean;
  thresholdsCrossed: string[];
  reconciliationRisk: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  estimatedReconciliationImpact: number;

  recommendations: string[];
  warnings: string[];
}

export interface MidYearChangeAnalysis {
  changeType: 'income' | 'household' | 'state' | 'job' | 'other';
  changeDate: Date;
  effectiveDate: Date;
  requiresMarketplaceUpdate: boolean;
  triggersSpecialEnrollment: boolean;
  specialEnrollmentPeriod?: SpecialEnrollmentPeriod;

  beforeChange: {
    monthlyPremium: number;
    monthlyPTC: number;
    netMonthlyPremium: number;
  };

  afterChange: {
    monthlyPremium: number;
    monthlyPTC: number;
    netMonthlyPremium: number;
  };

  annualImpact: number;
  immediateActions: string[];
  timeline: Array<{
    date: Date;
    action: string;
    deadline: boolean;
  }>;
}

// ============================================================================
// SPECIAL ENROLLMENT PERIODS (SEPs)
// ============================================================================

/**
 * Calculate Special Enrollment Period for qualifying life event
 */
export function calculateSpecialEnrollmentPeriod(
  reason: SpecialEnrollmentReason,
  eventDate: Date,
  evaluationDate: Date = new Date()
): SpecialEnrollmentPeriod {
  let enrollmentWindowStart: Date;
  let enrollmentWindowEnd: Date;
  let coverageEffectiveDate: Date;
  let instructions: string[] = [];
  let requiredDocumentation: string[] = [];

  const eventMonth = eventDate.getMonth();
  const eventDay = eventDate.getDate();

  switch (reason) {
    case 'loss_of_coverage':
      // 60 days before to 60 days after loss of coverage
      enrollmentWindowStart = new Date(eventDate);
      enrollmentWindowStart.setDate(enrollmentWindowStart.getDate() - 60);
      enrollmentWindowEnd = new Date(eventDate);
      enrollmentWindowEnd.setDate(enrollmentWindowEnd.getDate() + 60);

      // Coverage effective the first of the month after enrollment
      coverageEffectiveDate = new Date(evaluationDate);
      coverageEffectiveDate.setMonth(coverageEffectiveDate.getMonth() + 1);
      coverageEffectiveDate.setDate(1);

      instructions = [
        'Apply for coverage within 60 days of losing coverage',
        'Coverage will start the first day of the month after you enroll',
        'If you enroll by the 15th, coverage starts the 1st of next month',
      ];

      requiredDocumentation = [
        'Proof of prior coverage (insurance termination letter)',
        'Dates of coverage',
      ];
      break;

    case 'moved':
      // 60 days before to 60 days after move
      enrollmentWindowStart = new Date(eventDate);
      enrollmentWindowStart.setDate(enrollmentWindowStart.getDate() - 60);
      enrollmentWindowEnd = new Date(eventDate);
      enrollmentWindowEnd.setDate(enrollmentWindowEnd.getDate() + 60);

      coverageEffectiveDate = new Date(evaluationDate);
      coverageEffectiveDate.setMonth(coverageEffectiveDate.getMonth() + 1);
      coverageEffectiveDate.setDate(1);

      instructions = [
        'You can change plans when moving to a new coverage area',
        'Must have had qualifying coverage before the move',
        'Can choose any available plan in new area',
      ];

      requiredDocumentation = [
        'Proof of new address (lease, utility bill, etc.)',
        'Previous coverage documentation',
      ];
      break;

    case 'marriage':
    case 'divorce':
      // 60 days after event
      enrollmentWindowStart = eventDate;
      enrollmentWindowEnd = new Date(eventDate);
      enrollmentWindowEnd.setDate(enrollmentWindowEnd.getDate() + 60);

      coverageEffectiveDate = new Date(evaluationDate);
      coverageEffectiveDate.setMonth(coverageEffectiveDate.getMonth() + 1);
      coverageEffectiveDate.setDate(1);

      instructions = [
        `Report ${reason === 'marriage' ? 'marriage' : 'divorce'} to the Marketplace`,
        'Update household size and income',
        'Can add or remove dependents',
      ];

      requiredDocumentation = [
        reason === 'marriage' ? 'Marriage certificate' : 'Divorce decree',
        'Updated income information',
      ];
      break;

    case 'birth_adoption':
      // 60 days after event
      enrollmentWindowStart = eventDate;
      enrollmentWindowEnd = new Date(eventDate);
      enrollmentWindowEnd.setDate(enrollmentWindowEnd.getDate() + 60);

      // Coverage can be retroactive to birth/adoption date
      coverageEffectiveDate = eventDate;

      instructions = [
        'Add new child to your plan within 60 days',
        'Coverage can be retroactive to date of birth/adoption',
        'Update household size for subsidy recalculation',
      ];

      requiredDocumentation = [
        'Birth certificate or adoption papers',
        'Social Security Number (or apply for one)',
      ];
      break;

    case 'job_change':
      // Depends on whether losing coverage or gaining access
      enrollmentWindowStart = new Date(eventDate);
      enrollmentWindowStart.setDate(enrollmentWindowStart.getDate() - 60);
      enrollmentWindowEnd = new Date(eventDate);
      enrollmentWindowEnd.setDate(enrollmentWindowEnd.getDate() + 60);

      coverageEffectiveDate = new Date(evaluationDate);
      coverageEffectiveDate.setMonth(coverageEffectiveDate.getMonth() + 1);
      coverageEffectiveDate.setDate(1);

      instructions = [
        'If losing employer coverage, you have a 60-day SEP',
        'If gaining employer coverage, compare costs carefully',
        'Update income information if salary changes',
      ];

      requiredDocumentation = [
        'Employer coverage termination letter (if applicable)',
        'New job offer letter',
        'Updated income documentation',
      ];
      break;

    case 'income_change':
      // Report within 30 days, but no strict enrollment window
      enrollmentWindowStart = eventDate;
      enrollmentWindowEnd = new Date(eventDate);
      enrollmentWindowEnd.setDate(enrollmentWindowEnd.getDate() + 30);

      coverageEffectiveDate = new Date(evaluationDate);
      coverageEffectiveDate.setMonth(coverageEffectiveDate.getMonth() + 1);
      coverageEffectiveDate.setDate(1);

      instructions = [
        'Report income changes within 30 days',
        'Subsidy amount will be adjusted',
        'Avoid tax reconciliation surprises',
      ];

      requiredDocumentation = [
        'Updated pay stubs',
        'Job loss/gain documentation',
        'Self-employment income records',
      ];
      break;

    default:
      // Standard 60-day window
      enrollmentWindowStart = eventDate;
      enrollmentWindowEnd = new Date(eventDate);
      enrollmentWindowEnd.setDate(enrollmentWindowEnd.getDate() + 60);

      coverageEffectiveDate = new Date(evaluationDate);
      coverageEffectiveDate.setMonth(coverageEffectiveDate.getMonth() + 1);
      coverageEffectiveDate.setDate(1);

      instructions = ['Contact the Marketplace for specific instructions'];
      requiredDocumentation = ['Documentation of qualifying event'];
  }

  const daysRemaining = Math.floor(
    (enrollmentWindowEnd.getTime() - evaluationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isActive = evaluationDate >= enrollmentWindowStart && evaluationDate <= enrollmentWindowEnd;

  let urgency: 'low' | 'moderate' | 'high' | 'critical';
  if (daysRemaining <= 0) {
    urgency = 'critical';
  } else if (daysRemaining <= 7) {
    urgency = 'critical';
  } else if (daysRemaining <= 14) {
    urgency = 'high';
  } else if (daysRemaining <= 30) {
    urgency = 'moderate';
  } else {
    urgency = 'low';
  }

  return {
    reason,
    eventDate,
    enrollmentWindowStart,
    enrollmentWindowEnd,
    coverageEffectiveDate,
    daysRemaining,
    isActive,
    urgency,
    instructions,
    requiredDocumentation,
  };
}

// ============================================================================
// AGE TRANSITIONS
// ============================================================================

/**
 * Analyze upcoming age-based transitions
 */
export function analyzeAgeTransitions(
  birthDate: Date,
  evaluationDate: Date = new Date()
): AgeTransitionAnalysis {
  const currentAge = calculateAge(birthDate, evaluationDate);
  const transitions: AgeTransitionAnalysis['transitions'] = [];
  const immediateConcerns: string[] = [];
  const planningRecommendations: string[] = [];

  // Key ages to check: 26, 30, 40, 50, 60, 64, 65
  const criticalAges = [26, 30, 40, 50, 60, 64, 65];

  criticalAges.forEach(age => {
    if (currentAge < age) {
      const transitionDate = new Date(birthDate);
      transitionDate.setFullYear(transitionDate.getFullYear() + age);

      const daysUntil = Math.floor(
        (transitionDate.getTime() - evaluationDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let event = '';
      let impacts: string[] = [];
      let actions: string[] = [];
      let urgency: 'low' | 'moderate' | 'high' | 'critical' = 'low';

      if (age === 26) {
        event = 'Aging off parent\'s health plan';
        impacts = [
          'No longer eligible for parent\'s health insurance',
          'Must obtain own coverage to avoid gap',
          'Qualifying event for Special Enrollment Period',
        ];
        actions = [
          'Research individual marketplace plans',
          'Check if employer offers coverage',
          'Calculate expected costs and subsidies',
          'Enroll within 60 days of 26th birthday',
        ];

        if (daysUntil <= 60) {
          urgency = 'critical';
          immediateConcerns.push('Approaching age 26 - will lose parent coverage soon');
        } else if (daysUntil <= 180) {
          urgency = 'high';
          planningRecommendations.push('Start planning for age 26 transition');
        }
      } else if (age === 30 || age === 40 || age === 50 || age === 60) {
        event = `Premium increase due to age rating`;
        impacts = [
          `Premiums increase as you age (ACA 3:1 age curve)`,
          `Age ${age} milestone increases monthly premium`,
        ];
        actions = [
          'Review current plan during open enrollment',
          'Compare new premium costs',
          'Adjust coverage tier if needed',
        ];

        if (daysUntil <= 90) {
          urgency = 'moderate';
        }
      } else if (age === 64) {
        event = 'Maximum ACA premium age (3:1 ratio cap)';
        impacts = [
          'Premiums at maximum allowed under ACA (3x base rate)',
          'Medicare eligibility in 1 year',
        ];
        actions = [
          'Start planning for Medicare transition',
          'Learn about Medicare Parts A, B, C, D',
          'Understand Medicare enrollment windows',
        ];

        if (daysUntil <= 180) {
          urgency = 'moderate';
          planningRecommendations.push('Begin Medicare education and planning');
        }
      } else if (age === 65) {
        event = 'Medicare eligibility';
        impacts = [
          'Eligible for Medicare Parts A & B',
          'Must enroll to avoid late penalties',
          'ACA marketplace coverage ends',
          'Different coverage and cost structure',
        ];
        actions = [
          'Enroll in Medicare during Initial Enrollment Period (3 months before 65th birthday)',
          'Choose Medicare Advantage or Original Medicare + Medigap',
          'Select Part D prescription drug coverage',
          'Cancel ACA marketplace plan once Medicare starts',
        ];

        if (daysUntil <= 90) {
          urgency = 'critical';
          immediateConcerns.push('Medicare enrollment window approaching - enroll 3 months before 65th birthday');
        } else if (daysUntil <= 180) {
          urgency = 'high';
          immediateConcerns.push('Medicare eligibility within 6 months');
        } else if (daysUntil <= 365) {
          urgency = 'moderate';
          planningRecommendations.push('Start Medicare research and planning');
        }
      }

      if (event) {
        transitions.push({
          age,
          date: transitionDate,
          daysUntil,
          event,
          impacts,
          actions,
          urgency,
        });
      }
    }
  });

  return {
    currentAge,
    birthDate,
    transitions,
    immediateConcerns,
    planningRecommendations,
  };
}

function calculateAge(birthDate: Date, referenceDate: Date): number {
  const age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  const dayDiff = referenceDate.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    return age - 1;
  }

  return age;
}

// ============================================================================
// INCOME VOLATILITY
// ============================================================================

/**
 * Analyze impact of income changes on eligibility and subsidies
 */
export function analyzeIncomeVolatility(params: {
  currentIncome: number;
  projectedIncome: number;
  householdSize: number;
  state: string;
  currentMonthlyPremium: number;
  currentMonthlyPTC: number;
  monthsRemaining: number; // Months left in year
}): IncomeVolatilityAnalysis {
  const {
    currentIncome,
    projectedIncome,
    householdSize,
    state,
    currentMonthlyPremium,
    currentMonthlyPTC,
    monthsRemaining,
  } = params;

  const incomeChange = projectedIncome - currentIncome;
  const percentageChange = currentIncome > 0 ? (incomeChange / currentIncome) * 100 : 0;

  // Calculate FPL (simplified - would use actual FPL calculator)
  const baseFPL = 15060;
  const perPersonFPL = 5450;
  const fpl = baseFPL + (householdSize - 1) * perPersonFPL;

  const currentFPL = (currentIncome / fpl) * 100;
  const projectedFPL = (projectedIncome / fpl) * 100;

  // Determine eligibility (simplified logic)
  const currentEligibility = {
    medicaid: currentFPL < 138,
    ptc: currentFPL >= 138 && currentFPL < 1000,
    monthlyPTC: currentMonthlyPTC,
  };

  // Estimate projected PTC (simplified)
  const projectedMonthlyPTC = projectedFPL >= 138 && projectedFPL < 1000
    ? Math.max(0, currentMonthlyPTC * (currentFPL / projectedFPL))
    : 0;

  const projectedEligibility = {
    medicaid: projectedFPL < 138,
    ptc: projectedFPL >= 138 && projectedFPL < 1000,
    monthlyPTC: projectedMonthlyPTC,
  };

  // Check if crossing thresholds
  const thresholdsCrossed: string[] = [];
  let crossesThreshold = false;

  if (currentEligibility.medicaid !== projectedEligibility.medicaid) {
    crossesThreshold = true;
    thresholdsCrossed.push(
      projectedEligibility.medicaid
        ? 'Becoming Medicaid eligible (income dropped below 138% FPL)'
        : 'Losing Medicaid eligibility (income exceeded 138% FPL)'
    );
  }

  if (!currentEligibility.ptc && projectedEligibility.ptc) {
    crossesThreshold = true;
    thresholdsCrossed.push('Becoming eligible for Premium Tax Credits');
  } else if (currentEligibility.ptc && !projectedEligibility.ptc) {
    crossesThreshold = true;
    thresholdsCrossed.push('Losing Premium Tax Credit eligibility');
  }

  // Estimate reconciliation risk
  const ptcDifference = projectedMonthlyPTC - currentMonthlyPTC;
  const estimatedReconciliationImpact = ptcDifference * monthsRemaining;

  let reconciliationRisk: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  if (Math.abs(estimatedReconciliationImpact) === 0) {
    reconciliationRisk = 'none';
  } else if (Math.abs(estimatedReconciliationImpact) < 500) {
    reconciliationRisk = 'low';
  } else if (Math.abs(estimatedReconciliationImpact) < 1500) {
    reconciliationRisk = 'moderate';
  } else if (Math.abs(estimatedReconciliationImpact) < 3000) {
    reconciliationRisk = 'high';
  } else {
    reconciliationRisk = 'severe';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  const warnings: string[] = [];

  if (crossesThreshold) {
    recommendations.push('Report income change to the Marketplace within 30 days');
    recommendations.push('Request subsidy adjustment to reflect new income');
  }

  if (estimatedReconciliationImpact > 500) {
    warnings.push(
      `You may owe $${Math.abs(estimatedReconciliationImpact).toLocaleString()} at tax time if income increased and subsidies not adjusted`
    );
    recommendations.push('Consider reducing advance premium tax credits now to avoid repayment');
  } else if (estimatedReconciliationImpact < -500) {
    recommendations.push(
      `You may receive a $${Math.abs(estimatedReconciliationImpact).toLocaleString()} tax refund if income decreased`
    );
    recommendations.push('Request increased subsidies now to reduce out-of-pocket costs');
  }

  if (projectedEligibility.medicaid && !currentEligibility.medicaid) {
    recommendations.push('Apply for Medicaid immediately - you may qualify for free/low-cost coverage');
  }

  if (percentageChange > 25 || percentageChange < -25) {
    warnings.push(`Significant income change (${Math.round(Math.abs(percentageChange))}%) - immediate action required`);
  }

  return {
    currentIncome,
    projectedIncome,
    incomeChange,
    percentageChange,
    currentFPL,
    projectedFPL,
    currentEligibility,
    projectedEligibility,
    crossesThreshold,
    thresholdsCrossed,
    reconciliationRisk,
    estimatedReconciliationImpact,
    recommendations,
    warnings,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if date is during Open Enrollment Period
 */
export function isOpenEnrollmentPeriod(date: Date = new Date()): boolean {
  const month = date.getMonth(); // 0-indexed (0 = Jan, 10 = Nov, 11 = Dec)
  const day = date.getDate();

  // Open Enrollment: November 1 - January 15
  if (month === 10) return true; // All of November
  if (month === 11) return true; // All of December
  if (month === 0 && day <= 15) return true; // January 1-15

  return false;
}

/**
 * Get next Open Enrollment Period dates
 */
export function getNextOpenEnrollment(referenceDate: Date = new Date()): {
  start: Date;
  end: Date;
  daysUntil: number;
} {
  const year = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  let oepYear = year;

  // If past January 15, next OEP is later this year
  if (currentMonth > 0 || (currentMonth === 0 && referenceDate.getDate() > 15)) {
    // Next OEP starts November 1 of current year
  } else {
    // Still in current OEP or before it
    oepYear = year - 1;
  }

  const start = new Date(oepYear, 10, 1); // November 1
  const end = new Date(oepYear + 1, 0, 15); // January 15 next year

  // If we're past this OEP, get next year's
  if (referenceDate > end) {
    start.setFullYear(oepYear + 1);
    end.setFullYear(oepYear + 2);
  }

  const daysUntil = Math.floor(
    (start.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return { start, end, daysUntil };
}
