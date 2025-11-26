/**
 * Medicare Transition Planner
 *
 * Helps users approaching age 65 plan their transition from current coverage
 * to Medicare. Calculates enrollment windows, deadlines, and estimated costs.
 */

// Types
export interface MedicareTransitionInput {
  /** User's date of birth */
  dateOfBirth: Date;
  /** Current monthly premium (employer or marketplace) */
  currentMonthlyPremium: number;
  /** Whether user has employer coverage */
  hasEmployerCoverage: boolean;
  /** Employer size (for coverage rules) */
  employerSize?: 'small' | 'large'; // Small = <20 employees
  /** Whether spouse has employer coverage */
  spouseHasEmployerCoverage?: boolean;
  /** User's 2-year lookback MAGI for IRMAA */
  magi?: number;
  /** Filing status for IRMAA */
  filingStatus?: 'single' | 'married_joint' | 'married_separate';
  /** State for Medigap pricing */
  state: string;
  /** ZIP code */
  zipCode?: string;
  /** Whether user wants Part D (drug coverage) */
  wantsDrugCoverage?: boolean;
  /** Whether user has VA/Tricare benefits */
  hasVAorTricare?: boolean;
  /** Whether user is still working */
  stillWorking?: boolean;
}

export interface MedicareEnrollmentPeriod {
  name: string;
  type: 'IEP' | 'GEP' | 'SEP' | 'AEP' | 'OEP';
  startDate: Date;
  endDate: Date;
  description: string;
  applies: boolean;
  penalty?: string;
}

export interface MedicareCostEstimate {
  /** Part A monthly premium (usually $0) */
  partAPremium: number;
  /** Part B monthly premium */
  partBPremium: number;
  /** Part B IRMAA surcharge (if applicable) */
  partBIRMAA: number;
  /** Part D premium estimate */
  partDPremium: number;
  /** Part D IRMAA surcharge (if applicable) */
  partDIRMAA: number;
  /** Medigap premium estimate */
  medigapPremium: number;
  /** Total monthly premium */
  totalMonthlyPremium: number;
  /** Annual out-of-pocket estimate */
  estimatedAnnualOOP: number;
}

export interface MedicareTransitionTimeline {
  /** Days until 65th birthday */
  daysUntil65: number;
  /** Months until 65th birthday */
  monthsUntil65: number;
  /** 65th birthday date */
  birthday65: Date;
  /** Medicare eligibility start date (1st of birthday month) */
  medicareStartDate: Date;
  /** Key dates and events */
  events: TimelineEvent[];
  /** Enrollment periods */
  enrollmentPeriods: MedicareEnrollmentPeriod[];
}

export interface TimelineEvent {
  date: Date;
  event: string;
  action: string;
  urgent: boolean;
  category: 'enrollment' | 'coverage' | 'deadline' | 'information';
}

export interface MedicareTransitionAnalysis {
  /** Timeline information */
  timeline: MedicareTransitionTimeline;
  /** Cost estimates */
  costs: MedicareCostEstimate;
  /** Comparison with current coverage */
  comparison: {
    currentAnnualCost: number;
    medicareAnnualCost: number;
    annualSavings: number;
    recommendation: 'switch' | 'delay' | 'evaluate';
    reasons: string[];
  };
  /** Key decisions to make */
  decisions: MedicareDecision[];
  /** Warnings and important notices */
  warnings: string[];
  /** Action items checklist */
  checklist: ChecklistItem[];
}

export interface MedicareDecision {
  question: string;
  options: string[];
  recommendation: string;
  explanation: string;
}

export interface ChecklistItem {
  item: string;
  dueDate?: Date;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

// 2024 Medicare premiums and thresholds
const MEDICARE_2024 = {
  // Part B standard premium
  partBStandardPremium: 174.70,
  // Part B deductible
  partBDeductible: 240,
  // Part A hospital deductible
  partAHospitalDeductible: 1632,
  // Part D average premium
  partDAvgPremium: 55,
  // Part D late enrollment penalty base
  partDPenaltyBase: 34.70 * 0.01, // 1% of national base beneficiary premium

  // IRMAA brackets (based on 2022 MAGI for 2024 premiums)
  irmaaBrackets: {
    single: [
      { threshold: 103000, partBExtra: 0, partDExtra: 0 },
      { threshold: 129000, partBExtra: 69.90, partDExtra: 12.90 },
      { threshold: 161000, partBExtra: 174.70, partDExtra: 33.30 },
      { threshold: 193000, partBExtra: 279.50, partDExtra: 53.80 },
      { threshold: 500000, partBExtra: 384.30, partDExtra: 74.20 },
      { threshold: Infinity, partBExtra: 419.30, partDExtra: 81.00 },
    ],
    married_joint: [
      { threshold: 206000, partBExtra: 0, partDExtra: 0 },
      { threshold: 258000, partBExtra: 69.90, partDExtra: 12.90 },
      { threshold: 322000, partBExtra: 174.70, partDExtra: 33.30 },
      { threshold: 386000, partBExtra: 279.50, partDExtra: 53.80 },
      { threshold: 750000, partBExtra: 384.30, partDExtra: 74.20 },
      { threshold: Infinity, partBExtra: 419.30, partDExtra: 81.00 },
    ],
    married_separate: [
      { threshold: 103000, partBExtra: 0, partDExtra: 0 },
      { threshold: 397000, partBExtra: 384.30, partDExtra: 74.20 },
      { threshold: Infinity, partBExtra: 419.30, partDExtra: 81.00 },
    ],
  },
};

/**
 * Analyze Medicare transition for a user
 */
export function analyzeMedicareTransition(
  input: MedicareTransitionInput
): MedicareTransitionAnalysis {
  const today = new Date();
  const timeline = calculateTimeline(input.dateOfBirth, today, input);
  const costs = calculateCosts(input);
  const comparison = compareWithCurrentCoverage(input, costs);
  const decisions = generateDecisions(input, timeline);
  const warnings = generateWarnings(input, timeline);
  const checklist = generateChecklist(input, timeline);

  return {
    timeline,
    costs,
    comparison,
    decisions,
    warnings,
    checklist,
  };
}

/**
 * Calculate Medicare transition timeline
 */
function calculateTimeline(
  dob: Date,
  today: Date,
  input: MedicareTransitionInput
): MedicareTransitionTimeline {
  const events: TimelineEvent[] = [];

  // Calculate 65th birthday
  const birthday65 = new Date(dob);
  birthday65.setFullYear(birthday65.getFullYear() + 65);

  // Medicare starts 1st of birthday month
  const medicareStartDate = new Date(birthday65.getFullYear(), birthday65.getMonth(), 1);

  // Calculate days/months until 65
  const msUntil65 = birthday65.getTime() - today.getTime();
  const daysUntil65 = Math.ceil(msUntil65 / (1000 * 60 * 60 * 24));
  const monthsUntil65 = Math.ceil(daysUntil65 / 30);

  // Initial Enrollment Period (IEP): 7 months centered on birthday month
  const iepStart = new Date(birthday65);
  iepStart.setMonth(iepStart.getMonth() - 3);
  iepStart.setDate(1);

  const iepEnd = new Date(birthday65);
  iepEnd.setMonth(iepEnd.getMonth() + 3);
  iepEnd.setDate(new Date(iepEnd.getFullYear(), iepEnd.getMonth() + 1, 0).getDate());

  // General Enrollment Period: Jan 1 - Mar 31 each year
  const nextGepStart = new Date(today.getFullYear() + 1, 0, 1);
  const nextGepEnd = new Date(today.getFullYear() + 1, 2, 31);

  // Annual Enrollment Period (Medicare Advantage/Part D): Oct 15 - Dec 7
  const aepStart = new Date(today.getFullYear(), 9, 15);
  const aepEnd = new Date(today.getFullYear(), 11, 7);

  // Open Enrollment Period (Medicare Advantage): Jan 1 - Mar 31
  const oepStart = new Date(today.getFullYear() + 1, 0, 1);
  const oepEnd = new Date(today.getFullYear() + 1, 2, 31);

  // Build enrollment periods
  const enrollmentPeriods: MedicareEnrollmentPeriod[] = [
    {
      name: 'Initial Enrollment Period (IEP)',
      type: 'IEP',
      startDate: iepStart,
      endDate: iepEnd,
      description:
        '7-month window around your 65th birthday to enroll in Medicare Parts A & B without penalty.',
      applies: true,
    },
    {
      name: 'General Enrollment Period (GEP)',
      type: 'GEP',
      startDate: nextGepStart,
      endDate: nextGepEnd,
      description:
        'Annual period (Jan 1 - Mar 31) to enroll if you missed your IEP. Coverage starts July 1. Late penalties may apply.',
      applies: daysUntil65 < 0, // Only applies if already past 65
      penalty: 'Part B premium increases 10% for each 12-month period you were eligible but not enrolled.',
    },
    {
      name: 'Annual Enrollment Period (AEP)',
      type: 'AEP',
      startDate: aepStart,
      endDate: aepEnd,
      description:
        'Annual period (Oct 15 - Dec 7) to change Medicare Advantage or Part D plans.',
      applies: true,
    },
    {
      name: 'Open Enrollment Period (OEP)',
      type: 'OEP',
      startDate: oepStart,
      endDate: oepEnd,
      description:
        'Period (Jan 1 - Mar 31) when Medicare Advantage enrollees can switch to Original Medicare.',
      applies: true,
    },
  ];

  // Special Enrollment Period for those with employer coverage
  if (input.hasEmployerCoverage && input.stillWorking) {
    const sepNote: MedicareEnrollmentPeriod = {
      name: 'Special Enrollment Period (SEP)',
      type: 'SEP',
      startDate: new Date(today),
      endDate: new Date(today.getTime() + 8 * 30 * 24 * 60 * 60 * 1000), // 8 months
      description:
        'You have 8 months after your employer coverage ends to enroll in Medicare Part B without penalty.',
      applies: true,
    };
    enrollmentPeriods.push(sepNote);
  }

  // Build timeline events
  if (daysUntil65 > 0) {
    // IEP Start (3 months before birthday)
    events.push({
      date: iepStart,
      event: 'Initial Enrollment Period Begins',
      action: 'You can start enrolling in Medicare Parts A & B',
      urgent: false,
      category: 'enrollment',
    });

    // 65th Birthday
    events.push({
      date: birthday65,
      event: '65th Birthday',
      action: 'Medicare eligibility begins',
      urgent: daysUntil65 < 90,
      category: 'information',
    });

    // Medicare coverage start
    events.push({
      date: medicareStartDate,
      event: 'Medicare Coverage Can Begin',
      action: 'If enrolled, Medicare coverage starts the 1st of your birthday month',
      urgent: false,
      category: 'coverage',
    });

    // IEP End
    events.push({
      date: iepEnd,
      event: 'Initial Enrollment Period Ends',
      action: 'Last day to enroll without potential late penalties',
      urgent: monthsUntil65 <= 4,
      category: 'deadline',
    });
  }

  // Sort events by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    daysUntil65: Math.max(0, daysUntil65),
    monthsUntil65: Math.max(0, monthsUntil65),
    birthday65,
    medicareStartDate,
    events,
    enrollmentPeriods,
  };
}

/**
 * Calculate Medicare cost estimates
 */
function calculateCosts(input: MedicareTransitionInput): MedicareCostEstimate {
  // Part A is usually $0 if you or spouse worked 40+ quarters
  const partAPremium = 0;

  // Part B standard premium
  const partBPremium = MEDICARE_2024.partBStandardPremium;
  let partBIRMAA = 0;
  let partDIRMAA = 0;

  // Calculate IRMAA if MAGI provided
  if (input.magi) {
    const brackets =
      MEDICARE_2024.irmaaBrackets[input.filingStatus || 'single'];

    for (const bracket of brackets) {
      if (input.magi <= bracket.threshold) {
        partBIRMAA = bracket.partBExtra;
        partDIRMAA = bracket.partDExtra;
        break;
      }
    }
  }

  // Part D premium (average) + IRMAA
  const partDPremium = input.wantsDrugCoverage !== false ? MEDICARE_2024.partDAvgPremium : 0;

  // Medigap premium estimate (varies significantly by state and plan)
  // Using average estimate, adjusted slightly by state
  const medigapPremium = estimateMedigapPremium(input.state, 65);

  const totalMonthlyPremium =
    partAPremium +
    partBPremium +
    partBIRMAA +
    partDPremium +
    partDIRMAA +
    medigapPremium;

  // Estimate annual OOP (deductibles + typical cost-sharing)
  const estimatedAnnualOOP =
    MEDICARE_2024.partBDeductible +
    MEDICARE_2024.partAHospitalDeductible * 0.1 + // Assume 10% chance of hospitalization
    500; // Misc cost-sharing

  return {
    partAPremium,
    partBPremium,
    partBIRMAA,
    partDPremium,
    partDIRMAA,
    medigapPremium,
    totalMonthlyPremium: Math.round(totalMonthlyPremium * 100) / 100,
    estimatedAnnualOOP: Math.round(estimatedAnnualOOP),
  };
}

/**
 * Estimate Medigap premium by state
 */
function estimateMedigapPremium(state: string, age: number): number {
  // Base Medigap Plan G premium estimate (most popular plan)
  const basePremium = 150;

  // State variation factors (simplified)
  const stateFactors: Record<string, number> = {
    FL: 1.25,
    NY: 1.35,
    CA: 1.20,
    TX: 1.0,
    PA: 1.15,
    OH: 0.95,
    IL: 1.10,
    GA: 1.05,
    NC: 1.0,
    MI: 1.10,
  };

  const stateFactor = stateFactors[state.toUpperCase()] || 1.0;

  // Age rating (issue-age pricing assumed)
  // Medigap premiums typically increase with age at enrollment
  const ageFactor = 1 + (age - 65) * 0.02;

  return Math.round(basePremium * stateFactor * ageFactor);
}

/**
 * Compare Medicare costs with current coverage
 */
function compareWithCurrentCoverage(
  input: MedicareTransitionInput,
  costs: MedicareCostEstimate
): MedicareTransitionAnalysis['comparison'] {
  const currentAnnualCost = input.currentMonthlyPremium * 12;
  const medicareAnnualCost =
    costs.totalMonthlyPremium * 12 + costs.estimatedAnnualOOP;
  const annualSavings = currentAnnualCost - medicareAnnualCost;

  const reasons: string[] = [];
  let recommendation: 'switch' | 'delay' | 'evaluate' = 'evaluate';

  // Decision logic
  if (input.hasEmployerCoverage && input.stillWorking && input.employerSize === 'large') {
    // Large employer (20+) - Medicare is secondary, can delay Part B
    reasons.push(
      'Large employer coverage (20+ employees) is primary over Medicare. You can delay Part B without penalty while still employed.'
    );
    recommendation = 'delay';
  } else if (input.hasEmployerCoverage && input.employerSize === 'small') {
    // Small employer (<20) - Medicare is primary, should enroll
    reasons.push(
      'Small employer coverage (<20 employees) is secondary to Medicare. You should enroll in Part B to avoid coverage gaps.'
    );
    recommendation = 'switch';
  } else if (annualSavings > 1000) {
    reasons.push(
      `Medicare could save you approximately $${Math.round(annualSavings)} per year compared to your current coverage.`
    );
    recommendation = 'switch';
  } else if (annualSavings < -1000) {
    reasons.push(
      `Your current coverage costs approximately $${Math.round(-annualSavings)} less per year than Medicare would.`
    );
    if (input.hasEmployerCoverage && input.stillWorking) {
      recommendation = 'delay';
    }
  } else {
    reasons.push(
      'Medicare costs are comparable to your current coverage. Consider factors like network, drug coverage, and flexibility.'
    );
  }

  // VA/Tricare special note
  if (input.hasVAorTricare) {
    reasons.push(
      'VA/Tricare benefits can work alongside Medicare. Consider enrolling in Part A (free) while keeping your VA/Tricare coverage.'
    );
  }

  return {
    currentAnnualCost: Math.round(currentAnnualCost),
    medicareAnnualCost: Math.round(medicareAnnualCost),
    annualSavings: Math.round(annualSavings),
    recommendation,
    reasons,
  };
}

/**
 * Generate key decisions for user
 */
function generateDecisions(
  input: MedicareTransitionInput,
  _timeline: MedicareTransitionTimeline
): MedicareDecision[] {
  const decisions: MedicareDecision[] = [];

  // Part B enrollment timing
  if (input.hasEmployerCoverage && input.stillWorking) {
    decisions.push({
      question: 'When should I enroll in Medicare Part B?',
      options: [
        'During my Initial Enrollment Period (IEP)',
        'When I stop working or lose employer coverage',
        'During the General Enrollment Period',
      ],
      recommendation:
        input.employerSize === 'large'
          ? 'When I stop working or lose employer coverage'
          : 'During my Initial Enrollment Period (IEP)',
      explanation:
        input.employerSize === 'large'
          ? 'With large employer coverage (20+ employees), your employer plan is primary. You can delay Part B without penalty.'
          : 'With small employer coverage (<20 employees), Medicare is primary. Enroll during your IEP to avoid gaps and penalties.',
    });
  }

  // Original Medicare vs Medicare Advantage
  decisions.push({
    question: 'Should I choose Original Medicare or Medicare Advantage?',
    options: ['Original Medicare + Medigap', 'Medicare Advantage (Part C)'],
    recommendation: 'Depends on your priorities',
    explanation:
      'Original Medicare offers maximum provider choice but may have higher costs. Medicare Advantage often has lower premiums and extra benefits but restricted networks. Consider your healthcare needs and preferences.',
  });

  // Part D enrollment
  if (input.wantsDrugCoverage !== false) {
    decisions.push({
      question: 'Should I enroll in Part D for drug coverage?',
      options: ['Yes, during IEP', 'No, I have creditable drug coverage', 'Not sure'],
      recommendation:
        input.hasEmployerCoverage && input.stillWorking
          ? 'Evaluate your current drug coverage creditability'
          : 'Yes, during IEP',
      explanation:
        'If you don\'t have creditable drug coverage and delay Part D enrollment, you\'ll pay a permanent late penalty. Get documentation from your current plan about whether your drug coverage is "creditable."',
    });
  }

  return decisions;
}

/**
 * Generate warnings and important notices
 */
function generateWarnings(
  input: MedicareTransitionInput,
  timeline: MedicareTransitionTimeline
): string[] {
  const warnings: string[] = [];

  // Late enrollment penalty warning
  if (timeline.daysUntil65 > 0 && timeline.daysUntil65 < 90) {
    warnings.push(
      'URGENT: Your Initial Enrollment Period is approaching. Missing this window could result in late enrollment penalties.'
    );
  }

  // Small employer warning
  if (input.hasEmployerCoverage && input.employerSize === 'small') {
    warnings.push(
      'Important: With small employer coverage (<20 employees), Medicare becomes your primary insurance at 65. Failure to enroll in Part B may result in coverage gaps.'
    );
  }

  // IRMAA warning
  if (input.magi && input.filingStatus) {
    const brackets = MEDICARE_2024.irmaaBrackets[input.filingStatus];
    const firstBracket = brackets[0];
    if (firstBracket && input.magi > firstBracket.threshold) {
      warnings.push(
        `Your income may subject you to IRMAA surcharges on Parts B and D. Consider strategies like Roth conversions or timing income events.`
      );
    }
  }

  // Part D penalty warning
  warnings.push(
    'Part D late enrollment penalty is 1% per month you were eligible but not enrolled without creditable coverage. This penalty is permanent.'
  );

  return warnings;
}

/**
 * Generate checklist of action items
 */
function generateChecklist(
  input: MedicareTransitionInput,
  timeline: MedicareTransitionTimeline
): ChecklistItem[] {
  const checklist: ChecklistItem[] = [];
  const threeMonthsBefore = new Date(timeline.birthday65);
  threeMonthsBefore.setMonth(threeMonthsBefore.getMonth() - 3);

  checklist.push({
    item: 'Get your Medicare number (from Social Security)',
    dueDate: threeMonthsBefore,
    completed: false,
    priority: 'high',
  });

  checklist.push({
    item: 'Review your current coverage and compare with Medicare options',
    dueDate: threeMonthsBefore,
    completed: false,
    priority: 'high',
  });

  checklist.push({
    item: 'Decide between Original Medicare and Medicare Advantage',
    dueDate: threeMonthsBefore,
    completed: false,
    priority: 'high',
  });

  if (input.wantsDrugCoverage !== false) {
    checklist.push({
      item: 'Research Part D prescription drug plans',
      dueDate: threeMonthsBefore,
      completed: false,
      priority: 'medium',
    });
  }

  checklist.push({
    item: 'Get creditable coverage letter from employer (if applicable)',
    dueDate: threeMonthsBefore,
    completed: false,
    priority: input.hasEmployerCoverage ? 'high' : 'low',
  });

  checklist.push({
    item: 'Compare Medigap policies in your state (if choosing Original Medicare)',
    dueDate: threeMonthsBefore,
    completed: false,
    priority: 'medium',
  });

  checklist.push({
    item: 'Notify employer of Medicare enrollment plans',
    dueDate: new Date(timeline.birthday65.getTime() - 30 * 24 * 60 * 60 * 1000),
    completed: false,
    priority: input.hasEmployerCoverage ? 'high' : 'low',
  });

  checklist.push({
    item: 'Enroll in Medicare Parts A and B',
    dueDate: timeline.birthday65,
    completed: false,
    priority: 'high',
  });

  return checklist;
}

/**
 * Quick helper to get Medicare eligibility date
 */
export function getMedicareEligibilityDate(dateOfBirth: Date): Date {
  const eligibility = new Date(dateOfBirth);
  eligibility.setFullYear(eligibility.getFullYear() + 65);
  return new Date(eligibility.getFullYear(), eligibility.getMonth(), 1);
}

/**
 * Calculate Part B late enrollment penalty
 */
export function calculatePartBPenalty(monthsDelayed: number): number {
  // 10% for each full 12-month period delayed
  const periods = Math.floor(monthsDelayed / 12);
  const penaltyPercent = periods * 0.10;
  return Math.round(MEDICARE_2024.partBStandardPremium * penaltyPercent * 100) / 100;
}

/**
 * Calculate Part D late enrollment penalty
 */
export function calculatePartDPenalty(monthsDelayed: number): number {
  // 1% of national base beneficiary premium per month delayed
  const nationalBasePremium = 34.70; // 2024 value
  const penaltyPerMonth = nationalBasePremium * 0.01;
  return Math.round(penaltyPerMonth * monthsDelayed * 100) / 100;
}

/**
 * Get Medicare IRMAA surcharge for given income
 */
export function getIRMAASurcharge(
  magi: number,
  filingStatus: 'single' | 'married_joint' | 'married_separate' = 'single'
): { partBExtra: number; partDExtra: number } {
  const brackets = MEDICARE_2024.irmaaBrackets[filingStatus];

  for (const bracket of brackets) {
    if (magi <= bracket.threshold) {
      return {
        partBExtra: bracket.partBExtra,
        partDExtra: bracket.partDExtra,
      };
    }
  }

  // Shouldn't reach here, but return highest bracket
  const lastBracket = brackets[brackets.length - 1];
  return {
    partBExtra: lastBracket?.partBExtra || 0,
    partDExtra: lastBracket?.partDExtra || 0,
  };
}
