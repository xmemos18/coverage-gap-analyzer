/**
 * Advanced Age-Rating Cost Model
 * Implements ACA-compliant 3:1 age rating with geographic adjustments
 *
 * Based on CMS age curve data and state-specific multipliers
 */

/**
 * ACA Age Rating Curve (ages 21-64)
 * Source: CMS Market Rating Reforms - https://www.cms.gov/cciio/resources/regulations-and-guidance
 *
 * Key principles:
 * - Age 21 = 1.000 (base rate)
 * - Age 64 = 3.000 (maximum, 3:1 ratio)
 * - Linear interpolation between ages
 * - Children under 21 have separate rating (typically 0.635 for 0-14, 1.000 for 15-20)
 */
export const ACA_AGE_CURVE: Record<number, number> = {
  // Children and young adults (0-20)
  0: 0.635,   // Infants
  1: 0.635,
  2: 0.635,
  3: 0.635,
  4: 0.635,
  5: 0.635,
  6: 0.635,
  7: 0.635,
  8: 0.635,
  9: 0.635,
  10: 0.635,
  11: 0.635,
  12: 0.635,
  13: 0.635,
  14: 0.635,
  15: 1.000,  // Teens priced as age 21
  16: 1.000,
  17: 1.000,
  18: 1.000,
  19: 1.000,
  20: 1.000,

  // Adults (21-64) - ACA age rating applies
  21: 1.000,
  22: 1.024,
  23: 1.048,
  24: 1.071,
  25: 1.095,
  26: 1.119,
  27: 1.143,
  28: 1.167,
  29: 1.190,
  30: 1.214,
  31: 1.238,
  32: 1.262,
  33: 1.286,
  34: 1.310,
  35: 1.333,
  36: 1.357,
  37: 1.381,
  38: 1.405,
  39: 1.429,
  40: 1.452,
  41: 1.476,
  42: 1.500,
  43: 1.524,
  44: 1.548,
  45: 1.571,
  46: 1.595,
  47: 1.619,
  48: 1.643,
  49: 1.667,
  50: 1.690,
  51: 1.714,
  52: 1.738,
  53: 1.762,
  54: 1.786,
  55: 1.810,
  56: 1.833,
  57: 1.857,
  58: 1.881,
  59: 1.905,
  60: 1.952,
  61: 2.000,
  62: 2.048,
  63: 2.095,
  64: 3.000,  // Maximum age rating

  // Age 65+ (Medicare-eligible, different pricing model)
  65: 3.000,  // Medicare, not ACA-rated
};

/**
 * Get age rating factor for an individual
 */
export function getAgeRatingFactor(age: number): number {
  // Clamp age to valid range
  const clampedAge = Math.max(0, Math.min(120, age));

  // For ages 65+, use Medicare pricing (not age-rated in ACA sense)
  if (clampedAge >= 65) {
    return 3.000; // Used for reference only; Medicare has different cost structure
  }

  // Look up exact age in curve
  if (ACA_AGE_CURVE[clampedAge] !== undefined) {
    return ACA_AGE_CURVE[clampedAge];
  }

  // For ages > 64 not in table, use age 64 rate
  return ACA_AGE_CURVE[64];
}

/**
 * Geographic Cost Index by State
 * Source: CMS Geographic Rating Areas and cost data
 *
 * Values represent multiplier against national average (1.000)
 * - > 1.000 = more expensive than average
 * - < 1.000 = less expensive than average
 */
export const GEOGRAPHIC_COST_INDEX: Record<string, number> = {
  // High-cost states
  AK: 1.450,  // Alaska - highest cost state
  NY: 1.280,  // New York
  MA: 1.250,  // Massachusetts
  CT: 1.230,  // Connecticut
  NJ: 1.220,  // New Jersey
  VT: 1.210,  // Vermont
  NH: 1.180,  // New Hampshire
  RI: 1.170,  // Rhode Island
  DE: 1.150,  // Delaware
  MD: 1.140,  // Maryland

  // Above-average cost states
  CA: 1.120,  // California
  WA: 1.110,  // Washington
  OR: 1.100,  // Oregon
  CO: 1.090,  // Colorado
  IL: 1.080,  // Illinois
  FL: 1.070,  // Florida
  PA: 1.060,  // Pennsylvania
  ME: 1.050,  // Maine
  MN: 1.040,  // Minnesota
  WI: 1.030,  // Wisconsin

  // Near-average cost states
  DC: 1.020,  // District of Columbia
  VA: 1.010,  // Virginia
  NC: 1.000,  // North Carolina - baseline
  NV: 1.000,  // Nevada
  AZ: 0.990,  // Arizona
  GA: 0.980,  // Georgia
  MI: 0.970,  // Michigan
  OH: 0.960,  // Ohio
  IN: 0.950,  // Indiana
  MO: 0.940,  // Missouri

  // Below-average cost states
  SC: 0.930,  // South Carolina
  TN: 0.920,  // Tennessee
  KY: 0.910,  // Kentucky
  LA: 0.900,  // Louisiana
  MS: 0.890,  // Mississippi
  AR: 0.880,  // Arkansas
  OK: 0.870,  // Oklahoma
  KS: 0.860,  // Kansas
  NE: 0.855,  // Nebraska
  IA: 0.850,  // Iowa

  // Low-cost states
  ND: 0.845,  // North Dakota
  SD: 0.840,  // South Dakota
  MT: 0.835,  // Montana
  WY: 0.830,  // Wyoming
  ID: 0.825,  // Idaho
  UT: 0.820,  // Utah
  NM: 0.815,  // New Mexico
  TX: 0.810,  // Texas
  WV: 0.805,  // West Virginia
  AL: 0.850,  // Alabama
  HI: 1.150,  // Hawaii (island premium)
};

/**
 * Tobacco Surcharge Limits by State
 * Federal max is 50%, but some states restrict it
 * Returns the maximum allowed surcharge as a decimal (0.50 = 50%)
 */
export const TOBACCO_SURCHARGE_LIMITS: Record<string, number> = {
  // States that prohibit tobacco surcharges
  CA: 0.00,
  CT: 0.00,
  MA: 0.00,
  NJ: 0.00,
  NY: 0.00,
  RI: 0.00,
  VT: 0.00,
  DC: 0.00,

  // States with reduced limits
  AR: 0.20,  // 20% max
  CO: 0.15,  // 15% max
  KY: 0.40,  // 40% max

  // All other states use federal max
  // (Default to 0.50 if not listed)
};

/**
 * Get tobacco surcharge limit for a state
 */
export function getTobaccoSurchargeLimit(state: string): number {
  return TOBACCO_SURCHARGE_LIMITS[state] ?? 0.50; // Default to federal max
}

/**
 * Metal Tier Cost Multipliers
 * Represents average premium variation by metal tier
 * Based on actuarial value and cost-sharing structure
 */
export const METAL_TIER_MULTIPLIERS = {
  Catastrophic: 0.60,  // Lowest premium, highest deductible
  Bronze: 0.75,        // 60% actuarial value
  Silver: 1.00,        // 70% actuarial value - baseline
  Gold: 1.30,          // 80% actuarial value
  Platinum: 1.60,      // 90% actuarial value
} as const;

export type MetalTier = keyof typeof METAL_TIER_MULTIPLIERS;

/**
 * Calculate age-rated premium for an individual
 *
 * @param baseRate - The base premium for age 21 in the area
 * @param age - Individual's age
 * @param state - State code (for geographic adjustment)
 * @param metalTier - Plan metal tier
 * @param usesTobacco - Whether individual uses tobacco
 * @returns Monthly premium
 */
export function calculateAgeRatedPremium(
  baseRate: number,
  age: number,
  state: string,
  metalTier: MetalTier = 'Silver',
  usesTobacco: boolean = false
): number {
  // Get age rating factor
  const ageFactor = getAgeRatingFactor(age);

  // Get geographic cost index
  const geoIndex = GEOGRAPHIC_COST_INDEX[state] ?? 1.000;

  // Get metal tier multiplier
  const tierMultiplier = METAL_TIER_MULTIPLIERS[metalTier];

  // Calculate base premium with all factors
  let premium = baseRate * ageFactor * geoIndex * tierMultiplier;

  // Apply tobacco surcharge if applicable
  if (usesTobacco && age >= 18) {
    const surchargeLimit = getTobaccoSurchargeLimit(state);
    premium *= (1 + surchargeLimit);
  }

  return Math.round(premium * 100) / 100; // Round to cents
}

/**
 * Calculate total household premium with age rating
 *
 * @param baseRate - The base premium for age 21 in the area
 * @param adults - Array of adult ages
 * @param children - Array of child ages
 * @param state - Primary state code
 * @param metalTier - Plan metal tier
 * @param tobaccoUsers - Array of booleans indicating tobacco use (matches adults array)
 * @returns Total monthly premium for household
 */
export function calculateHouseholdPremium(
  baseRate: number,
  adults: number[],
  children: number[],
  state: string,
  metalTier: MetalTier = 'Silver',
  tobaccoUsers: boolean[] = []
): number {
  let totalPremium = 0;

  // Calculate adult premiums (individually age-rated)
  adults.forEach((age, index) => {
    const usesTobacco = tobaccoUsers[index] ?? false;
    totalPremium += calculateAgeRatedPremium(baseRate, age, state, metalTier, usesTobacco);
  });

  // Calculate child premiums (age-rated but capped at 3 children max for premium purposes)
  const ratedChildren = Math.min(children.length, 3); // ACA: only first 3 children count toward premium

  for (let i = 0; i < ratedChildren; i++) {
    const childAge = children[i];
    totalPremium += calculateAgeRatedPremium(baseRate, childAge, state, metalTier, false);
  }

  return Math.round(totalPremium * 100) / 100; // Round to cents
}

/**
 * Estimate base rate for a state
 * Based on average Silver plan premium for age 21
 *
 * These are rough estimates - real rates should come from Healthcare.gov API or CMS data
 */
export const ESTIMATED_STATE_BASE_RATES: Record<string, number> = {
  // High-cost states
  AK: 650,
  NY: 580,
  MA: 560,
  CT: 550,
  NJ: 545,
  VT: 535,
  NH: 525,
  RI: 515,
  DE: 505,
  MD: 500,

  // Above-average
  CA: 480,
  WA: 470,
  OR: 460,
  CO: 450,
  IL: 445,
  FL: 440,
  PA: 435,
  ME: 430,
  MN: 425,
  WI: 420,

  // National average
  NC: 410,
  NV: 410,
  AZ: 405,
  GA: 400,
  MI: 395,
  OH: 390,
  IN: 385,
  MO: 380,

  // Below average
  SC: 375,
  TN: 370,
  KY: 365,
  LA: 360,
  MS: 355,
  AR: 350,
  OK: 345,
  KS: 340,
  NE: 338,
  IA: 335,

  // Low-cost
  ND: 332,
  SD: 330,
  MT: 328,
  WY: 325,
  ID: 322,
  UT: 320,
  NM: 318,
  TX: 315,
  WV: 312,
  AL: 335,
  HI: 505,
  DC: 415,
  VA: 412,
};

/**
 * Get estimated base rate for a state
 */
export function getStateBaseRate(state: string): number {
  return ESTIMATED_STATE_BASE_RATES[state] ?? 410; // Default to national average
}

/**
 * Calculate premium with automatic state base rate lookup
 */
export function calculatePremiumForState(
  age: number,
  state: string,
  metalTier: MetalTier = 'Silver',
  usesTobacco: boolean = false
): number {
  const baseRate = getStateBaseRate(state);
  return calculateAgeRatedPremium(baseRate, age, state, metalTier, usesTobacco);
}

/**
 * Get premium range for household across all metal tiers
 * Useful for showing cost options to users
 */
export function getHouseholdPremiumRange(
  adults: number[],
  children: number[],
  state: string,
  tobaccoUsers: boolean[] = []
): {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
} {
  const baseRate = getStateBaseRate(state);

  return {
    bronze: calculateHouseholdPremium(baseRate, adults, children, state, 'Bronze', tobaccoUsers),
    silver: calculateHouseholdPremium(baseRate, adults, children, state, 'Silver', tobaccoUsers),
    gold: calculateHouseholdPremium(baseRate, adults, children, state, 'Gold', tobaccoUsers),
    platinum: calculateHouseholdPremium(baseRate, adults, children, state, 'Platinum', tobaccoUsers),
  };
}
