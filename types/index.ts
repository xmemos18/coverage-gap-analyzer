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

export interface CalculatorFormData {
  // Step 1: Residences
  primaryResidence: Residence;
  secondaryResidence: Residence;
  hasThirdHome: boolean;
  thirdResidence: Residence;

  // Step 2: Household
  numAdults: number;
  adultAges: number[];
  numChildren: number;
  childAges: number[];
  hasMedicareEligible: boolean;

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

export interface InsuranceRecommendation {
  recommendedInsurance: string;
  householdBreakdown: string;
  estimatedMonthlyCost: CostRange;
  coverageGapScore: number; // 0-100
  reasoning: string;
  actionItems: string[];
  alternativeOptions: AlternativeOption[];
}
