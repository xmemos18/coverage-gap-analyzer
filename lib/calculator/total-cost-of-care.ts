/**
 * Total Cost of Care (TCC) Modeling
 * Predicts annual healthcare costs including premiums + out-of-pocket expenses
 *
 * Based on actuarial principles and Medical Loss Ratio (MLR) data
 * Helps users choose optimal plan tier (Bronze vs Silver vs Gold vs Platinum)
 */

import type { MetalTier } from './age-rating';

/**
 * Utilization Scenarios
 * Represents different levels of healthcare usage
 */
export type UtilizationScenario = 'minimal' | 'low' | 'medium' | 'high' | 'very-high';

/**
 * Health Status Categories
 * Based on chronic conditions and overall health
 */
export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Expected Annual Healthcare Utilization by Age
 * Source: CMS National Health Expenditure Accounts, CDC data
 * Values represent average annual medical costs BEFORE insurance
 */
export const EXPECTED_UTILIZATION_BY_AGE: Record<string, number> = {
  // Children (0-17) - lower utilization
  '0-4': 3500,    // Infants/toddlers (well-child visits, vaccinations)
  '5-14': 2200,   // School age (generally healthy)
  '15-17': 2800,  // Teens (sports injuries, mental health)

  // Young adults (18-29) - lowest utilization
  '18-24': 3000,  // Young adults (preventive care, accidents)
  '25-29': 3500,  // Starting families (prenatal care potential)

  // Adults (30-49) - moderate utilization
  '30-34': 4200,  // Childbearing age, family care
  '35-44': 5000,  // Middle age, chronic conditions emerging
  '45-49': 6500,  // Pre-retirement, increased health screening

  // Older adults (50-64) - higher utilization
  '50-54': 8500,  // Chronic conditions more common
  '55-59': 10500, // Significant increase in medical needs
  '60-64': 13000, // Approaching Medicare age, highest non-Medicare costs

  // Medicare age (65+) - very high utilization
  '65-74': 15000, // Early Medicare years
  '75-84': 20000, // Advanced age, multiple conditions
  '85+': 25000,   // Very advanced age, intensive care needs
};

/**
 * Get age bracket for utilization lookup
 */
function getAgeBracket(age: number): string {
  if (age < 5) return '0-4';
  if (age < 15) return '5-14';
  if (age < 18) return '15-17';
  if (age < 25) return '18-24';
  if (age < 30) return '25-29';
  if (age < 35) return '30-34';
  if (age < 45) return '35-44';
  if (age < 50) return '45-49';
  if (age < 55) return '50-54';
  if (age < 60) return '55-59';
  if (age < 65) return '60-64';
  if (age < 75) return '65-74';
  if (age < 85) return '75-84';
  return '85+';
}

/**
 * Get expected annual medical costs for an individual
 */
export function getExpectedAnnualCosts(age: number, healthStatus: HealthStatus = 'good'): number {
  const bracket = getAgeBracket(age);
  const baseCost = EXPECTED_UTILIZATION_BY_AGE[bracket] || 5000;

  // Adjust for health status
  const healthMultiplier = {
    excellent: 0.6,  // 40% below average
    good: 1.0,       // Average
    fair: 1.5,       // 50% above average
    poor: 2.5,       // 150% above average (multiple chronic conditions)
  }[healthStatus];

  return Math.round(baseCost * healthMultiplier);
}

/**
 * Chronic Condition Impact
 * Additional annual costs per condition
 */
export const CHRONIC_CONDITION_COSTS: Record<string, number> = {
  diabetes: 8000,              // Insulin, testing supplies, monitoring
  hypertension: 2000,          // Medications, monitoring
  asthma: 3000,                // Inhalers, controller medications
  heartDisease: 12000,         // Medications, cardiology visits, procedures
  cancer: 30000,               // Chemotherapy, radiation, oncology (highly variable)
  copd: 10000,                 // Respiratory therapies, oxygen, medications
  arthritis: 4000,             // Pain management, physical therapy
  mentalHealth: 5000,          // Therapy, medications, psychiatry
  chronicKidneyDisease: 20000, // Dialysis, specialist care
  stroke: 15000,               // Rehabilitation, ongoing care
  alzheimers: 18000,           // Memory care, medications, supervision
  autoimmune: 15000,           // Biologics, specialist care
};

/**
 * Calculate additional costs from chronic conditions
 */
export function getChronicConditionCosts(conditions: string[]): number {
  let totalAdditionalCost = 0;

  for (const condition of conditions) {
    const cost = CHRONIC_CONDITION_COSTS[condition.toLowerCase()];
    if (cost) {
      totalAdditionalCost += cost;
    }
  }

  // Apply scaling factor for multiple conditions (not fully additive)
  if (conditions.length > 1) {
    // Each additional condition adds less (diminishing returns)
    totalAdditionalCost *= 0.85;
  }

  return Math.round(totalAdditionalCost);
}

/**
 * Metal Tier Actuarial Values
 * Percentage of costs covered by insurance (on average)
 */
export const ACTUARIAL_VALUES: Record<MetalTier, number> = {
  Catastrophic: 0.60,  // 60% coverage, 40% patient responsibility
  Bronze: 0.60,        // 60% coverage
  Silver: 0.70,        // 70% coverage
  Gold: 0.80,          // 80% coverage
  Platinum: 0.90,      // 90% coverage
};

/**
 * Plan Cost-Sharing Structure
 * Typical deductibles and OOP maximums by metal tier
 */
export interface CostSharingStructure {
  deductible: number;
  oopMaximum: number;
  primaryCareCopay: number;
  specialistCopay: number;
  emergencyRoomCopay: number;
  genericRxCopay: number;
  brandRxCopay: number;
}

export const TYPICAL_COST_SHARING: Record<MetalTier, CostSharingStructure> = {
  Catastrophic: {
    deductible: 9450,      // Very high deductible
    oopMaximum: 9450,      // Same as deductible for catastrophic
    primaryCareCopay: 0,   // After deductible
    specialistCopay: 0,    // After deductible
    emergencyRoomCopay: 0, // After deductible
    genericRxCopay: 15,
    brandRxCopay: 50,
  },
  Bronze: {
    deductible: 7000,
    oopMaximum: 9200,
    primaryCareCopay: 50,  // Some plans have copays before deductible
    specialistCopay: 80,
    emergencyRoomCopay: 500,
    genericRxCopay: 20,
    brandRxCopay: 60,
  },
  Silver: {
    deductible: 4500,
    oopMaximum: 9200,
    primaryCareCopay: 35,
    specialistCopay: 65,
    emergencyRoomCopay: 400,
    genericRxCopay: 15,
    brandRxCopay: 45,
  },
  Gold: {
    deductible: 1500,
    oopMaximum: 8000,
    primaryCareCopay: 25,
    specialistCopay: 45,
    emergencyRoomCopay: 300,
    genericRxCopay: 10,
    brandRxCopay: 35,
  },
  Platinum: {
    deductible: 500,
    oopMaximum: 5000,
    primaryCareCopay: 15,
    specialistCopay: 30,
    emergencyRoomCopay: 200,
    genericRxCopay: 5,
    brandRxCopay: 25,
  },
};

/**
 * Utilization Patterns by Scenario
 * Annual usage for different utilization levels
 */
interface UtilizationPattern {
  primaryCareVisits: number;
  specialistVisits: number;
  erVisits: number;
  urgentCareVisits: number;
  hospitalAdmissions: number;
  genericRxMonths: number;   // Months of generic prescriptions
  brandRxMonths: number;      // Months of brand prescriptions
  imagingTests: number;       // X-rays, MRIs, etc.
  labTests: number;           // Blood work, etc.
}

export const UTILIZATION_PATTERNS: Record<UtilizationScenario, UtilizationPattern> = {
  minimal: {
    primaryCareVisits: 1,      // Annual checkup only
    specialistVisits: 0,
    erVisits: 0,
    urgentCareVisits: 0,
    hospitalAdmissions: 0,
    genericRxMonths: 0,
    brandRxMonths: 0,
    imagingTests: 0,
    labTests: 1,               // Basic annual labs
  },
  low: {
    primaryCareVisits: 2,      // Checkup + 1 sick visit
    specialistVisits: 1,
    erVisits: 0,
    urgentCareVisits: 1,
    hospitalAdmissions: 0,
    genericRxMonths: 3,        // Short-term prescription
    brandRxMonths: 0,
    imagingTests: 1,
    labTests: 2,
  },
  medium: {
    primaryCareVisits: 4,      // Regular monitoring
    specialistVisits: 3,
    erVisits: 0,
    urgentCareVisits: 2,
    hospitalAdmissions: 0,
    genericRxMonths: 6,        // Ongoing medication
    brandRxMonths: 3,
    imagingTests: 2,
    labTests: 4,
  },
  high: {
    primaryCareVisits: 6,      // Chronic condition management
    specialistVisits: 8,
    erVisits: 1,
    urgentCareVisits: 3,
    hospitalAdmissions: 0,
    genericRxMonths: 12,       // Year-round medications
    brandRxMonths: 6,
    imagingTests: 4,
    labTests: 8,
  },
  'very-high': {
    primaryCareVisits: 12,     // Complex medical needs
    specialistVisits: 16,
    erVisits: 2,
    urgentCareVisits: 4,
    hospitalAdmissions: 1,     // One hospitalization
    genericRxMonths: 12,
    brandRxMonths: 12,         // Multiple brand medications
    imagingTests: 8,
    labTests: 12,
  },
};

/**
 * Calculate out-of-pocket costs for a utilization scenario
 */
export function calculateOutOfPocketCosts(
  metalTier: MetalTier,
  utilizationScenario: UtilizationScenario,
  expectedMedicalCosts: number
): {
  estimatedOOP: number;
  deductibleMet: boolean;
  oopMaxReached: boolean;
  breakdown: {
    deductible: number;
    copays: number;
    coinsurance: number;
    prescriptions: number;
  };
} {
  const costSharing = TYPICAL_COST_SHARING[metalTier];
  const utilization = UTILIZATION_PATTERNS[utilizationScenario];
  const actuarialValue = ACTUARIAL_VALUES[metalTier];

  // Calculate copays
  const primaryCareCopays = utilization.primaryCareVisits * costSharing.primaryCareCopay;
  const specialistCopays = utilization.specialistVisits * costSharing.specialistCopay;
  const erCopays = utilization.erVisits * costSharing.emergencyRoomCopay;
  const urgentCareCopays = utilization.urgentCareVisits * 100; // Typical urgent care copay

  const totalCopays = primaryCareCopays + specialistCopays + erCopays + urgentCareCopays;

  // Calculate prescription costs
  const genericRxCosts = utilization.genericRxMonths * costSharing.genericRxCopay;
  const brandRxCosts = utilization.brandRxMonths * costSharing.brandRxCopay;
  const totalRxCosts = genericRxCosts + brandRxCosts;

  // Calculate coinsurance
  // After deductible, patient pays (1 - actuarial value) of remaining costs
  const costsSubjectToCoinsurance = Math.max(0, expectedMedicalCosts - costSharing.deductible - totalCopays);
  const coinsurance = costsSubjectToCoinsurance * (1 - actuarialValue);

  // Calculate deductible portion
  const deductiblePortion = Math.min(costSharing.deductible, expectedMedicalCosts);

  // Total OOP before max
  const totalOOP = deductiblePortion + totalCopays + coinsurance + totalRxCosts;

  // Cap at OOP maximum
  const finalOOP = Math.min(totalOOP, costSharing.oopMaximum);

  return {
    estimatedOOP: Math.round(finalOOP),
    deductibleMet: expectedMedicalCosts >= costSharing.deductible,
    oopMaxReached: totalOOP >= costSharing.oopMaximum,
    breakdown: {
      deductible: Math.round(deductiblePortion),
      copays: Math.round(totalCopays),
      coinsurance: Math.round(coinsurance),
      prescriptions: Math.round(totalRxCosts),
    },
  };
}

/**
 * Total Cost of Care Analysis
 * Compares all metal tiers for a given scenario
 */
export interface TCCAnalysis {
  metalTier: MetalTier;
  annualPremium: number;
  estimatedOOP: number;
  totalAnnualCost: number;
  deductible: number;
  oopMaximum: number;
  ranking: number; // 1 = best value for this scenario
}

/**
 * Calculate Total Cost of Care across all metal tiers
 *
 * @param monthlyPremiums - Monthly premiums for each metal tier
 * @param expectedMedicalCosts - Expected annual medical costs
 * @param utilizationScenario - Expected utilization level
 * @returns Analysis for each metal tier, sorted by total cost
 */
export function analyzeTotalCostOfCare(
  monthlyPremiums: Record<MetalTier, number>,
  expectedMedicalCosts: number,
  utilizationScenario: UtilizationScenario = 'medium'
): TCCAnalysis[] {
  const tiers: MetalTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const analyses: TCCAnalysis[] = [];

  for (const tier of tiers) {
    const annualPremium = monthlyPremiums[tier] * 12;
    const oop = calculateOutOfPocketCosts(tier, utilizationScenario, expectedMedicalCosts);
    const totalAnnualCost = annualPremium + oop.estimatedOOP;

    analyses.push({
      metalTier: tier,
      annualPremium,
      estimatedOOP: oop.estimatedOOP,
      totalAnnualCost,
      deductible: TYPICAL_COST_SHARING[tier].deductible,
      oopMaximum: TYPICAL_COST_SHARING[tier].oopMaximum,
      ranking: 0, // Will be set after sorting
    });
  }

  // Sort by total annual cost (lowest = best)
  analyses.sort((a, b) => a.totalAnnualCost - b.totalAnnualCost);

  // Assign rankings
  analyses.forEach((analysis, index) => {
    analysis.ranking = index + 1;
  });

  return analyses;
}

/**
 * Determine optimal utilization scenario based on health profile
 */
export function determineUtilizationScenario(
  age: number,
  chronicConditions: string[],
  prescriptionCount: string
): UtilizationScenario {
  let score = 0;

  // Age factor
  if (age < 30) score += 0;
  else if (age < 45) score += 1;
  else if (age < 55) score += 2;
  else if (age < 65) score += 3;
  else score += 4;

  // Chronic conditions
  score += chronicConditions.length * 2;

  // Prescriptions
  if (prescriptionCount === '4-or-more') score += 3;
  else if (prescriptionCount === '1-3') score += 1;

  // Map score to scenario
  if (score === 0) return 'minimal';
  if (score <= 2) return 'low';
  if (score <= 5) return 'medium';
  if (score <= 8) return 'high';
  return 'very-high';
}

/**
 * Generate recommendations based on TCC analysis
 */
export function generateTCCRecommendations(
  analyses: TCCAnalysis[],
  utilizationScenario: UtilizationScenario
): string[] {
  const recommendations: string[] = [];
  const best = analyses[0]; // Lowest total cost
  const worst = analyses[analyses.length - 1]; // Highest total cost

  const savings = worst.totalAnnualCost - best.totalAnnualCost;

  // Recommend best value
  recommendations.push(
    `✅ **Best Value: ${best.metalTier}** - Total annual cost: $${best.totalAnnualCost.toLocaleString()} ` +
    `($${best.annualPremium.toLocaleString()} premium + $${best.estimatedOOP.toLocaleString()} OOP)`
  );

  // Explain savings
  if (savings > 500) {
    recommendations.push(
      `💰 Choosing ${best.metalTier} over ${worst.metalTier} saves you $${savings.toLocaleString()}/year`
    );
  }

  // Bronze vs Gold guidance
  const bronze = analyses.find(a => a.metalTier === 'Bronze');
  const gold = analyses.find(a => a.metalTier === 'Gold');

  if (bronze && gold) {
    if (utilizationScenario === 'minimal' || utilizationScenario === 'low') {
      if (bronze.totalAnnualCost < gold.totalAnnualCost) {
        recommendations.push(
          `📊 Since you're healthy with minimal care needs, Bronze's lower premiums ($${(bronze.annualPremium / 12).toFixed(0)}/month) ` +
          `outweigh the higher deductible risk`
        );
      }
    } else if (utilizationScenario === 'high' || utilizationScenario === 'very-high') {
      if (gold.totalAnnualCost < bronze.totalAnnualCost) {
        recommendations.push(
          `🏥 With your expected healthcare needs, Gold's lower deductible ($${gold.deductible}) and better cost-sharing ` +
          `saves money despite higher premiums`
        );
      }
    }
  }

  // OOP max warning
  const highOOP = analyses.filter(a => a.estimatedOOP > 5000);
  if (highOOP.length > 0 && utilizationScenario !== 'minimal') {
    recommendations.push(
      `⚠️ Warning: With ${utilizationScenario} utilization, you may hit high out-of-pocket costs. Consider plans with lower deductibles.`
    );
  }

  return recommendations;
}
