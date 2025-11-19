/**
 * Healthcare Utilization Scorer
 *
 * Analyzes user's healthcare usage patterns to:
 * 1. Score expected utilization (0-100)
 * 2. Recommend appropriate plan structures
 * 3. Adjust cost estimates based on actual usage
 */

import { CalculatorFormData } from '@/types';

export interface UtilizationScore {
  score: number; // 0-100 (0 = minimal use, 100 = very high use)
  level: 'minimal' | 'low' | 'moderate' | 'high' | 'very-high';
  expectedAnnualClaims: number; // Estimated annual medical spending
  recommendedDeductible: 'high' | 'medium' | 'low';
  recommendedPlanType: 'HDHP' | 'PPO' | 'HMO';
  reasoning: string[];
}

/**
 * Calculate utilization score based on healthcare usage patterns
 */
export function calculateUtilizationScore(formData: CalculatorFormData): UtilizationScore {
  let score = 0;
  const reasoning: string[] = [];

  // Doctor visits (0-30 points)
  if (formData.doctorVisitsPerYear === '10+') {
    score += 30;
    reasoning.push('Frequent doctor visits (10+/year) indicate high utilization');
  } else if (formData.doctorVisitsPerYear === '6-10') {
    score += 20;
    reasoning.push('Regular doctor visits (6-10/year) indicate moderate utilization');
  } else if (formData.doctorVisitsPerYear === '3-5') {
    score += 10;
    reasoning.push('Occasional doctor visits (3-5/year)');
  } else if (formData.doctorVisitsPerYear === '0-2') {
    score += 0;
    reasoning.push('Minimal doctor visits (0-2/year)');
  }

  // Specialist visits (0-25 points)
  if (formData.specialistVisitsPerYear === 'monthly-or-more') {
    score += 25;
    reasoning.push('Regular specialist care indicates complex health needs');
  } else if (formData.specialistVisitsPerYear === '1-3') {
    score += 12;
    reasoning.push('Occasional specialist visits');
  }

  // ER visits (0-20 points)
  if (formData.erVisitsPerYear === '3+') {
    score += 20;
    reasoning.push('Multiple ER visits indicate high acute care needs');
  } else if (formData.erVisitsPerYear === '1-2') {
    score += 10;
    reasoning.push('Some emergency care usage');
  }

  // Chronic conditions (0-15 points)
  if (formData.hasChronicConditions) {
    const conditionCount = formData.chronicConditions?.length || 0;
    score += Math.min(15, conditionCount * 5);
    if (conditionCount > 0) {
      reasoning.push(`Managing ${conditionCount} chronic condition(s)`);
    }
  }

  // Prescription medications (0-20 points)
  if (formData.monthlyMedicationCost === 'over-1000') {
    score += 20;
    reasoning.push('Very high medication costs (>$1,000/month)');
  } else if (formData.monthlyMedicationCost === '500-1000') {
    score += 15;
    reasoning.push('High medication costs ($500-$1,000/month)');
  } else if (formData.monthlyMedicationCost === '200-500') {
    score += 10;
    reasoning.push('Moderate medication costs ($200-$500/month)');
  } else if (formData.monthlyMedicationCost === '50-200') {
    score += 5;
    reasoning.push('Low medication costs ($50-$200/month)');
  }

  // Specialty medications (0-10 points)
  if (formData.takesSpecialtyMeds) {
    score += 10;
    reasoning.push('Takes specialty medications (biologics/injectables)');
  }

  // Planned procedures (0-15 points)
  if (formData.plannedProcedures) {
    score += 15;
    reasoning.push('Has planned surgeries/procedures this year');
  }

  // Cap at 100
  score = Math.min(100, score);

  // Determine utilization level
  let level: UtilizationScore['level'];
  if (score >= 75) level = 'very-high';
  else if (score >= 50) level = 'high';
  else if (score >= 25) level = 'moderate';
  else if (score >= 10) level = 'low';
  else level = 'minimal';

  // Estimate annual medical spending (excluding premiums)
  let expectedAnnualClaims = 0;
  if (level === 'very-high') {
    expectedAnnualClaims = 15000; // Major procedures, frequent specialist care
  } else if (level === 'high') {
    expectedAnnualClaims = 8000; // Regular specialist care, chronic conditions
  } else if (level === 'moderate') {
    expectedAnnualClaims = 4000; // Occasional specialist, regular primary care
  } else if (level === 'low') {
    expectedAnnualClaims = 1500; // Occasional primary care
  } else {
    expectedAnnualClaims = 500; // Preventive care only
  }

  // Add medication costs to claims estimate
  if (formData.monthlyMedicationCost) {
    const medCostMap: Record<string, number> = {
      'over-1000': 12000,
      '500-1000': 9000,
      '200-500': 4200,
      '50-200': 1500,
      'under-50': 300,
    };
    expectedAnnualClaims += medCostMap[formData.monthlyMedicationCost] || 0;
  }

  // Recommend deductible level
  let recommendedDeductible: UtilizationScore['recommendedDeductible'];
  if (score >= 50 || formData.plannedProcedures) {
    recommendedDeductible = 'low'; // High utilization = lower deductible
  } else if (score >= 25) {
    recommendedDeductible = 'medium';
  } else {
    recommendedDeductible = 'high'; // Low utilization = high deductible OK
  }

  // Recommend plan type
  let recommendedPlanType: UtilizationScore['recommendedPlanType'];
  if (formData.specialistVisitsPerYear === 'monthly-or-more' || formData.hasChronicConditions) {
    recommendedPlanType = 'PPO'; // Need flexibility for specialists
  } else if (score < 20 && !formData.plannedProcedures) {
    recommendedPlanType = 'HDHP'; // Healthy enough for high-deductible + HSA
  } else {
    recommendedPlanType = 'HMO'; // Good balance of cost and coverage
  }

  return {
    score,
    level,
    expectedAnnualClaims,
    recommendedDeductible,
    recommendedPlanType,
    reasoning,
  };
}

/**
 * Adjust cost estimate based on utilization
 * Returns a multiplier (0.8 - 1.5) to apply to base premium estimate
 */
export function getUtilizationCostMultiplier(utilization: UtilizationScore): number {
  // Higher utilization = recommend better coverage = higher premium
  if (utilization.level === 'very-high') return 1.5; // Recommend Gold/Platinum
  if (utilization.level === 'high') return 1.3; // Recommend Gold
  if (utilization.level === 'moderate') return 1.0; // Silver baseline
  if (utilization.level === 'low') return 0.9; // Bronze acceptable
  return 0.8; // Bronze HDHP recommended
}

/**
 * Get metal level recommendation based on utilization
 */
export function getRecommendedMetalLevel(utilization: UtilizationScore): string {
  if (utilization.level === 'very-high') return 'Gold or Platinum';
  if (utilization.level === 'high') return 'Gold';
  if (utilization.level === 'moderate') return 'Silver';
  if (utilization.level === 'low') return 'Bronze';
  return 'Bronze (HDHP)';
}

/**
 * Calculate total cost of care (premium + out-of-pocket)
 */
export function estimateTotalCostOfCare(
  monthlyPremium: number,
  deductible: number,
  expectedAnnualClaims: number
): {
  annualPremium: number;
  expectedOutOfPocket: number;
  totalCost: number;
} {
  const annualPremium = monthlyPremium * 12;

  // Simplified OOP estimate: claims up to deductible, then 20% coinsurance
  let expectedOutOfPocket = 0;
  if (expectedAnnualClaims > deductible) {
    expectedOutOfPocket = deductible + (expectedAnnualClaims - deductible) * 0.2;
  } else {
    expectedOutOfPocket = expectedAnnualClaims;
  }

  return {
    annualPremium,
    expectedOutOfPocket,
    totalCost: annualPremium + expectedOutOfPocket,
  };
}
