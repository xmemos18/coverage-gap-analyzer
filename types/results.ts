/**
 * RESULTS PAGE TYPE DEFINITIONS
 *
 * Complete TypeScript interfaces for the insurance recommendation results page.
 * These types define the expected data structure from the recommendation engine.
 */

export type InsuranceType =
  | 'Medicare'
  | 'Medicare Advantage'
  | 'ACA Marketplace'
  | 'Medicaid'
  | 'Employer'
  | 'COBRA'
  | 'Short-term';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type EnrollmentPeriodType =
  | 'Open Enrollment'
  | 'Special Enrollment'
  | 'Year-round'
  | 'Initial Enrollment Period';

// ============================================================================
// USER CONTEXT
// ============================================================================

export interface UserContext {
  age: number;
  state: string;
  familySize: number;
  income: number;
  medicareEligible: boolean;
  medicaidEligible: boolean;
  hasEmployerCoverage?: boolean;
  hasPreexistingConditions?: boolean;
}

// ============================================================================
// RECOMMENDATION
// ============================================================================

export interface Feature {
  id: string;
  text: string;
  icon?: React.ReactNode;
}

export interface PriceRange {
  min: number;
  max: number;
  period?: 'month' | 'year';
}

export interface Recommendation {
  type: InsuranceType;
  planName: string;
  coverageScore: number; // 0-100
  priceRange: PriceRange | 'free' | 'varies';
  eligibilityDescription: string;
  explanation: string;
  features: Feature[];
  bestForDescription: string;
  subsidyEligible?: boolean;
  subsidyAmount?: PriceRange;
}

// ============================================================================
// ALTERNATIVE OPTIONS
// ============================================================================

export interface AlternativeOption {
  id: string;
  type: InsuranceType;
  planName: string;
  description: string;
  monthlyEstimate: string;
  confidenceLevel: ConfidenceLevel;
  isRecommended: boolean;
  benefits: string[];
  drawbacks: string[];
  bestFor: string;
  actionLabel: string;
}

// ============================================================================
// COMPARISON
// ============================================================================

export type ComparisonIcon = 'check' | 'cross' | 'warning' | 'dash';

export interface ComparisonValue {
  value: string;
  icon: ComparisonIcon;
  tooltip?: string;
}

export interface ComparisonFeature {
  name: string;
  primary: ComparisonValue;
  alternative: ComparisonValue;
}

export interface ComparisonData {
  title: string;
  subtitle: string;
  options: AlternativeOption[];
}

export interface QuickComparisonData {
  primaryOption: { name: string };
  alternativeOption: { name: string };
  features: ComparisonFeature[];
  recommendation: string;
}

// ============================================================================
// SHOPPING TIPS
// ============================================================================

export interface ShoppingTipLink {
  text: string;
  url: string;
}

export interface ShoppingTip {
  title: string;
  description: string;
  icon?: React.ReactNode;
  link?: ShoppingTipLink;
}

// ============================================================================
// COST BREAKDOWN
// ============================================================================

export interface CostItem {
  name: string;
  amount: {
    min: number;
    max: number;
  };
  required?: boolean;
  note?: string;
  tooltip?: string;
}

export interface Budget {
  min: number;
  max: number;
}

export interface CostBreakdown {
  insuranceType: string;
  costs: CostItem[];
  userBudget?: Budget;
}

// ============================================================================
// CALL TO ACTION
// ============================================================================

export interface CTA {
  text: string;
  url: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface EnrollmentPeriod {
  type: EnrollmentPeriodType;
  dates?: {
    start: Date;
    end: Date;
  };
  message: string;
}

export interface CTAData {
  insuranceType: string;
  userState: string;
  primaryCTA: CTA;
  secondaryCTAs?: CTA[];
  enrollmentWarning?: string;
  enrollmentPeriod?: EnrollmentPeriod;
}

// ============================================================================
// COMPLETE RECOMMENDATION RESULT
// ============================================================================

export interface RecommendationResult {
  // User context
  user: UserContext;

  // Primary recommendation
  recommendation: Recommendation;

  // Alternative options
  alternativeOptions: AlternativeOption[];

  // Comparison data
  comparisonData: ComparisonData;
  quickComparisonData: QuickComparisonData;

  // Shopping tips (contextual by insurance type)
  shoppingTips: ShoppingTip[];

  // Cost breakdown
  costBreakdown: CostBreakdown;

  // Call-to-action data
  ctaData: CTAData;

  // Metadata
  generatedAt: Date;
  analysisVersion: string;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface HeroCardProps {
  score: number;
  planType: string;
  priceRange: PriceRange | 'free' | 'varies';
  eligibilityDescription: string;
}

export interface WhyThisRecommendationProps {
  explanation: string;
  features: Feature[];
  bestForDescription: string;
  isMobile?: boolean;
}

export interface ComparisonSectionProps {
  title: string;
  subtitle: string;
  options: AlternativeOption[];
  isMobile?: boolean;
}

export interface QuickComparisonTableProps {
  primaryOption: { name: string };
  alternativeOption: { name: string };
  features: ComparisonFeature[];
  recommendation: string;
  isMobile?: boolean;
}

export interface ShoppingTipsProps {
  tips: ShoppingTip[];
  insuranceType: string;
  isMobile?: boolean;
}

export interface CostBreakdownSectionProps {
  insuranceType: string;
  costs: CostItem[];
  userBudget?: Budget;
}

export interface CTASectionProps {
  insuranceType: string;
  userState: string;
  primaryCTA: CTA;
  secondaryCTAs?: CTA[];
  enrollmentWarning?: string;
  isMobile?: boolean;
}
