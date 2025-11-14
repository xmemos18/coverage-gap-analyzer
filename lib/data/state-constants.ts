/**
 * Comprehensive State Insurance Data
 *
 * Complete data for all 51 U.S. jurisdictions (50 states + DC)
 * covering:
 * - Marketplace/exchange types
 * - Medicaid expansion status
 * - Market competitiveness metrics
 * - State-specific regulations
 * - Geographic relationships
 * - Special programs and subsidies
 *
 * Data sources: CMS, KFF, state insurance departments (2025)
 */

// ============================================================================
// STATE METADATA
// ============================================================================

export type ExchangeType = 'FFM' | 'SBM' | 'SBM-FP';

export interface StateMetadata {
  code: string;
  name: string;
  exchangeType: ExchangeType;  // FFM = Federal, SBM = State-based, SBM-FP = State-based on Federal Platform
  medicaidExpanded: boolean;
  medicaidThreshold: number;    // % FPL (138% for expansion states, varies for non-expansion)
  chipThreshold: number;        // % FPL for Children's Health Insurance Program
  tobaccoSurchargeLimit: number; // 0.00 to 0.50
  geographicCostIndex: number;  // Relative cost (1.00 = national average)
  baseMonthlyPremium: number;   // Estimated Silver plan for 40-year-old
  carrierCount: number;         // Average number of insurers
  marketCompetitiveness: 'low' | 'moderate' | 'high';
  hasStateSubsidies: boolean;   // Additional state-funded subsidies beyond federal
  hasPublicOption: boolean;     // State-sponsored public option available
  specialRegulations: string[]; // Notable state-specific rules
}

/**
 * Complete state metadata for all 51 jurisdictions
 */
export const STATE_METADATA: Record<string, StateMetadata> = {
  AL: {
    code: 'AL',
    name: 'Alabama',
    exchangeType: 'FFM',
    medicaidExpanded: false,
    medicaidThreshold: 18,        // Parents only, very restrictive
    chipThreshold: 317,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.850,
    baseMonthlyPremium: 340,
    carrierCount: 2,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['No state mandate', 'Limited consumer protections'],
  },
  AK: {
    code: 'AK',
    name: 'Alaska',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 200,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.450,
    baseMonthlyPremium: 650,
    carrierCount: 1,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Extremely high costs', 'Federal reinsurance program', 'Limited competition'],
  },
  AZ: {
    code: 'AZ',
    name: 'Arizona',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 200,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.920,
    baseMonthlyPremium: 375,
    carrierCount: 4,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: [],
  },
  AR: {
    code: 'AR',
    name: 'Arkansas',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 211,
    tobaccoSurchargeLimit: 0.20,  // Restricted to 20%
    geographicCostIndex: 0.825,
    baseMonthlyPremium: 335,
    carrierCount: 3,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Reduced tobacco surcharge limit'],
  },
  CA: {
    code: 'CA',
    name: 'California',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 266,
    tobaccoSurchargeLimit: 0.00,  // Prohibited
    geographicCostIndex: 1.120,
    baseMonthlyPremium: 460,
    carrierCount: 11,
    marketCompetitiveness: 'high',
    hasStateSubsidies: true,      // Covered California state subsidies
    hasPublicOption: false,
    specialRegulations: [
      'No tobacco rating',
      'State individual mandate',
      'State subsidies for middle income',
      'Standardized plan designs',
    ],
  },
  CO: {
    code: 'CO',
    name: 'Colorado',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 260,
    tobaccoSurchargeLimit: 0.15,  // Restricted to 15%
    geographicCostIndex: 0.950,
    baseMonthlyPremium: 390,
    carrierCount: 9,
    marketCompetitiveness: 'high',
    hasStateSubsidies: true,       // Colorado Option
    hasPublicOption: true,         // Colorado Option plan
    specialRegulations: [
      'Public option available',
      'Reduced tobacco surcharge',
      'State reinsurance program',
      'Standardized plans',
    ],
  },
  CT: {
    code: 'CT',
    name: 'Connecticut',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 323,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.180,
    baseMonthlyPremium: 485,
    carrierCount: 4,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['State-based exchange', 'Enhanced consumer protections'],
  },
  DE: {
    code: 'DE',
    name: 'Delaware',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 302,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.050,
    baseMonthlyPremium: 430,
    carrierCount: 2,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: [],
  },
  DC: {
    code: 'DC',
    name: 'District of Columbia',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 215,        // Expanded beyond 138%
    chipThreshold: 319,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.080,
    baseMonthlyPremium: 445,
    carrierCount: 4,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: true,
    hasPublicOption: false,
    specialRegulations: [
      'Higher Medicaid threshold',
      'Small business health options',
      'Strong consumer protections',
    ],
  },
  FL: {
    code: 'FL',
    name: 'Florida',
    exchangeType: 'FFM',
    medicaidExpanded: false,
    medicaidThreshold: 33,         // Very restrictive
    chipThreshold: 210,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.980,
    baseMonthlyPremium: 400,
    carrierCount: 8,
    marketCompetitiveness: 'high',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Large market', 'No state mandate', 'Coverage gap exists'],
  },
  GA: {
    code: 'GA',
    name: 'Georgia',
    exchangeType: 'FFM',
    medicaidExpanded: false,
    medicaidThreshold: 35,
    chipThreshold: 247,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.890,
    baseMonthlyPremium: 365,
    carrierCount: 5,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Georgia Access model (different enrollment)', 'Coverage gap exists'],
  },
  HI: {
    code: 'HI',
    name: 'Hawaii',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 323,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.250,
    baseMonthlyPremium: 515,
    carrierCount: 2,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Prepaid Health Care Act (employer mandate)', 'Island geography challenges'],
  },
  ID: {
    code: 'ID',
    name: 'Idaho',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 190,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.870,
    baseMonthlyPremium: 355,
    carrierCount: 4,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['State-based exchange'],
  },
  IL: {
    code: 'IL',
    name: 'Illinois',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 318,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.950,
    baseMonthlyPremium: 390,
    carrierCount: 7,
    marketCompetitiveness: 'high',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: [],
  },
  IN: {
    code: 'IN',
    name: 'Indiana',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 211,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.880,
    baseMonthlyPremium: 360,
    carrierCount: 4,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Healthy Indiana Plan (HIP)'],
  },
  IA: {
    code: 'IA',
    name: 'Iowa',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 302,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.910,
    baseMonthlyPremium: 375,
    carrierCount: 2,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Limited carrier participation'],
  },
  KS: {
    code: 'KS',
    name: 'Kansas',
    exchangeType: 'FFM',
    medicaidExpanded: false,
    medicaidThreshold: 32,
    chipThreshold: 250,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.905,
    baseMonthlyPremium: 370,
    carrierCount: 3,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Coverage gap exists'],
  },
  KY: {
    code: 'KY',
    name: 'Kentucky',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 213,
    tobaccoSurchargeLimit: 0.40,  // Restricted to 40%
    geographicCostIndex: 0.855,
    baseMonthlyPremium: 350,
    carrierCount: 3,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Reduced tobacco surcharge'],
  },
  LA: {
    code: 'LA',
    name: 'Louisiana',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 250,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.895,
    baseMonthlyPremium: 365,
    carrierCount: 3,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: [],
  },
  ME: {
    code: 'ME',
    name: 'Maine',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 200,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.050,
    baseMonthlyPremium: 430,
    carrierCount: 2,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: [],
  },
  MD: {
    code: 'MD',
    name: 'Maryland',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 322,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.050,
    baseMonthlyPremium: 430,
    carrierCount: 6,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: true,
    hasPublicOption: false,
    specialRegulations: ['State subsidies', 'Strong exchange', 'State individual mandate'],
  },
  MA: {
    code: 'MA',
    name: 'Massachusetts',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 300,
    tobaccoSurchargeLimit: 0.00,  // Prohibited
    geographicCostIndex: 1.150,
    baseMonthlyPremium: 470,
    carrierCount: 9,
    marketCompetitiveness: 'high',
    hasStateSubsidies: true,
    hasPublicOption: false,
    specialRegulations: [
      'No tobacco rating',
      'State individual mandate',
      'ConnectorCare subsidies',
      'Strong consumer protections',
    ],
  },
  MI: {
    code: 'MI',
    name: 'Michigan',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 212,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.920,
    baseMonthlyPremium: 375,
    carrierCount: 6,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: [],
  },
  MN: {
    code: 'MN',
    name: 'Minnesota',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 283,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.020,
    baseMonthlyPremium: 420,
    carrierCount: 5,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: true,
    hasPublicOption: false,
    specialRegulations: ['MinnesotaCare (Basic Health Program)', 'State subsidies'],
  },
  MS: {
    code: 'MS',
    name: 'Mississippi',
    exchangeType: 'FFM',
    medicaidExpanded: false,
    medicaidThreshold: 27,         // Extremely restrictive
    chipThreshold: 211,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.870,
    baseMonthlyPremium: 355,
    carrierCount: 2,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Severe coverage gap', 'Limited competition'],
  },
  MO: {
    code: 'MO',
    name: 'Missouri',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 305,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.900,
    baseMonthlyPremium: 370,
    carrierCount: 4,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Recently expanded Medicaid (2021)'],
  },
  MT: {
    code: 'MT',
    name: 'Montana',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 262,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.950,
    baseMonthlyPremium: 390,
    carrierCount: 3,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: [],
  },
  NE: {
    code: 'NE',
    name: 'Nebraska',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 215,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.915,
    baseMonthlyPremium: 375,
    carrierCount: 3,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Recently expanded (2020)'],
  },
  NV: {
    code: 'NV',
    name: 'Nevada',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 200,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.990,
    baseMonthlyPremium: 405,
    carrierCount: 4,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: true,          // Nevada Public Option
    specialRegulations: ['Public option available', 'State-based exchange'],
  },
  NH: {
    code: 'NH',
    name: 'New Hampshire',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 318,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.080,
    baseMonthlyPremium: 445,
    carrierCount: 3,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: [],
  },
  NJ: {
    code: 'NJ',
    name: 'New Jersey',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 355,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.200,
    baseMonthlyPremium: 495,
    carrierCount: 6,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: true,
    hasPublicOption: false,
    specialRegulations: ['State individual mandate', 'State subsidies', 'State reinsurance'],
  },
  NM: {
    code: 'NM',
    name: 'New Mexico',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 240,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.930,
    baseMonthlyPremium: 380,
    carrierCount: 4,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['State-based exchange'],
  },
  NY: {
    code: 'NY',
    name: 'New York',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 222,
    tobaccoSurchargeLimit: 0.00,  // Prohibited
    geographicCostIndex: 1.280,
    baseMonthlyPremium: 580,
    carrierCount: 10,
    marketCompetitiveness: 'high',
    hasStateSubsidies: true,
    hasPublicOption: false,
    specialRegulations: [
      'No tobacco rating',
      'Community rating (no age bands)',
      'Essential Plan (BHP)',
      'Strong consumer protections',
    ],
  },
  NC: {
    code: 'NC',
    name: 'North Carolina',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 211,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.000,   // Baseline state
    baseMonthlyPremium: 410,
    carrierCount: 4,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Recently expanded (2024)'],
  },
  ND: {
    code: 'ND',
    name: 'North Dakota',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 175,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.980,
    baseMonthlyPremium: 400,
    carrierCount: 2,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: [],
  },
  OH: {
    code: 'OH',
    name: 'Ohio',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 218,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.905,
    baseMonthlyPremium: 370,
    carrierCount: 5,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: [],
  },
  OK: {
    code: 'OK',
    name: 'Oklahoma',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 210,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.885,
    baseMonthlyPremium: 360,
    carrierCount: 3,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Recently expanded (2021)'],
  },
  OR: {
    code: 'OR',
    name: 'Oregon',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 305,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.030,
    baseMonthlyPremium: 425,
    carrierCount: 6,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['State-based exchange'],
  },
  PA: {
    code: 'PA',
    name: 'Pennsylvania',
    exchangeType: 'SBM-FP',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 215,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.020,
    baseMonthlyPremium: 420,
    carrierCount: 7,
    marketCompetitiveness: 'high',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['State-based on Federal Platform'],
  },
  RI: {
    code: 'RI',
    name: 'Rhode Island',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 261,
    tobaccoSurchargeLimit: 0.25,  // Restricted to 25%
    geographicCostIndex: 1.140,
    baseMonthlyPremium: 470,
    carrierCount: 2,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Reduced tobacco surcharge'],
  },
  SC: {
    code: 'SC',
    name: 'South Carolina',
    exchangeType: 'FFM',
    medicaidExpanded: false,
    medicaidThreshold: 67,
    chipThreshold: 211,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.925,
    baseMonthlyPremium: 380,
    carrierCount: 3,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Coverage gap exists'],
  },
  SD: {
    code: 'SD',
    name: 'South Dakota',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 212,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.945,
    baseMonthlyPremium: 385,
    carrierCount: 2,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Recently expanded (2023)'],
  },
  TN: {
    code: 'TN',
    name: 'Tennessee',
    exchangeType: 'FFM',
    medicaidExpanded: false,
    medicaidThreshold: 95,         // Parents/caretakers
    chipThreshold: 211,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.875,
    baseMonthlyPremium: 360,
    carrierCount: 3,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Coverage gap exists'],
  },
  TX: {
    code: 'TX',
    name: 'Texas',
    exchangeType: 'FFM',
    medicaidExpanded: false,
    medicaidThreshold: 18,         // Very restrictive
    chipThreshold: 211,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.810,
    baseMonthlyPremium: 315,
    carrierCount: 7,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Largest non-expansion state', 'Severe coverage gap', 'Most uninsured'],
  },
  UT: {
    code: 'UT',
    name: 'Utah',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 200,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.905,
    baseMonthlyPremium: 370,
    carrierCount: 5,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Recently expanded (2020)'],
  },
  VT: {
    code: 'VT',
    name: 'Vermont',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 317,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.090,
    baseMonthlyPremium: 450,
    carrierCount: 2,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Merged individual/small group market'],
  },
  VA: {
    code: 'VA',
    name: 'Virginia',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 211,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.980,
    baseMonthlyPremium: 400,
    carrierCount: 5,
    marketCompetitiveness: 'moderate',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Recently expanded (2019)'],
  },
  WA: {
    code: 'WA',
    name: 'Washington',
    exchangeType: 'SBM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 312,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 1.060,
    baseMonthlyPremium: 435,
    carrierCount: 8,
    marketCompetitiveness: 'high',
    hasStateSubsidies: true,
    hasPublicOption: true,          // Cascade Care
    specialRegulations: [
      'Public option (Cascade Care)',
      'State subsidies',
      'Standardized plans',
    ],
  },
  WV: {
    code: 'WV',
    name: 'West Virginia',
    exchangeType: 'FFM',
    medicaidExpanded: true,
    medicaidThreshold: 138,
    chipThreshold: 300,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.920,
    baseMonthlyPremium: 375,
    carrierCount: 2,
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: [],
  },
  WI: {
    code: 'WI',
    name: 'Wisconsin',
    exchangeType: 'FFM',
    medicaidExpanded: false,
    medicaidThreshold: 100,        // Childless adults excluded
    chipThreshold: 306,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.960,
    baseMonthlyPremium: 395,
    carrierCount: 15,              // Highest carrier count
    marketCompetitiveness: 'high',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Partial Medicaid expansion', 'High competition', 'BadgerCare'],
  },
  WY: {
    code: 'WY',
    name: 'Wyoming',
    exchangeType: 'FFM',
    medicaidExpanded: false,
    medicaidThreshold: 54,
    chipThreshold: 200,
    tobaccoSurchargeLimit: 0.50,
    geographicCostIndex: 0.990,
    baseMonthlyPremium: 405,
    carrierCount: 1,               // Only 1 carrier
    marketCompetitiveness: 'low',
    hasStateSubsidies: false,
    hasPublicOption: false,
    specialRegulations: ['Coverage gap exists', 'No competition (1 carrier)'],
  },
};

// ============================================================================
// STATE ADJACENCY (for multi-state coverage analysis)
// ============================================================================

export const ADJACENT_STATES: Record<string, string[]> = {
  AL: ['FL', 'GA', 'MS', 'TN'],
  AK: [],  // No land borders
  AZ: ['CA', 'NV', 'UT', 'NM'],
  AR: ['LA', 'MS', 'MO', 'OK', 'TN', 'TX'],
  CA: ['AZ', 'NV', 'OR'],
  CO: ['KS', 'NE', 'NM', 'OK', 'UT', 'WY'],
  CT: ['MA', 'NY', 'RI'],
  DE: ['MD', 'NJ', 'PA'],
  DC: ['MD', 'VA'],
  FL: ['AL', 'GA'],
  GA: ['AL', 'FL', 'NC', 'SC', 'TN'],
  HI: [],  // Island state
  ID: ['MT', 'NV', 'OR', 'UT', 'WA', 'WY'],
  IL: ['IN', 'IA', 'KY', 'MO', 'WI'],
  IN: ['IL', 'KY', 'MI', 'OH'],
  IA: ['IL', 'MN', 'MO', 'NE', 'SD', 'WI'],
  KS: ['CO', 'MO', 'NE', 'OK'],
  KY: ['IL', 'IN', 'MO', 'OH', 'TN', 'VA', 'WV'],
  LA: ['AR', 'MS', 'TX'],
  ME: ['NH'],
  MD: ['DE', 'PA', 'VA', 'WV', 'DC'],
  MA: ['CT', 'NH', 'NY', 'RI', 'VT'],
  MI: ['IN', 'OH', 'WI'],
  MN: ['IA', 'ND', 'SD', 'WI'],
  MS: ['AL', 'AR', 'LA', 'TN'],
  MO: ['AR', 'IL', 'IA', 'KS', 'KY', 'NE', 'OK', 'TN'],
  MT: ['ID', 'ND', 'SD', 'WY'],
  NE: ['CO', 'IA', 'KS', 'MO', 'SD', 'WY'],
  NV: ['AZ', 'CA', 'ID', 'OR', 'UT'],
  NH: ['ME', 'MA', 'VT'],
  NJ: ['DE', 'NY', 'PA'],
  NM: ['AZ', 'CO', 'OK', 'TX'],
  NY: ['CT', 'MA', 'NJ', 'PA', 'VT'],
  NC: ['GA', 'SC', 'TN', 'VA'],
  ND: ['MN', 'MT', 'SD'],
  OH: ['IN', 'KY', 'MI', 'PA', 'WV'],
  OK: ['AR', 'CO', 'KS', 'MO', 'NM', 'TX'],
  OR: ['CA', 'ID', 'NV', 'WA'],
  PA: ['DE', 'MD', 'NJ', 'NY', 'OH', 'WV'],
  RI: ['CT', 'MA'],
  SC: ['GA', 'NC'],
  SD: ['IA', 'MN', 'MT', 'NE', 'ND', 'WY'],
  TN: ['AL', 'AR', 'GA', 'KY', 'MS', 'MO', 'NC', 'VA'],
  TX: ['AR', 'LA', 'NM', 'OK'],
  UT: ['AZ', 'CO', 'ID', 'NV', 'WY'],
  VT: ['MA', 'NH', 'NY'],
  VA: ['KY', 'MD', 'NC', 'TN', 'WV', 'DC'],
  WA: ['ID', 'OR'],
  WV: ['KY', 'MD', 'OH', 'PA', 'VA'],
  WI: ['IL', 'IA', 'MI', 'MN'],
  WY: ['CO', 'ID', 'MT', 'NE', 'SD', 'UT'],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all non-expansion states (coverage gap exists)
 */
export function getNonExpansionStates(): string[] {
  return Object.keys(STATE_METADATA).filter(
    code => !STATE_METADATA[code].medicaidExpanded
  );
}

/**
 * Get all expansion states
 */
export function getExpansionStates(): string[] {
  return Object.keys(STATE_METADATA).filter(
    code => STATE_METADATA[code].medicaidExpanded
  );
}

/**
 * Get states with public options
 */
export function getPublicOptionStates(): string[] {
  return Object.keys(STATE_METADATA).filter(
    code => STATE_METADATA[code].hasPublicOption
  );
}

/**
 * Get states with additional state subsidies
 */
export function getStatesWithStateSubsidies(): string[] {
  return Object.keys(STATE_METADATA).filter(
    code => STATE_METADATA[code].hasStateSubsidies
  );
}

/**
 * Check if someone would be in the coverage gap
 */
export function isInCoverageGap(
  state: string,
  fplPercentage: number
): boolean {
  const metadata = STATE_METADATA[state];
  if (!metadata) return false;

  // Coverage gap: state didn't expand Medicaid, income 100-138% FPL
  return !metadata.medicaidExpanded && fplPercentage >= 100 && fplPercentage < 138;
}

/**
 * Check if eligible for Medicaid in state
 */
export function isMedicaidEligible(
  state: string,
  fplPercentage: number
): boolean {
  const metadata = STATE_METADATA[state];
  if (!metadata) return false;

  return fplPercentage < metadata.medicaidThreshold;
}

/**
 * Get nearby states for multi-state analysis
 */
export function getAdjacentStates(state: string): string[] {
  return ADJACENT_STATES[state] ?? [];
}

/**
 * Get state comparison summary
 */
export function compareStates(state1: string, state2: string): {
  cheaper: string;
  premiumDifference: number;
  medicaidDifference: string;
} {
  const meta1 = STATE_METADATA[state1];
  const meta2 = STATE_METADATA[state2];

  if (!meta1 || !meta2) {
    throw new Error('Invalid state code');
  }

  const cheaper = meta1.baseMonthlyPremium < meta2.baseMonthlyPremium ? state1 : state2;
  const premiumDifference = Math.abs(meta1.baseMonthlyPremium - meta2.baseMonthlyPremium);

  let medicaidDifference = 'Same';
  if (meta1.medicaidExpanded !== meta2.medicaidExpanded) {
    const expandedState = meta1.medicaidExpanded ? state1 : state2;
    medicaidDifference = `${expandedState} has Medicaid expansion`;
  }

  return {
    cheaper,
    premiumDifference,
    medicaidDifference,
  };
}
