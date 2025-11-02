import { CalculatorFormData, InsuranceRecommendation } from '@/types';
import { calculateCoverageScore } from './coverage-scoring';
import { getMedicareRecommendation, getMixedHouseholdRecommendation, getNonMedicareRecommendation } from './recommendations';
import { addCurrentInsuranceComparison } from './comparison';

/**
 * Recommendation Engine for Multi-State Health Insurance
 *
 * Analyzes household composition, location, and budget to recommend
 * appropriate health insurance coverage for people with multiple homes.
 */

/**
 * Main recommendation function
 */
export function analyzeInsurance(formData: CalculatorFormData): InsuranceRecommendation {
  const { adultAges, childAges, hasMedicareEligible, budget, residences, hasCurrentInsurance, currentInsurance } = formData;

  const totalAdults = adultAges.length;
  const totalChildren = childAges.length;
  const totalHousehold = totalAdults + totalChildren;

  // Extract all unique states from residences
  const allStates = residences.map(r => r.state).filter(s => s);
  const uniqueStates = [...new Set(allStates)];

  // Determine Medicare eligibility
  const allAdultsMedicareEligible = adultAges.every(age => age >= 65);
  const someAdultsMedicareEligible = hasMedicareEligible || adultAges.some(age => age >= 65);
  const medicareEligibleCount = adultAges.filter(age => age >= 65).length;
  const nonMedicareAdultCount = totalAdults - medicareEligibleCount;

  // Calculate state coverage score (handles multiple states)
  const coverageScore = calculateCoverageScore(uniqueStates);

  // Route to appropriate recommendation logic
  let recommendation: InsuranceRecommendation;

  if (allAdultsMedicareEligible && totalChildren === 0) {
    recommendation = getMedicareRecommendation(formData, medicareEligibleCount, coverageScore, budget, uniqueStates);
  } else if (someAdultsMedicareEligible) {
    recommendation = getMixedHouseholdRecommendation(
      formData,
      medicareEligibleCount,
      nonMedicareAdultCount,
      totalChildren,
      coverageScore,
      budget,
      uniqueStates
    );
  } else {
    recommendation = getNonMedicareRecommendation(
      formData,
      totalAdults,
      totalChildren,
      totalHousehold,
      coverageScore,
      budget,
      uniqueStates
    );
  }

  // Add current insurance comparison if provided
  if (hasCurrentInsurance && currentInsurance.carrier) {
    recommendation = addCurrentInsuranceComparison(
      recommendation,
      currentInsurance,
      uniqueStates
    );
  }

  return recommendation;
}
