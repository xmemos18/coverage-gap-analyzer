/**
 * Healthcare.gov Marketplace API Type Definitions
 * Based on CMS Marketplace API v1
 */

export interface Place {
  countyfips: string; // 5-digit FIPS code
  state: string; // 2-letter state code
  zipcode: string;
}

export interface HouseholdMember {
  age: number;
  aptc_eligible: boolean;
  gender: 'Male' | 'Female';
  uses_tobacco: boolean;
  is_parent?: boolean;
  is_pregnant?: boolean;
  expected_children?: number;
}

export interface Household {
  income: number; // Annual household income
  people: HouseholdMember[];
  has_married_couple?: boolean;
}

export interface PlanSearchRequest {
  household?: Household;
  market: 'Individual' | 'SHOP';
  place: Place;
  year?: number;
  filter?: {
    type?: string[]; // HMO, PPO, EPO, POS
    premium?: {
      min?: number;
      max?: number;
    };
    deductible?: {
      max?: number;
    };
    issuer?: string[];
    metal_level?: string[]; // Bronze, Silver, Gold, Platinum, Catastrophic
  };
  aptc_override?: number;
  csr_override?: string;
  offset?: number;
  limit?: number;
}

export interface Premium {
  premium: number; // Base premium
  premium_w_credit?: number; // Premium after APTC
  unsubsidized_premium?: number;
  premium_w_credit_in_max?: boolean;
  child_only_offering?: string;
}

export interface Deductible {
  amount: number;
  csr_variant?: string;
  family_cost?: string;
  display_string?: string;
}

export interface MOOP {
  amount: number;
  csr_variant?: string;
  family_cost?: string;
  display_string?: string;
}

export interface Benefit {
  name: string;
  covered: boolean;
  cost_sharings?: CostSharing[];
  explanation?: string;
  exclusions?: string;
  has_limits?: boolean;
}

export interface CostSharing {
  coinsurance_options?: string;
  coinsurance_rate?: number;
  copay_amount?: number;
  copay_opt?: string;
  csr_variant?: string;
  display_string?: string;
  network_tier?: string;
}

export interface QualityRating {
  global_rating?: number; // 1-5 stars
  global_not_rated?: boolean;
  clinical_quality_management_rating?: number;
  member_experience_rating?: number;
  plan_efficiency_rating?: number;
  year?: number;
}

export interface Plan {
  id: string;
  name: string;
  marketing_name?: string;

  // Plan characteristics
  type: 'HMO' | 'PPO' | 'EPO' | 'POS';
  metal_level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Catastrophic';
  product_division: string;

  // Issuer information
  issuer: {
    id: string;
    name: string;
    state?: string;
    toll_free?: string;
    url?: string;
  };

  // Financial details
  premium?: number | Premium;
  deductibles?: Deductible[];
  moops?: MOOP[]; // Maximum Out-of-Pocket

  // Benefits
  benefits?: Benefit[];

  // Network
  has_national_network?: boolean;
  in_network_primary_care?: CostSharing;
  in_network_specialist?: CostSharing;

  // Quality
  quality_rating?: QualityRating;

  // Service area
  service_area_id?: string;

  // Special features
  is_simple_choice?: boolean;
  hsa_eligible?: boolean;
  suppresses_premium_for_csr?: boolean;

  // Metadata
  disease_mgmt_programs?: string[];
  formulary_id?: string;
  rx_otc?: boolean;
}

export interface PlanSearchResponse {
  plans: Plan[];
  total: number;
  offset?: number;
  limit?: number;
}

export interface EligibilityEstimate {
  aptc?: number; // Advanced Premium Tax Credit
  csr?: string; // Cost Sharing Reduction (0, 73, 87, 94)
  is_medicaid_chip?: boolean;
  medicaid_chip_category?: string;
}

export interface EligibilityRequest {
  household: Household;
  market: 'Individual';
  place: Place;
  year?: number;
}

export interface EligibilityResponse {
  eligibility: EligibilityEstimate[];
}

export interface County {
  fips: string;
  name: string;
  state: string;
  state_name?: string;
}

export interface CountyResponse {
  counties: County[];
}

export interface State {
  abbrev: string;
  name: string;
  marketplace_model: string; // FFM, SBM, etc.
  has_marketplace: boolean;
  marketplace_url?: string;
  medicaid_chip_url?: string;
}

export interface StateResponse {
  states: State[];
}

export interface MedicaidEligibility {
  state: string;
  year: number;
  quarter: number;
  categories: {
    name: string;
    income_limit_percent: number;
    pregnant?: boolean;
    parent?: boolean;
    children_age_range?: string;
  }[];
}

export interface PovertyGuideline {
  year: number;
  state: string;
  guidelines: {
    household_size: number;
    annual_income: number;
  }[];
}

export interface DrugCoverage {
  rxcui: string;
  drug_name: string;
  plans: {
    plan_id: string;
    coverage_status: 'Covered' | 'NotCovered' | 'DataNotProvided';
  }[];
}

export interface ProviderSearchResult {
  npi: string;
  name: string;
  type: 'Individual' | 'Facility';
  specialty?: string;
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
  };
  phone?: string;
  distance?: number; // miles from search location
}

export interface ProviderCoverage {
  npi: string;
  plans: {
    plan_id: string;
    covered: boolean;
    accepting: boolean;
  }[];
}

export interface APIError {
  code: number; // 1000-1017
  status: number; // HTTP status
  message: string;
  error: string;
}

export interface RateArea {
  state: string;
  rate_area: string;
  area_number?: number;
}
