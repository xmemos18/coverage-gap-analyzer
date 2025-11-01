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

  // Legacy fields (kept for backward compatibility, will be removed later)
  primaryResidence?: Residence;
  secondaryResidence?: Residence;
  hasThirdHome?: boolean;
  thirdResidence?: Residence;

  // Step 2: Household
  numAdults: number;
  adultAges: number[];
  numChildren: number;
  childAges: number[];
  hasMedicareEligible: boolean;

  // Step 2.5: Current Insurance (optional)
  hasCurrentInsurance: boolean;
  currentInsurance: CurrentInsurance;

  // Step 3: Budget
  budget: string;

  // Current step tracker
  currentStep: number;
}

export interface FormErrors {
  [key: string]: string;
}

// Recommendation Engine Types
export interface CostRange {
  low: number;
  high: number;
}

export interface AlternativeOption {
  name: string;
  monthlyCost: CostRange;
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

export interface InsuranceRecommendation {
  recommendedInsurance: string;
  householdBreakdown: string;
  estimatedMonthlyCost: CostRange;
  coverageGapScore: number; // 0-100
  reasoning: string;
  actionItems: string[];
  alternativeOptions: AlternativeOption[];

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
}
