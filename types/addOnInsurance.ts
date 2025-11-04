/**
 * Add-On Insurance Types
 *
 * Defines types for age-based supplemental insurance recommendations
 */

/**
 * Categories of add-on insurance products
 */
export type AddOnInsuranceCategory =
  | 'dental'
  | 'vision'
  | 'accident'
  | 'critical-illness'
  | 'hospital-indemnity'
  | 'disability'
  | 'long-term-care'
  | 'life';

/**
 * Priority levels for recommendations
 */
export type RecommendationPriority = 'high' | 'medium' | 'low';

/**
 * Age bracket for targeting recommendations
 */
export interface AgeRecommendation {
  minAge: number;
  maxAge: number;
  priority: RecommendationPriority;
  probabilityThreshold: number; // 0-100
  reasonCode: string;
}

/**
 * Base add-on insurance product definition
 */
export interface AddOnInsurance {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: AddOnInsuranceCategory;
  baseCostPerMonth: number;
  ageRecommendations: AgeRecommendation[];
  benefits: string[];
  typicalCoverage: string;
  bestFor: string[];
}

/**
 * Personalized recommendation for a specific household
 */
export interface AddOnRecommendation {
  insurance: AddOnInsurance;
  priority: RecommendationPriority;
  probabilityScore: number; // 0-100
  adjustedCostPerMonth: number; // After state adjustments
  householdCostPerMonth: number; // Total for all applicable members
  applicableMembers: number; // How many household members this applies to
  reasons: string[];
  ageGroup: string; // e.g., "Adults 31-40", "Children 0-17"
}

/**
 * User preferences for add-on insurance
 */
export interface AddOnInsurancePreferences {
  interested: boolean;
  excludeCategories?: AddOnInsuranceCategory[];
  maxMonthlyBudget?: number;
}

/**
 * Complete add-on insurance analysis result
 */
export interface AddOnInsuranceAnalysis {
  recommendations: AddOnRecommendation[]; // Filtered recommendations above threshold
  allRecommendations: AddOnRecommendation[]; // All insurance products, including below threshold
  highPriority: AddOnRecommendation[];
  mediumPriority: AddOnRecommendation[];
  lowPriority: AddOnRecommendation[];
  totalMonthlyHighPriority: number;
  totalMonthlyAllRecommended: number;
  householdAgeGroups: HouseholdAgeGroup[];
}

/**
 * Age group breakdown of household
 */
export interface HouseholdAgeGroup {
  groupName: string;
  minAge: number;
  maxAge: number;
  memberCount: number;
  ages: number[];
}

/**
 * Reason codes for recommendations
 */
export const RECOMMENDATION_REASONS = {
  // Age-based reasons
  YOUNG_ADULT: 'Young adults benefit from accident protection',
  FAMILY_PLANNING: 'Common need for families planning for the future',
  MID_CAREER: 'Peak earning years require income protection',
  PRE_RETIREMENT: 'Important to secure coverage before retirement',
  SENIOR_HEALTH: 'Higher likelihood of critical health events',
  MEDICARE_GAPS: 'Covers expenses not included in Medicare',

  // Life stage reasons
  CHILDREN_PRESENT: 'Recommended for households with children',
  DEPENDENTS: 'Important protection for dependents',
  PRIMARY_EARNER: 'Critical for primary household earners',

  // Health-based reasons
  CHRONIC_CONDITIONS: 'Beneficial for those with chronic conditions',
  PREVENTIVE_CARE: 'Essential preventive care coverage',
  HOSPITAL_RISK: 'Higher risk of hospitalization in this age group',

  // Financial reasons
  INCOME_REPLACEMENT: 'Replaces lost income during disability',
  CATASTROPHIC_PROTECTION: 'Protection against catastrophic costs',
  OUT_OF_POCKET: 'Covers out-of-pocket medical expenses',
} as const;

export type RecommendationReasonCode = keyof typeof RECOMMENDATION_REASONS;
