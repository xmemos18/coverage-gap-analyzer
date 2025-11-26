/**
 * County Healthcare Cost Index Module
 *
 * Provides geographic cost adjustment factors based on Medicare Geographic
 * Adjustment Factors (GAF) and regional healthcare cost data.
 *
 * Cost indices are normalized to 1.0 (national average = 1.0).
 * Higher values indicate more expensive healthcare markets.
 */

// Types
export interface CountyCostIndex {
  /** FIPS code for the county */
  fips: string;
  /** County name */
  county: string;
  /** State code (2-letter) */
  state: string;
  /** Overall cost index (1.0 = national average) */
  costIndex: number;
  /** Work GPCI (Geographic Practice Cost Index) component */
  workGPCI: number;
  /** Practice expense GPCI component */
  peGPCI: number;
  /** Malpractice GPCI component */
  mpGPCI: number;
  /** Medicare Area Wage Index */
  wageIndex: number;
  /** Cost tier classification */
  tier: 'very_low' | 'low' | 'average' | 'high' | 'very_high';
}

export interface StateCostSummary {
  /** State code */
  state: string;
  /** State name */
  stateName: string;
  /** Average cost index for the state */
  averageCostIndex: number;
  /** Minimum cost index in state */
  minCostIndex: number;
  /** Maximum cost index in state */
  maxCostIndex: number;
  /** Cost tier classification */
  tier: 'very_low' | 'low' | 'average' | 'high' | 'very_high';
}

/**
 * State-level cost indices (simplified dataset)
 * Based on CMS Geographic Adjustment Factor data
 * Values normalized to 1.0 = national average
 */
export const STATE_COST_INDICES: Record<string, StateCostSummary> = {
  // Very High Cost States
  AK: { state: 'AK', stateName: 'Alaska', averageCostIndex: 1.27, minCostIndex: 1.22, maxCostIndex: 1.32, tier: 'very_high' },
  CA: { state: 'CA', stateName: 'California', averageCostIndex: 1.18, minCostIndex: 0.98, maxCostIndex: 1.45, tier: 'very_high' },
  CT: { state: 'CT', stateName: 'Connecticut', averageCostIndex: 1.15, minCostIndex: 1.08, maxCostIndex: 1.22, tier: 'very_high' },
  DC: { state: 'DC', stateName: 'District of Columbia', averageCostIndex: 1.21, minCostIndex: 1.21, maxCostIndex: 1.21, tier: 'very_high' },
  HI: { state: 'HI', stateName: 'Hawaii', averageCostIndex: 1.12, minCostIndex: 1.08, maxCostIndex: 1.16, tier: 'very_high' },
  MA: { state: 'MA', stateName: 'Massachusetts', averageCostIndex: 1.14, minCostIndex: 1.05, maxCostIndex: 1.23, tier: 'very_high' },
  NJ: { state: 'NJ', stateName: 'New Jersey', averageCostIndex: 1.13, minCostIndex: 1.05, maxCostIndex: 1.21, tier: 'very_high' },
  NY: { state: 'NY', stateName: 'New York', averageCostIndex: 1.12, minCostIndex: 0.96, maxCostIndex: 1.35, tier: 'very_high' },

  // High Cost States
  CO: { state: 'CO', stateName: 'Colorado', averageCostIndex: 1.05, minCostIndex: 0.95, maxCostIndex: 1.15, tier: 'high' },
  DE: { state: 'DE', stateName: 'Delaware', averageCostIndex: 1.06, minCostIndex: 1.04, maxCostIndex: 1.08, tier: 'high' },
  FL: { state: 'FL', stateName: 'Florida', averageCostIndex: 1.02, minCostIndex: 0.94, maxCostIndex: 1.12, tier: 'high' },
  IL: { state: 'IL', stateName: 'Illinois', averageCostIndex: 1.04, minCostIndex: 0.92, maxCostIndex: 1.18, tier: 'high' },
  MD: { state: 'MD', stateName: 'Maryland', averageCostIndex: 1.08, minCostIndex: 1.02, maxCostIndex: 1.14, tier: 'high' },
  MN: { state: 'MN', stateName: 'Minnesota', averageCostIndex: 1.03, minCostIndex: 0.94, maxCostIndex: 1.12, tier: 'high' },
  NH: { state: 'NH', stateName: 'New Hampshire', averageCostIndex: 1.06, minCostIndex: 1.02, maxCostIndex: 1.10, tier: 'high' },
  OR: { state: 'OR', stateName: 'Oregon', averageCostIndex: 1.03, minCostIndex: 0.96, maxCostIndex: 1.10, tier: 'high' },
  PA: { state: 'PA', stateName: 'Pennsylvania', averageCostIndex: 1.02, minCostIndex: 0.94, maxCostIndex: 1.12, tier: 'high' },
  RI: { state: 'RI', stateName: 'Rhode Island', averageCostIndex: 1.08, minCostIndex: 1.06, maxCostIndex: 1.10, tier: 'high' },
  TX: { state: 'TX', stateName: 'Texas', averageCostIndex: 1.01, minCostIndex: 0.92, maxCostIndex: 1.12, tier: 'high' },
  VA: { state: 'VA', stateName: 'Virginia', averageCostIndex: 1.03, minCostIndex: 0.94, maxCostIndex: 1.15, tier: 'high' },
  WA: { state: 'WA', stateName: 'Washington', averageCostIndex: 1.05, minCostIndex: 0.96, maxCostIndex: 1.15, tier: 'high' },

  // Average Cost States
  AZ: { state: 'AZ', stateName: 'Arizona', averageCostIndex: 0.99, minCostIndex: 0.94, maxCostIndex: 1.05, tier: 'average' },
  GA: { state: 'GA', stateName: 'Georgia', averageCostIndex: 0.98, minCostIndex: 0.92, maxCostIndex: 1.06, tier: 'average' },
  MI: { state: 'MI', stateName: 'Michigan', averageCostIndex: 0.99, minCostIndex: 0.92, maxCostIndex: 1.08, tier: 'average' },
  NC: { state: 'NC', stateName: 'North Carolina', averageCostIndex: 0.97, minCostIndex: 0.92, maxCostIndex: 1.04, tier: 'average' },
  NV: { state: 'NV', stateName: 'Nevada', averageCostIndex: 1.00, minCostIndex: 0.96, maxCostIndex: 1.05, tier: 'average' },
  OH: { state: 'OH', stateName: 'Ohio', averageCostIndex: 0.97, minCostIndex: 0.90, maxCostIndex: 1.05, tier: 'average' },
  SC: { state: 'SC', stateName: 'South Carolina', averageCostIndex: 0.96, minCostIndex: 0.92, maxCostIndex: 1.02, tier: 'average' },
  TN: { state: 'TN', stateName: 'Tennessee', averageCostIndex: 0.96, minCostIndex: 0.90, maxCostIndex: 1.04, tier: 'average' },
  UT: { state: 'UT', stateName: 'Utah', averageCostIndex: 0.98, minCostIndex: 0.94, maxCostIndex: 1.02, tier: 'average' },
  VT: { state: 'VT', stateName: 'Vermont', averageCostIndex: 1.00, minCostIndex: 0.98, maxCostIndex: 1.02, tier: 'average' },
  WI: { state: 'WI', stateName: 'Wisconsin', averageCostIndex: 0.98, minCostIndex: 0.92, maxCostIndex: 1.06, tier: 'average' },

  // Low Cost States
  AL: { state: 'AL', stateName: 'Alabama', averageCostIndex: 0.92, minCostIndex: 0.88, maxCostIndex: 0.98, tier: 'low' },
  AR: { state: 'AR', stateName: 'Arkansas', averageCostIndex: 0.90, minCostIndex: 0.86, maxCostIndex: 0.94, tier: 'low' },
  IA: { state: 'IA', stateName: 'Iowa', averageCostIndex: 0.93, minCostIndex: 0.88, maxCostIndex: 0.98, tier: 'low' },
  ID: { state: 'ID', stateName: 'Idaho', averageCostIndex: 0.94, minCostIndex: 0.90, maxCostIndex: 0.98, tier: 'low' },
  IN: { state: 'IN', stateName: 'Indiana', averageCostIndex: 0.94, minCostIndex: 0.88, maxCostIndex: 1.00, tier: 'low' },
  KS: { state: 'KS', stateName: 'Kansas', averageCostIndex: 0.93, minCostIndex: 0.88, maxCostIndex: 0.98, tier: 'low' },
  KY: { state: 'KY', stateName: 'Kentucky', averageCostIndex: 0.92, minCostIndex: 0.86, maxCostIndex: 0.98, tier: 'low' },
  LA: { state: 'LA', stateName: 'Louisiana', averageCostIndex: 0.93, minCostIndex: 0.88, maxCostIndex: 0.98, tier: 'low' },
  ME: { state: 'ME', stateName: 'Maine', averageCostIndex: 0.95, minCostIndex: 0.92, maxCostIndex: 0.98, tier: 'low' },
  MO: { state: 'MO', stateName: 'Missouri', averageCostIndex: 0.93, minCostIndex: 0.86, maxCostIndex: 1.02, tier: 'low' },
  MT: { state: 'MT', stateName: 'Montana', averageCostIndex: 0.94, minCostIndex: 0.90, maxCostIndex: 0.98, tier: 'low' },
  NE: { state: 'NE', stateName: 'Nebraska', averageCostIndex: 0.93, minCostIndex: 0.88, maxCostIndex: 0.98, tier: 'low' },
  NM: { state: 'NM', stateName: 'New Mexico', averageCostIndex: 0.94, minCostIndex: 0.90, maxCostIndex: 0.98, tier: 'low' },
  ND: { state: 'ND', stateName: 'North Dakota', averageCostIndex: 0.93, minCostIndex: 0.90, maxCostIndex: 0.96, tier: 'low' },
  OK: { state: 'OK', stateName: 'Oklahoma', averageCostIndex: 0.92, minCostIndex: 0.88, maxCostIndex: 0.98, tier: 'low' },
  SD: { state: 'SD', stateName: 'South Dakota', averageCostIndex: 0.92, minCostIndex: 0.88, maxCostIndex: 0.96, tier: 'low' },
  WY: { state: 'WY', stateName: 'Wyoming', averageCostIndex: 0.95, minCostIndex: 0.92, maxCostIndex: 0.98, tier: 'low' },

  // Very Low Cost States
  MS: { state: 'MS', stateName: 'Mississippi', averageCostIndex: 0.88, minCostIndex: 0.84, maxCostIndex: 0.92, tier: 'very_low' },
  PR: { state: 'PR', stateName: 'Puerto Rico', averageCostIndex: 0.85, minCostIndex: 0.82, maxCostIndex: 0.88, tier: 'very_low' },
  WV: { state: 'WV', stateName: 'West Virginia', averageCostIndex: 0.89, minCostIndex: 0.86, maxCostIndex: 0.92, tier: 'very_low' },
};

/**
 * Major metro areas with specific cost indices
 */
export const METRO_AREA_INDICES: Record<string, CountyCostIndex> = {
  // Very High Cost Metro Areas
  'San Francisco-Oakland-Berkeley, CA': {
    fips: '06075',
    county: 'San Francisco',
    state: 'CA',
    costIndex: 1.45,
    workGPCI: 1.08,
    peGPCI: 1.52,
    mpGPCI: 0.85,
    wageIndex: 1.48,
    tier: 'very_high',
  },
  'San Jose-Sunnyvale-Santa Clara, CA': {
    fips: '06085',
    county: 'Santa Clara',
    state: 'CA',
    costIndex: 1.42,
    workGPCI: 1.06,
    peGPCI: 1.48,
    mpGPCI: 0.88,
    wageIndex: 1.45,
    tier: 'very_high',
  },
  'New York-Newark-Jersey City, NY-NJ-PA': {
    fips: '36061',
    county: 'New York (Manhattan)',
    state: 'NY',
    costIndex: 1.35,
    workGPCI: 1.05,
    peGPCI: 1.42,
    mpGPCI: 1.02,
    wageIndex: 1.38,
    tier: 'very_high',
  },
  'Los Angeles-Long Beach-Anaheim, CA': {
    fips: '06037',
    county: 'Los Angeles',
    state: 'CA',
    costIndex: 1.28,
    workGPCI: 1.04,
    peGPCI: 1.35,
    mpGPCI: 0.92,
    wageIndex: 1.30,
    tier: 'very_high',
  },
  'Boston-Cambridge-Newton, MA-NH': {
    fips: '25025',
    county: 'Suffolk',
    state: 'MA',
    costIndex: 1.23,
    workGPCI: 1.04,
    peGPCI: 1.28,
    mpGPCI: 0.85,
    wageIndex: 1.25,
    tier: 'very_high',
  },

  // High Cost Metro Areas
  'Seattle-Tacoma-Bellevue, WA': {
    fips: '53033',
    county: 'King',
    state: 'WA',
    costIndex: 1.15,
    workGPCI: 1.02,
    peGPCI: 1.18,
    mpGPCI: 0.85,
    wageIndex: 1.16,
    tier: 'high',
  },
  'Washington-Arlington-Alexandria, DC-VA-MD-WV': {
    fips: '11001',
    county: 'District of Columbia',
    state: 'DC',
    costIndex: 1.21,
    workGPCI: 1.04,
    peGPCI: 1.25,
    mpGPCI: 0.88,
    wageIndex: 1.22,
    tier: 'very_high',
  },
  'Chicago-Naperville-Elgin, IL-IN-WI': {
    fips: '17031',
    county: 'Cook',
    state: 'IL',
    costIndex: 1.10,
    workGPCI: 1.02,
    peGPCI: 1.12,
    mpGPCI: 1.05,
    wageIndex: 1.08,
    tier: 'high',
  },
  'Miami-Fort Lauderdale-Pompano Beach, FL': {
    fips: '12086',
    county: 'Miami-Dade',
    state: 'FL',
    costIndex: 1.08,
    workGPCI: 1.00,
    peGPCI: 1.12,
    mpGPCI: 1.38,
    wageIndex: 1.05,
    tier: 'high',
  },
  'Denver-Aurora-Lakewood, CO': {
    fips: '08031',
    county: 'Denver',
    state: 'CO',
    costIndex: 1.08,
    workGPCI: 1.02,
    peGPCI: 1.10,
    mpGPCI: 0.85,
    wageIndex: 1.06,
    tier: 'high',
  },

  // Average Cost Metro Areas
  'Phoenix-Mesa-Chandler, AZ': {
    fips: '04013',
    county: 'Maricopa',
    state: 'AZ',
    costIndex: 1.02,
    workGPCI: 1.00,
    peGPCI: 1.02,
    mpGPCI: 0.95,
    wageIndex: 1.00,
    tier: 'average',
  },
  'Atlanta-Sandy Springs-Alpharetta, GA': {
    fips: '13121',
    county: 'Fulton',
    state: 'GA',
    costIndex: 1.02,
    workGPCI: 1.00,
    peGPCI: 1.04,
    mpGPCI: 0.92,
    wageIndex: 1.02,
    tier: 'average',
  },
  'Dallas-Fort Worth-Arlington, TX': {
    fips: '48113',
    county: 'Dallas',
    state: 'TX',
    costIndex: 1.04,
    workGPCI: 1.01,
    peGPCI: 1.05,
    mpGPCI: 0.98,
    wageIndex: 1.02,
    tier: 'high',
  },
  'Houston-The Woodlands-Sugar Land, TX': {
    fips: '48201',
    county: 'Harris',
    state: 'TX',
    costIndex: 1.05,
    workGPCI: 1.01,
    peGPCI: 1.06,
    mpGPCI: 1.02,
    wageIndex: 1.04,
    tier: 'high',
  },
};

/**
 * Get cost index for a state
 */
export function getStateCostIndex(stateCode: string): StateCostSummary | null {
  const state = stateCode.toUpperCase();
  return STATE_COST_INDICES[state] || null;
}

/**
 * Get cost index for a metro area
 */
export function getMetroCostIndex(metroName: string): CountyCostIndex | null {
  // Try exact match first
  if (METRO_AREA_INDICES[metroName]) {
    return METRO_AREA_INDICES[metroName];
  }

  // Try partial match
  const lowerMetro = metroName.toLowerCase();
  for (const [name, data] of Object.entries(METRO_AREA_INDICES)) {
    if (name.toLowerCase().includes(lowerMetro) || lowerMetro.includes(name.toLowerCase())) {
      return data;
    }
  }

  return null;
}

/**
 * Get cost adjustment factor for a location
 * Returns a multiplier to apply to cost estimates
 */
export function getCostAdjustmentFactor(
  stateCode: string,
  zipCode?: string,
  _county?: string
): number {
  // First try to find metro area by zip code prefix
  if (zipCode) {
    const metroIndex = findMetroByZip(zipCode);
    if (metroIndex) {
      return metroIndex.costIndex;
    }
  }

  // Fall back to state average
  const stateIndex = getStateCostIndex(stateCode);
  if (stateIndex) {
    return stateIndex.averageCostIndex;
  }

  // Default to national average
  return 1.0;
}

/**
 * Find metro area by ZIP code prefix
 */
function findMetroByZip(zipCode: string): CountyCostIndex | null {
  const prefix = zipCode.substring(0, 3);

  // Major metro area ZIP prefixes
  const zipToMetro: Record<string, string> = {
    // San Francisco
    '940': 'San Francisco-Oakland-Berkeley, CA',
    '941': 'San Francisco-Oakland-Berkeley, CA',
    '944': 'San Francisco-Oakland-Berkeley, CA',
    // San Jose
    '950': 'San Jose-Sunnyvale-Santa Clara, CA',
    '951': 'San Jose-Sunnyvale-Santa Clara, CA',
    // New York
    '100': 'New York-Newark-Jersey City, NY-NJ-PA',
    '101': 'New York-Newark-Jersey City, NY-NJ-PA',
    '102': 'New York-Newark-Jersey City, NY-NJ-PA',
    '103': 'New York-Newark-Jersey City, NY-NJ-PA',
    '104': 'New York-Newark-Jersey City, NY-NJ-PA',
    // Los Angeles
    '900': 'Los Angeles-Long Beach-Anaheim, CA',
    '901': 'Los Angeles-Long Beach-Anaheim, CA',
    '902': 'Los Angeles-Long Beach-Anaheim, CA',
    '903': 'Los Angeles-Long Beach-Anaheim, CA',
    '904': 'Los Angeles-Long Beach-Anaheim, CA',
    '905': 'Los Angeles-Long Beach-Anaheim, CA',
    '906': 'Los Angeles-Long Beach-Anaheim, CA',
    '907': 'Los Angeles-Long Beach-Anaheim, CA',
    '908': 'Los Angeles-Long Beach-Anaheim, CA',
    // Boston
    '021': 'Boston-Cambridge-Newton, MA-NH',
    '022': 'Boston-Cambridge-Newton, MA-NH',
    // Seattle
    '980': 'Seattle-Tacoma-Bellevue, WA',
    '981': 'Seattle-Tacoma-Bellevue, WA',
    // Washington DC
    '200': 'Washington-Arlington-Alexandria, DC-VA-MD-WV',
    '201': 'Washington-Arlington-Alexandria, DC-VA-MD-WV',
    '202': 'Washington-Arlington-Alexandria, DC-VA-MD-WV',
    // Chicago
    '606': 'Chicago-Naperville-Elgin, IL-IN-WI',
    '607': 'Chicago-Naperville-Elgin, IL-IN-WI',
    // Miami
    '331': 'Miami-Fort Lauderdale-Pompano Beach, FL',
    '332': 'Miami-Fort Lauderdale-Pompano Beach, FL',
    '333': 'Miami-Fort Lauderdale-Pompano Beach, FL',
    // Denver
    '802': 'Denver-Aurora-Lakewood, CO',
    '803': 'Denver-Aurora-Lakewood, CO',
    // Phoenix
    '850': 'Phoenix-Mesa-Chandler, AZ',
    '851': 'Phoenix-Mesa-Chandler, AZ',
    '852': 'Phoenix-Mesa-Chandler, AZ',
    // Atlanta
    '303': 'Atlanta-Sandy Springs-Alpharetta, GA',
    '304': 'Atlanta-Sandy Springs-Alpharetta, GA',
    '305': 'Atlanta-Sandy Springs-Alpharetta, GA',
    // Dallas
    '750': 'Dallas-Fort Worth-Arlington, TX',
    '751': 'Dallas-Fort Worth-Arlington, TX',
    '752': 'Dallas-Fort Worth-Arlington, TX',
    '753': 'Dallas-Fort Worth-Arlington, TX',
    // Houston
    '770': 'Houston-The Woodlands-Sugar Land, TX',
    '771': 'Houston-The Woodlands-Sugar Land, TX',
    '772': 'Houston-The Woodlands-Sugar Land, TX',
    '773': 'Houston-The Woodlands-Sugar Land, TX',
    '774': 'Houston-The Woodlands-Sugar Land, TX',
    '775': 'Houston-The Woodlands-Sugar Land, TX',
  };

  const metroName = zipToMetro[prefix];
  if (metroName) {
    return METRO_AREA_INDICES[metroName] || null;
  }

  return null;
}

/**
 * Adjust a cost estimate based on location
 */
export function adjustCostForLocation(
  baseCost: number,
  stateCode: string,
  zipCode?: string
): number {
  const factor = getCostAdjustmentFactor(stateCode, zipCode);
  return Math.round(baseCost * factor);
}

/**
 * Get tier description
 */
export function getTierDescription(tier: CountyCostIndex['tier']): string {
  switch (tier) {
    case 'very_low':
      return 'Very Low Cost (15%+ below average)';
    case 'low':
      return 'Below Average Cost (5-15% below average)';
    case 'average':
      return 'Average Cost (within 5% of average)';
    case 'high':
      return 'Above Average Cost (5-15% above average)';
    case 'very_high':
      return 'Very High Cost (15%+ above average)';
  }
}

/**
 * Get all states sorted by cost index
 */
export function getStatesByExpense(ascending: boolean = true): StateCostSummary[] {
  const states = Object.values(STATE_COST_INDICES);
  states.sort((a, b) => {
    const diff = a.averageCostIndex - b.averageCostIndex;
    return ascending ? diff : -diff;
  });
  return states;
}

/**
 * Estimate annual healthcare cost variance by state
 * Returns how much more/less typical costs would be compared to national average
 */
export function estimateAnnualCostVariance(
  nationalAverageCost: number,
  stateCode: string,
  zipCode?: string
): {
  adjustedCost: number;
  variance: number;
  percentageChange: number;
  tier: CountyCostIndex['tier'];
} {
  const factor = getCostAdjustmentFactor(stateCode, zipCode);
  const adjustedCost = Math.round(nationalAverageCost * factor);
  const variance = adjustedCost - nationalAverageCost;
  const percentageChange = Math.round((factor - 1) * 100);

  let tier: CountyCostIndex['tier'];
  if (factor >= 1.15) tier = 'very_high';
  else if (factor >= 1.05) tier = 'high';
  else if (factor >= 0.95) tier = 'average';
  else if (factor >= 0.85) tier = 'low';
  else tier = 'very_low';

  return {
    adjustedCost,
    variance,
    percentageChange,
    tier,
  };
}
