import type { SelectablePlanTypeValue } from '@/lib/constants';

// Re-export SelectablePlanTypeValue for consumers
export type { SelectablePlanTypeValue };

export interface NavItem {
  label: string;
  href: string;
}

export interface Benefit {
  title: string;
  description: string;
  icon: string;
}

export interface Step {
  number: number;
  title: string;
  description: string;
}

// Calculator Types
export interface Residence {
  zip: string;
  state: string;
  isPrimary: boolean;
  monthsPerYear: number; // 1-12
}

export interface CurrentInsurance {
  carrier: string;
  planType: string; // e.g., "HMO", "PPO", "EPO", "Medicare Advantage", "Medigap", etc.
  monthlyCost: number;
  deductible: number;
  outOfPocketMax: number;
  coverageNotes: string; // Additional details about coverage
}

export interface CalculatorFormData {
  // Step 1: Residences (array-based for infinite properties)
  residences: Residence[];

  // Step 2: Household
  numAdults: number;
  adultAges: number[];
  adultsUseTobacco: boolean[]; // Tobacco usage for each adult
  numChildren: number;
  childAges: number[];
  childrenUseTobacco: boolean[]; // Tobacco usage for each child
  hasMedicareEligible: boolean;

  // Step 2.1: Employment & Coverage (NEW - Phase 1)
  hasEmployerInsurance: boolean;
  employerContribution: number;

  // Step 2.3: Health Profile (NEW - Phase 1)
  hasChronicConditions: boolean;
  chronicConditions: string[];
  prescriptionCount: string;
  providerPreference: string;

  // Step 2.4: Healthcare Usage Patterns (NEW - Enhanced Phase 1)
  doctorVisitsPerYear: string; // '0-2', '3-5', '6-10', '10+'
  specialistVisitsPerYear: string; // 'none', '1-3', 'monthly-or-more'
  erVisitsPerYear: string; // 'none', '1-2', '3+'
  plannedProcedures: boolean; // Planned surgeries/procedures in next year

  // Step 2.5: Medication Details (NEW - Enhanced Phase 1)
  takesSpecialtyMeds: boolean; // Biologics, injectables, specialty drugs
  monthlyMedicationCost: string; // 'under-50', '50-200', '200-500', '500-1000', 'over-1000'
  usesMailOrderPharmacy: boolean;

  // Step 2.6: Network Preferences (NEW - Enhanced Phase 1)
  hasPreferredHospital: boolean;
  preferredHospitalName: string;
  hospitalImportance: string; // 'must-stay', 'prefer', 'no-preference'
  needsNationalCoverage: string; // 'critical', 'moderate', 'not-important'

  // Step 2.7: Financial Priorities (NEW - Enhanced Phase 1)
  financialPriority: string; // 'lowest-premium', 'lowest-deductible', 'lowest-oop-max', 'balanced'
  canAffordUnexpectedBill: string; // 'yes-easily', 'yes-difficulty', 'no-need-plan'

  // Step 2.8: Plan Type Preferences (user-selected insurance types to display)
  preferredPlanTypes: SelectablePlanTypeValue[]; // e.g., ['PPO', 'HMO', 'HDHP'] - types user wants to see recommendations for

  // Step 2.9: Current Insurance (optional)
  hasCurrentInsurance: boolean;
  currentInsurance: CurrentInsurance;

  // Step 3: Budget
  budget: string;
  incomeRange?: string; // DEPRECATED - kept for backward compatibility with old saved forms
  annualIncome: number | null; // Exact annual household income (supports millions/billions)
  netWorth: number | null; // Total net worth for risk tolerance assessment

  // Current step tracker
  currentStep: number;

  // UI Mode (Phase 3)
  simpleMode: boolean; // Simple mode skips optional questions

  // Add-on Insurance Preferences (Phase 4)
  interestedInAddOns: boolean;
  addOnBudget?: number;
}

export interface FormErrors {
  [key: string]: string;
}

// Type-safe update function for calculator form
export type UpdateFieldFunction = <K extends keyof CalculatorFormData>(
  field: K,
  value: CalculatorFormData[K]
) => void;

// Recommendation Engine Types
export interface CostRange {
  low: number;
  high: number;
}

export interface AlternativeOption {
  name: string;
  monthlyCost: CostRange;
  coverageScore: number;
  pros: string[];
  cons: string[];
}

export interface Suggestion {
  type: 'cost-savings' | 'coverage-improvement' | 'network-expansion' | 'plan-change';
  title: string;
  description: string;
  potentialSavings?: number; // Monthly savings if applicable
  priority: 'high' | 'medium' | 'low';
}

export interface SubsidyAnalysis {
  medicaidEligible: boolean;
  subsidyEligible: boolean;
  estimatedMonthlySubsidy: number;
  estimatedAfterSubsidyCost: CostRange;
  fplPercentage: number;
  explanation: string;
  subsidyActionItems: string[];
  // Real SLCSP data (optional)
  benchmarkPremium?: number;
  isRealSLCSP?: boolean;
  slcspSource?: 'api' | 'database' | 'estimate' | 'cache';
  slcspPlanName?: string;
}

export interface EmployerPlanAnalysis {
  isAffordable: boolean;
  employerPlanCostAfterContribution: number;
  marketplaceCostAfterSubsidy: CostRange;
  recommendation: string;
  monthlySavings: number | null;
  explanation: string;
  actionItems: string[];
}

export interface InsuranceRecommendation {
  recommendedInsurance: string;
  planType?: string; // PPO, HMO, EPO, HDHP, POS, etc.
  householdBreakdown: string;
  estimatedMonthlyCost: CostRange;
  coverageGapScore: number; // 0-100
  reasoning: string;
  actionItems: string[];
  alternativeOptions: AlternativeOption[];

  // Subsidy analysis (Phase 2)
  subsidyAnalysis?: SubsidyAnalysis;

  // Employer comparison (Phase 2)
  employerPlanAnalysis?: EmployerPlanAnalysis;

  // Current insurance comparison (if provided)
  currentInsuranceSummary?: string;
  costComparison?: {
    current: number;
    recommended: CostRange;
    monthlySavings?: number;
    annualSavings?: number;
  };
  suggestions?: Suggestion[];
  improvementAreas?: string[];

  // Add-on insurance recommendations (Phase 4)
  addOnInsuranceAnalysis?: import('./addOnInsurance').AddOnInsuranceAnalysis;

  // Real marketplace plan data from Healthcare.gov API (Phase 5)
  marketplacePlans?: Array<{
    id: string;
    name: string;
    issuer: string;
    type: string;
    metalLevel: string;
    premium: number;
    premiumAfterCredit?: number;
    deductible: number;
    outOfPocketMax: number;
    qualityRating?: number;
    hasNationalNetwork: boolean;
  }>;
  marketplaceDataAvailable?: boolean;

  // Multi-year cost projections (Professional Grade Enhancement)
  costProjections?: CostProjectionSummary;

  // Risk analysis / Monte Carlo simulation (Professional Grade Enhancement)
  riskAnalysis?: RiskAnalysisSummary;

  // Type-specific recommendations (based on user's preferredPlanTypes selection)
  typeSpecificRecommendations?: TypeSpecificRecommendation[];
}

// Type-specific recommendation for a particular plan type
export interface TypeSpecificRecommendation {
  planType: SelectablePlanTypeValue; // e.g., 'PPO', 'HMO', 'HDHP'
  planTypeLabel: string; // e.g., 'PPO - Preferred Provider Organization'
  recommendedPlan: string; // e.g., 'Blue Cross PPO Silver'
  monthlyCost: CostRange;
  coverageScore: number; // 0-100
  reasoning: string;
  pros: string[];
  cons: string[];
  rank: number; // 1 = best fit for this type
}

// ============================================================================
// COST PROJECTION TYPES (Professional Grade Enhancement)
// ============================================================================

export interface CostProjectionSummary {
  /** Year-by-year projections */
  yearlyProjections: YearlyProjection[];
  /** Total projected cost over all years */
  totalProjectedCost: number;
  /** Average annual cost */
  averageAnnualCost: number;
  /** Major life transitions (age 26, 65, etc.) */
  transitions: ProjectionTransition[];
  /** Key insights about projected costs */
  insights: string[];
  /** Confidence interval for total cost */
  confidenceRange: {
    optimistic: number; // 10th percentile
    expected: number;   // 50th percentile
    pessimistic: number; // 90th percentile
  };
}

export interface YearlyProjection {
  year: number;
  calendarYear: number;
  age: number;
  monthlyPremium: number;
  annualPremium: number;
  estimatedMedicalCosts: number;
  estimatedOOP: number;
  totalAnnualCost: number;
  cumulativeCost: number;
  hasTransition: boolean;
}

export interface ProjectionTransition {
  age: number;
  year: number;
  type: 'age-26-off-parents' | 'medicare-eligible' | 'early-retirement';
  description: string;
  impact: string;
  recommendedAction: string;
}

// ============================================================================
// RISK ANALYSIS / MONTE CARLO TYPES (Professional Grade Enhancement)
// ============================================================================

export interface RiskAnalysisSummary {
  /** Simulation results */
  result: MonteCarloResultSummary;
  /** Human-readable interpretation */
  interpretation: RiskInterpretation;
  /** Visualization data for histogram */
  histogramData: HistogramBucket[];
  /** Input parameters used */
  inputParameters: {
    baseCost: number;
    deductible: number;
    outOfPocketMax: number;
    iterations: number;
  };
}

export interface MonteCarloResultSummary {
  /** Median out-of-pocket cost */
  median: number;
  /** Mean out-of-pocket cost */
  mean: number;
  /** Standard deviation of costs */
  standardDeviation: number;
  /** Percentile distribution */
  percentiles: {
    p5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  /** Probability of spending more than deductible (0-100) */
  probabilityOfExceedingDeductible: number;
  /** Probability of hitting out-of-pocket max (0-100) */
  probabilityOfHittingOOPMax: number;
  /** Value at Risk at 95th percentile */
  expectedValueAtRisk: number;
  /** Number of simulations run */
  simulationCount: number;
  /** Time to execute in milliseconds */
  executionTimeMs: number;
}

export interface RiskInterpretation {
  /** Overall risk level */
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  /** Summary statement */
  summary: string;
  /** Key insights */
  insights: string[];
  /** Recommended actions */
  recommendations: string[];
}

export interface HistogramBucket {
  /** Range label (e.g., "$0-1000") */
  label: string;
  /** Lower bound of bucket */
  min: number;
  /** Upper bound of bucket */
  max: number;
  /** Percentage of results in this bucket (0-100) */
  percentage: number;
}
