/**
 * Medicare Plan Types
 * Comprehensive type definitions for Medicare Advantage, Medigap, and Part D plans
 */

// ============================================================================
// Medicare Advantage Types
// ============================================================================

export interface MedicareAdvantagePlan {
  // Plan Identification
  contractId: string;
  planId: string;
  segmentId: string;
  organizationName: string;
  planName: string;
  planType: MedicarePlanType;

  // Coverage Details
  monthlyPremium: number;
  deductible: number;
  maxOutOfPocket: number;

  // Service Area
  state: string;
  county: string[];
  zipCodes: string[];

  // Benefits
  coversPrescriptionDrugs: boolean; // MAPD vs MA-only
  coversDental: boolean;
  coversVision: boolean;
  coversHearing: boolean;
  coversFitness: boolean; // Silver Sneakers, gym membership
  coversOTC: boolean; // Over-the-counter items
  otcAllowance?: number; // Monthly OTC allowance in dollars

  // Quality
  starRating: number; // 1-5 stars
  partCRating?: number;
  partDRating?: number;

  // Special Features
  specialNeedsPlan?: 'Chronic' | 'Dual' | 'Institutional';
  requiresReferrals: boolean;
  networkType: 'HMO' | 'PPO' | 'PFFS' | 'SNP';

  // Contact
  phoneNumber: string;
  website?: string;

  // Metadata
  contractYear: number;
  lastUpdated: Date;
}

export type MedicarePlanType =
  | 'Medicare Advantage'
  | 'Medicare Advantage-Prescription Drug'
  | 'Cost Plan'
  | 'PACE';

// ============================================================================
// Medigap (Medicare Supplement) Types
// ============================================================================

export interface MedigapPlan {
  // Plan Identification
  carrier: string;
  planLetter: MedigapPlanLetter;

  // Pricing
  monthlyPremium: number;
  pricingMethod: 'community-rated' | 'issue-age' | 'attained-age';

  // Coverage (varies by plan letter)
  coverage: MedigapCoverage;

  // Availability
  state: string;
  availableCounties: string[];

  // Eligibility
  acceptsNewEnrollees: boolean;
  requiresUnderwriting: boolean;

  // Contact
  phoneNumber: string;
  website?: string;

  // Metadata
  effectiveDate: Date;
  lastUpdated: Date;
}

export type MedigapPlanLetter =
  | 'A' | 'B' | 'C' | 'D' | 'F' | 'G' | 'K' | 'L' | 'M' | 'N';

export interface MedigapCoverage {
  partACoinsurance: boolean;
  partADeductible: boolean;
  partBCoinsurance: boolean;
  partBDeductible: boolean;
  partBExcessCharges: boolean;
  skilledNursingCoinsurance: boolean;
  foreignTravelEmergency: boolean;
  // Additional coverage details by plan letter
}

// ============================================================================
// Part D (Prescription Drug) Types
// ============================================================================

export interface PartDPlan {
  // Plan Identification
  contractId: string;
  planId: string;
  segmentId: string;
  organizationName: string;
  planName: string;

  // Pricing
  monthlyPremium: number;
  deductible: number;

  // Coverage Phases
  coverageGap: PartDCoverageGap;
  catastrophicCoverage: PartDCatastrophicCoverage;

  // Formulary
  formularyId: string;
  drugCoverageLevel: 'Basic' | 'Enhanced' | 'Basic Alternative';

  // Service Area
  state: string;
  counties: string[];

  // Quality
  starRating: number;

  // Special Programs
  preferredPharmacy: boolean;
  mailOrderAvailable: boolean;

  // Contact
  phoneNumber: string;
  website?: string;

  // Metadata
  contractYear: number;
  lastUpdated: Date;
}

export interface PartDCoverageGap {
  // "Donut hole" details
  entersAt: number; // Dollar amount when coverage gap begins
  genericCoinsurance: number; // % in gap
  brandCoinsurance: number; // % in gap
}

export interface PartDCatastrophicCoverage {
  beginsAt: number; // Out-of-pocket threshold
  genericCopay: number;
  brandCopay: number;
}

// ============================================================================
// Drug Pricing Types
// ============================================================================

export interface PrescriptionDrug {
  drugName: string;
  dosage: string;
  quantity: number;
  form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'other';
  isGeneric: boolean;
  ndc?: string; // National Drug Code
}

export interface DrugCostEstimate {
  drug: PrescriptionDrug;
  planId: string;
  planName: string;
  tier: number;
  monthlyCost: number;
  annualCost: number;
  coveragePhase: 'initial' | 'gap' | 'catastrophic';
  copay?: number;
  coinsurance?: number;

  // Pharmacy options
  retail30DayCost: number;
  retail90DayCost?: number;
  mailOrder90DayCost?: number;
  preferredPharmacyCost?: number;
}

// ============================================================================
// Provider Network Types
// ============================================================================

export interface ProviderNetwork {
  planId: string;
  networkId: string;
  networkName: string;
  providers: ProviderInfo[];
  hospitals: HospitalInfo[];
}

export interface ProviderInfo {
  npi: string; // National Provider Identifier
  name: string;
  specialty: string;
  address: Address;
  phoneNumber: string;
  acceptingNewPatients: boolean;
  languages: string[];
}

export interface HospitalInfo {
  facilityId: string;
  name: string;
  address: Address;
  phoneNumber: string;
  type: 'general' | 'specialty' | 'critical-access';
  beds: number;
  rating?: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
}

// ============================================================================
// Medicare Enrollment & Eligibility Types
// ============================================================================

export interface MedicareEligibility {
  isEligible: boolean;
  eligibilityReason: 'age' | 'disability' | 'esrd' | 'als';
  partAEffectiveDate?: Date;
  partBEffectiveDate?: Date;

  // Special Enrollment Periods
  hasSpecialEnrollmentPeriod: boolean;
  sepReason?: string;
  sepEndDate?: Date;

  // Low Income Subsidy
  qualifiesForLIS: boolean;
  lisLevel?: 'full' | 'partial';

  // Medicare-Medicaid Dual Eligible
  isDualEligible: boolean;
}

export interface EnrollmentPeriod {
  type: 'IEP' | 'AEP' | 'OEP' | 'SEP';
  name: string;
  startDate: Date;
  endDate: Date;
  description: string;
  canChangeMAPlans: boolean;
  canChangePartD: boolean;
  canDropMAForOriginalMedicare: boolean;
}

// IEP = Initial Enrollment Period
// AEP = Annual Enrollment Period (Oct 15 - Dec 7)
// OEP = Open Enrollment Period (Jan 1 - Mar 31)
// SEP = Special Enrollment Period

// ============================================================================
// Medicare Plan Comparison Types
// ============================================================================

export interface MedicarePlanComparison {
  recommendedPlan: MedicareAdvantagePlan | MedigapPlan | PartDPlan;
  alternativePlans: (MedicareAdvantagePlan | MedigapPlan | PartDPlan)[];

  // Cost Comparison
  annualCostEstimate: {
    premiums: number;
    outOfPocket: number;
    prescriptions: number;
    total: number;
  };

  // Coverage Gaps
  coverageGaps: string[];
  recommendations: string[];

  // Multi-State Considerations
  travelerFriendly: boolean;
  outOfNetworkCoverage: boolean;
  nationalNetwork: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface MedicarePlanSearchParams {
  zipCode: string;
  county?: string;
  state: string;

  // Filters
  planTypes?: MedicarePlanType[];
  maxPremium?: number;
  minStarRating?: number;

  // Coverage Requirements
  requiresDrugCoverage?: boolean;
  requiresDental?: boolean;
  requiresVision?: boolean;

  // Medications (for Part D matching)
  prescriptions?: PrescriptionDrug[];

  // Pagination
  page?: number;
  limit?: number;
}

export interface MedicarePlanSearchResponse {
  plans: (MedicareAdvantagePlan | MedigapPlan | PartDPlan)[];
  totalCount: number;
  page: number;
  limit: number;
  filters: MedicarePlanSearchParams;
}

export interface MedicarePlanDetailResponse {
  plan: MedicareAdvantagePlan | MedigapPlan | PartDPlan;
  benefits: PlanBenefit[];
  network?: ProviderNetwork;
  drugCosts?: DrugCostEstimate[];
  enrollmentPeriods: EnrollmentPeriod[];
}

export interface PlanBenefit {
  category: string;
  description: string;
  covered: boolean;
  copay?: number;
  coinsurance?: number;
  limitOrMaximum?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface MedicareCostSummary {
  monthlyPremium: number;
  annualDeductible: number;
  estimatedAnnualCost: number;
  worstCaseScenario: number; // With max out-of-pocket
  bestCaseScenario: number; // With minimal usage
}

export interface MultiStateMediareAnalysis {
  primaryState: string;
  secondaryStates: string[];

  // Plans available in all states
  availableInAllStates: MedicareAdvantagePlan[];

  // State-specific recommendations
  stateSpecificPlans: {
    state: string;
    topPlans: MedicareAdvantagePlan[];
  }[];

  // Travel considerations
  recommendations: string[];
}
