/**
 * Actuarial Risk Curves for Add-On Insurance
 *
 * Uses realistic actuarial data patterns to calculate probability scores
 * based on age-specific risk factors and utilization patterns.
 */

import type { AddOnInsuranceCategory } from '@/types/addOnInsurance';

/**
 * Actuarial curve result
 */
export interface ActuarialResult {
  probabilityScore: number; // 0-100
  riskLevel: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  utilizationRate: number; // Expected annual utilization (0-1)
  costMultiplier: number; // Age-based cost adjustment (0.5-3.0)
  reasoning: string;
}

/**
 * Sigmoid function for smooth transitions
 * @param x - Input value
 * @param midpoint - Inflection point
 * @param steepness - Rate of change (higher = steeper)
 */
function sigmoid(x: number, midpoint: number, steepness: number): number {
  return 1 / (1 + Math.exp(-steepness * (x - midpoint)));
}

/**
 * Gaussian (bell curve) function for peaked distributions
 * @param x - Input value
 * @param mean - Peak location
 * @param stdDev - Width of curve
 */
function gaussian(x: number, mean: number, stdDev: number): number {
  return Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
}

/**
 * Linear interpolation between two points
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Piecewise linear function for complex age patterns
 */
function piecewise(age: number, points: Array<[number, number]>): number {
  // Sort points by age
  const sorted = [...points].sort((a, b) => a[0] - b[0]);

  // Find surrounding points
  for (let i = 0; i < sorted.length - 1; i++) {
    const [age1, value1] = sorted[i];
    const [age2, value2] = sorted[i + 1];

    if (age >= age1 && age <= age2) {
      const t = (age - age1) / (age2 - age1);
      return lerp(value1, value2, t);
    }
  }

  // Outside range - return nearest endpoint
  if (age < sorted[0][0]) return sorted[0][1];
  return sorted[sorted.length - 1][1];
}

/**
 * Dental Insurance Actuarial Curve
 *
 * Pattern:
 * - Ages 0-18: High utilization (cavities, orthodontics, preventive)
 * - Ages 19-50: Moderate utilization (maintenance, occasional procedures)
 * - Ages 51-64: Increasing utilization (crowns, bridges, gum disease)
 * - Ages 65+: High utilization (tooth loss, dentures, complex procedures)
 */
function calculateDentalProbability(age: number): ActuarialResult {
  const points: Array<[number, number]> = [
    [0, 85],    // Infants - moderate (first teeth)
    [5, 95],    // Young children - very high (cavities peak)
    [12, 98],   // Pre-teens - highest (orthodontics)
    [18, 75],   // Young adults - drops
    [30, 70],   // Adults - steady maintenance
    [50, 75],   // Middle age - increasing issues
    [65, 90],   // Seniors - high utilization
    [80, 95],   // Elderly - very high
    [120, 95],
  ];

  const probability = piecewise(age, points);

  // Cost multiplier (younger children and seniors cost more)
  let costMultiplier = 1.0;
  if (age < 18) {
    costMultiplier = 0.8; // Children's dental often cheaper
  } else if (age >= 65) {
    costMultiplier = 1.3; // Complex senior dental work
  }

  // Utilization rate (average visits per year)
  const utilization = age < 18 || age >= 65 ? 0.8 : 0.6;

  let reasoning = '';
  if (age < 18) {
    reasoning = 'High cavity risk and orthodontic needs during childhood development';
  } else if (age >= 65) {
    reasoning = 'Increased risk of tooth loss, gum disease, and complex dental procedures';
  } else {
    reasoning = 'Regular preventive care and maintenance procedures';
  }

  return {
    probabilityScore: Math.round(probability),
    riskLevel: probability >= 85 ? 'very-high' : probability >= 70 ? 'high' : 'moderate',
    utilizationRate: utilization,
    costMultiplier,
    reasoning,
  };
}

/**
 * Vision Insurance Actuarial Curve
 *
 * Pattern:
 * - Ages 0-18: Moderate (developmental vision issues, regular checkups)
 * - Ages 19-39: Low (healthy vision years)
 * - Ages 40-64: Increasing (presbyopia, eye strain, glaucoma risk)
 * - Ages 65+: High (cataracts, macular degeneration, glaucoma)
 */
function calculateVisionProbability(age: number): ActuarialResult {
  const points: Array<[number, number]> = [
    [0, 60],    // Infants - moderate screening
    [8, 75],    // School age - high screening needs
    [18, 55],   // Young adults - drops
    [30, 45],   // Adults - lowest point
    [40, 60],   // Presbyopia begins
    [50, 75],   // Increasing issues
    [60, 85],   // Pre-senior high risk
    [70, 95],   // Senior - very high
    [120, 95],
  ];

  const probability = piecewise(age, points);

  // Cost multiplier
  let costMultiplier = 1.0;
  if (age >= 65) {
    costMultiplier = 1.4; // Cataract surgery, advanced care
  } else if (age >= 40) {
    costMultiplier = 1.1; // Progressive lenses, bifocals
  }

  const utilization = age >= 40 ? 0.7 : 0.4;

  let reasoning = '';
  if (age < 18) {
    reasoning = 'Regular vision screening during developmental years';
  } else if (age >= 65) {
    reasoning = 'High risk of cataracts, macular degeneration, and glaucoma';
  } else if (age >= 40) {
    reasoning = 'Presbyopia and age-related vision changes common after 40';
  } else {
    reasoning = 'Routine vision correction and eye health monitoring';
  }

  return {
    probabilityScore: Math.round(probability),
    riskLevel: probability >= 85 ? 'very-high' : probability >= 70 ? 'high' : probability >= 50 ? 'moderate' : 'low',
    utilizationRate: utilization,
    costMultiplier,
    reasoning,
  };
}

/**
 * Accident Insurance Actuarial Curve
 *
 * Pattern:
 * - Ages 0-5: High (learning to walk, playground accidents)
 * - Ages 6-15: Very high (sports, risky play)
 * - Ages 16-25: Peak (driving, risky behavior, sports)
 * - Ages 26-50: Moderate (stable years)
 * - Ages 51-70: Increasing (fall risk begins)
 * - Ages 71+: High (fall risk, fragility)
 */
function calculateAccidentProbability(age: number): ActuarialResult {
  const points: Array<[number, number]> = [
    [0, 70],    // Infants
    [3, 85],    // Toddlers - high
    [10, 90],   // Children - very high (sports/play)
    [16, 95],   // Teens - peak (driving begins)
    [25, 88],   // Young adults - still high
    [35, 60],   // Adults - drops
    [50, 55],   // Middle age - low point
    [65, 70],   // Pre-senior - increasing falls
    [75, 85],   // Seniors - high fall risk
    [90, 95],   // Elderly - very high
    [120, 95],
  ];

  const probability = piecewise(age, points);

  // Cost multiplier based on injury severity
  let costMultiplier = 1.0;
  if (age >= 70) {
    costMultiplier = 1.5; // More severe injuries, longer recovery
  } else if (age >= 16 && age <= 25) {
    costMultiplier = 1.2; // Vehicle accidents, sports injuries
  }

  const utilization = (age >= 70 || (age >= 5 && age <= 25)) ? 0.15 : 0.08;

  let reasoning = '';
  if (age <= 5) {
    reasoning = 'High accident risk during early childhood development';
  } else if (age >= 16 && age <= 25) {
    reasoning = 'Peak accident risk from driving, sports, and risky behavior';
  } else if (age >= 70) {
    reasoning = 'Increased fall risk and injury severity in older adults';
  } else {
    reasoning = 'General accident protection for unexpected injuries';
  }

  return {
    probabilityScore: Math.round(probability),
    riskLevel: probability >= 85 ? 'very-high' : probability >= 70 ? 'high' : probability >= 55 ? 'moderate' : 'low',
    utilizationRate: utilization,
    costMultiplier,
    reasoning,
  };
}

/**
 * Critical Illness Insurance Actuarial Curve
 *
 * Pattern:
 * - Ages 0-29: Very low (rare critical illness)
 * - Ages 30-39: Low but increasing (early onset possible)
 * - Ages 40-49: Moderate (risk begins to rise)
 * - Ages 50-64: High (exponential increase in cancer, heart disease, stroke)
 * - Ages 65+: Very high (peak critical illness age)
 */
function calculateCriticalIllnessProbability(age: number): ActuarialResult {
  // Exponential curve starting around age 40
  const baseScore = sigmoid(age, 50, 0.08) * 95;

  // Boost for peak risk ages
  let probability = baseScore;
  if (age >= 55 && age <= 75) {
    probability = Math.min(100, baseScore + 10);
  }

  // Cost multiplier (older = more expensive coverage)
  let costMultiplier = 1.0;
  if (age >= 60) {
    costMultiplier = 2.0; // Much higher premiums
  } else if (age >= 50) {
    costMultiplier = 1.5;
  } else if (age >= 40) {
    costMultiplier = 1.2;
  } else if (age < 30) {
    costMultiplier = 0.7; // Lower premiums for young
  }

  // Utilization (annual claim rate)
  const utilization = age >= 50 ? 0.03 : age >= 40 ? 0.015 : 0.005;

  let reasoning = '';
  if (age < 30) {
    reasoning = 'Low risk but provides financial protection for rare critical events';
  } else if (age >= 30 && age < 40) {
    reasoning = 'Early onset critical illness possible; best rates available now';
  } else if (age >= 40 && age < 50) {
    reasoning = 'Critical illness risk begins to increase significantly after 40';
  } else if (age >= 50 && age < 65) {
    reasoning = 'High risk period for cancer, heart attack, and stroke';
  } else {
    reasoning = 'Peak age for critical illness; provides financial security for treatment';
  }

  return {
    probabilityScore: Math.round(probability),
    riskLevel: probability >= 80 ? 'very-high' : probability >= 60 ? 'high' : probability >= 35 ? 'moderate' : probability >= 15 ? 'low' : 'very-low',
    utilizationRate: utilization,
    costMultiplier,
    reasoning,
  };
}

/**
 * Hospital Indemnity Insurance Actuarial Curve
 *
 * Pattern:
 * - Ages 0-18: Moderate (childhood illnesses, injuries)
 * - Ages 19-49: Low (healthy years)
 * - Ages 50-64: Moderate (chronic conditions emerge)
 * - Ages 65+: High (frequent hospitalizations)
 */
function calculateHospitalIndemnityProbability(age: number): ActuarialResult {
  const points: Array<[number, number]> = [
    [0, 55],    // Infants - moderate risk
    [5, 40],    // Children - low
    [18, 35],   // Young adults - lowest
    [40, 40],   // Adults - stable
    [50, 55],   // Middle age - increasing
    [60, 70],   // Pre-senior - rising
    [70, 85],   // Seniors - high
    [80, 95],   // Elderly - very high
    [120, 98],
  ];

  const probability = piecewise(age, points);

  // Cost multiplier
  let costMultiplier = 1.0;
  if (age >= 70) {
    costMultiplier = 1.6; // Higher claims
  } else if (age >= 60) {
    costMultiplier = 1.3;
  } else if (age >= 50) {
    costMultiplier = 1.1;
  }

  // Average hospital days per year
  const utilization = age >= 65 ? 0.25 : age >= 50 ? 0.12 : 0.05;

  let reasoning = '';
  if (age >= 70) {
    reasoning = 'Very high hospitalization risk; provides daily cash benefits';
  } else if (age >= 50) {
    reasoning = 'Hospitalization risk increases with chronic conditions';
  } else if (age < 18) {
    reasoning = 'Provides coverage for unexpected childhood illnesses and injuries';
  } else {
    reasoning = 'Supplements health insurance for unexpected hospital stays';
  }

  return {
    probabilityScore: Math.round(probability),
    riskLevel: probability >= 80 ? 'very-high' : probability >= 65 ? 'high' : probability >= 45 ? 'moderate' : 'low',
    utilizationRate: utilization,
    costMultiplier,
    reasoning,
  };
}

/**
 * Disability Insurance (Income Protection) Actuarial Curve
 *
 * Pattern:
 * - Ages 18-25: Low (entry level workers, lower income)
 * - Ages 26-60: Very high (peak earning years, family responsibilities)
 * - Ages 61-64: Moderate (near retirement)
 * - Ages 65+: Very low (retired, no earned income)
 */
function calculateDisabilityProbability(age: number): ActuarialResult {
  // Bell curve centered around working years
  const workingYears = gaussian(age, 45, 18) * 100;

  // Zero out before 18 and after 64 (not working)
  let probability = 0;
  if (age >= 18 && age < 65) {
    probability = workingYears;
    // Peak during prime working years
    if (age >= 30 && age <= 55) {
      probability = Math.min(100, probability + 15);
    }
  } else if (age >= 65) {
    probability = 15; // Very low - retired
  }

  // Cost multiplier based on disability risk
  let costMultiplier = 1.0;
  if (age >= 50) {
    costMultiplier = 1.4; // Higher disability risk
  } else if (age >= 40) {
    costMultiplier = 1.2;
  } else if (age < 25) {
    costMultiplier = 0.9; // Lower premiums for young
  }

  // Annual disability claim rate
  const utilization = age >= 40 && age < 65 ? 0.04 : age >= 25 && age < 40 ? 0.02 : 0.01;

  let reasoning = '';
  if (age < 18) {
    reasoning = 'Not applicable - no earned income';
  } else if (age >= 18 && age < 25) {
    reasoning = 'Early career; lower income to protect but good rates available';
  } else if (age >= 25 && age < 40) {
    reasoning = 'Critical protection during family-building and career-growth years';
  } else if (age >= 40 && age < 55) {
    reasoning = 'Peak earning years; essential income protection for family';
  } else if (age >= 55 && age < 65) {
    reasoning = 'Pre-retirement income protection; higher disability risk';
  } else {
    reasoning = 'Not applicable - retired with no earned income to protect';
  }

  return {
    probabilityScore: Math.round(probability),
    riskLevel: probability >= 80 ? 'very-high' : probability >= 60 ? 'high' : probability >= 30 ? 'moderate' : probability >= 10 ? 'low' : 'very-low',
    utilizationRate: utilization,
    costMultiplier,
    reasoning,
  };
}

/**
 * Long-Term Care Insurance Actuarial Curve
 *
 * Pattern:
 * - Ages 0-39: Very low (rare need)
 * - Ages 40-49: Low (early onset possible but rare)
 * - Ages 50-59: Moderate (best time to buy - lower rates)
 * - Ages 60-74: High (risk increases, still insurable)
 * - Ages 75+: Very high (may be uninsurable, but highest need)
 */
function calculateLongTermCareProbability(age: number): ActuarialResult {
  // Exponential growth after age 50
  const baseScore = sigmoid(age, 60, 0.10) * 95;

  let probability = baseScore;

  // Boost for all ages 50+ to ensure increasing pattern
  if (age >= 50 && age < 60) {
    probability = Math.max(probability, 65 + (age - 50)); // Gradual increase
  } else if (age >= 60 && age < 70) {
    probability = Math.max(probability, 75 + (age - 60)); // Continue increasing
  } else if (age >= 70) {
    probability = Math.max(probability, 85 + Math.min(10, age - 70)); // Very high for seniors
  }

  // Cost multiplier (exponentially more expensive with age)
  let costMultiplier = 1.0;
  if (age >= 70) {
    costMultiplier = 3.0; // Very expensive or uninsurable
  } else if (age >= 65) {
    costMultiplier = 2.2;
  } else if (age >= 60) {
    costMultiplier = 1.6;
  } else if (age >= 55) {
    costMultiplier = 1.3;
  } else if (age >= 50) {
    costMultiplier = 1.0; // Sweet spot
  } else {
    costMultiplier = 0.8; // Lower but less urgent
  }

  // Lifetime probability of needing LTC
  const utilization = age >= 65 ? 0.7 : age >= 50 ? 0.5 : 0.3;

  let reasoning = '';
  if (age < 40) {
    reasoning = 'Very low need; wait until age 50 for better actuarial fit';
  } else if (age >= 40 && age < 50) {
    reasoning = 'Planning ahead possible but premiums higher for years before use';
  } else if (age >= 50 && age < 60) {
    reasoning = 'Optimal age to purchase - balance of cost and future need';
  } else if (age >= 60 && age < 70) {
    reasoning = 'Important to secure coverage before rates become prohibitive';
  } else if (age >= 70 && age < 80) {
    reasoning = 'High need but very expensive; may be difficult to qualify';
  } else {
    reasoning = 'Critical need but likely uninsurable; consider Medicaid planning';
  }

  return {
    probabilityScore: Math.round(probability),
    riskLevel: probability >= 80 ? 'very-high' : probability >= 60 ? 'high' : probability >= 40 ? 'moderate' : probability >= 15 ? 'low' : 'very-low',
    utilizationRate: utilization,
    costMultiplier,
    reasoning,
  };
}

/**
 * Term Life Insurance Actuarial Curve
 *
 * Pattern:
 * - Ages 18-25: Low (few dependents)
 * - Ages 26-45: Very high (peak family responsibility years)
 * - Ages 46-60: High (still working, children older)
 * - Ages 61-70: Moderate (near retirement)
 * - Ages 71+: Low (term insurance typically expires)
 */
function calculateTermLifeProbability(age: number): ActuarialResult {
  // Bell curve centered around family years
  const familyYears = gaussian(age, 40, 15) * 100;

  let probability = familyYears;

  // Peak during prime family years
  if (age >= 30 && age <= 50) {
    probability = Math.min(100, probability + 10);
  }

  // Reduce for seniors (typically not buying term)
  if (age >= 70) {
    probability = Math.max(15, probability - 40);
  }

  // Cost multiplier based on mortality risk
  let costMultiplier = 1.0;
  if (age >= 60) {
    costMultiplier = 2.5; // Much higher premiums
  } else if (age >= 50) {
    costMultiplier = 1.6;
  } else if (age >= 40) {
    costMultiplier = 1.2;
  } else if (age < 30) {
    costMultiplier = 0.7; // Lowest premiums
  }

  // Mortality-based utilization (annual death rate)
  const utilization = age >= 60 ? 0.015 : age >= 50 ? 0.008 : age >= 40 ? 0.004 : 0.001;

  let reasoning = '';
  if (age < 25) {
    reasoning = 'Low need unless dependents; excellent rates for future planning';
  } else if (age >= 25 && age < 40) {
    reasoning = 'Critical protection for growing families and mortgage obligations';
  } else if (age >= 40 && age < 55) {
    reasoning = 'Essential coverage for family income and college funding';
  } else if (age >= 55 && age < 65) {
    reasoning = 'Income replacement until retirement; rates increase significantly';
  } else if (age >= 65 && age < 75) {
    reasoning = 'Limited need post-retirement; consider permanent life if needed';
  } else {
    reasoning = 'Term insurance typically not cost-effective; consider final expense';
  }

  return {
    probabilityScore: Math.round(probability),
    riskLevel: probability >= 80 ? 'very-high' : probability >= 60 ? 'high' : probability >= 35 ? 'moderate' : 'low',
    utilizationRate: utilization,
    costMultiplier,
    reasoning,
  };
}

/**
 * Main actuarial calculation function
 *
 * @param age - Person's age (0-120)
 * @param category - Type of add-on insurance
 * @returns Actuarial analysis with probability, risk, and cost data
 */
export function calculateActuarialProbability(
  age: number,
  category: AddOnInsuranceCategory
): ActuarialResult {
  // Validate age
  const validAge = Math.max(0, Math.min(120, age));

  switch (category) {
    case 'dental':
      return calculateDentalProbability(validAge);
    case 'vision':
      return calculateVisionProbability(validAge);
    case 'accident':
      return calculateAccidentProbability(validAge);
    case 'critical-illness':
      return calculateCriticalIllnessProbability(validAge);
    case 'hospital-indemnity':
      return calculateHospitalIndemnityProbability(validAge);
    case 'disability':
      return calculateDisabilityProbability(validAge);
    case 'long-term-care':
      return calculateLongTermCareProbability(validAge);
    case 'life':
      return calculateTermLifeProbability(validAge);
    default:
      // Default fallback
      return {
        probabilityScore: 50,
        riskLevel: 'moderate',
        utilizationRate: 0.1,
        costMultiplier: 1.0,
        reasoning: 'Standard recommendation',
      };
  }
}

/**
 * Calculate actuarial probability for multiple ages (household)
 * Returns the maximum probability across all ages
 */
export function calculateHouseholdActuarialProbability(
  ages: number[],
  category: AddOnInsuranceCategory
): ActuarialResult {
  if (ages.length === 0) {
    return calculateActuarialProbability(35, category); // Default to 35
  }

  // Calculate for each age
  const results = ages.map(age => calculateActuarialProbability(age, category));

  // Return the highest probability (most need)
  return results.reduce((max, current) =>
    current.probabilityScore > max.probabilityScore ? current : max
  );
}

/**
 * Get age-adjusted cost estimate
 *
 * @param baseCost - Base monthly cost
 * @param age - Person's age
 * @param category - Insurance category
 * @returns Adjusted monthly cost
 */
export function getAgeAdjustedCost(
  baseCost: number,
  age: number,
  category: AddOnInsuranceCategory
): number {
  const actuarial = calculateActuarialProbability(age, category);
  return Math.round(baseCost * actuarial.costMultiplier);
}
