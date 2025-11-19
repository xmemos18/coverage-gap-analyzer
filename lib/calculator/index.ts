import { CalculatorFormData, InsuranceRecommendation, SubsidyAnalysis, EmployerPlanAnalysis } from '@/types';
import { calculateCoverageScore } from './coverage-scoring';
import { getMedicareRecommendation, getMixedHouseholdRecommendation, getNonMedicareRecommendation } from './recommendations';
import { addCurrentInsuranceComparison } from './comparison';
import { calculateSubsidy, calculateSubsidyWithRealSLCSP } from './subsidyCalculator';
import { compareEmployerToMarketplace } from './employerComparison';
import { generateAddOnRecommendations } from './addOnRecommendations';
import { INSURANCE_COSTS } from '@/lib/constants';

/**
 * Recommendation Engine for Multi-State Health Insurance
 *
 * Analyzes household composition, location, and budget to recommend
 * appropriate health insurance coverage for people with multiple homes.
 */

/**
 * Main recommendation function
 */
export async function analyzeInsurance(formData: CalculatorFormData): Promise<InsuranceRecommendation> {
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

  // Calculate subsidy eligibility for non-Medicare households
  let subsidyAnalysis: SubsidyAnalysis | undefined;
  let employerPlanAnalysis: EmployerPlanAnalysis | undefined;

  // Only calculate subsidies for non-Medicare households with income data
  if (!allAdultsMedicareEligible && formData.incomeRange) {
    // Try to use real SLCSP data if ZIP code is available
    const primaryZip = residences[0]?.zip;
    const allAges = [...adultAges, ...childAges];

    const subsidyResult = primaryZip && allAges.length === totalHousehold
      ? await calculateSubsidyWithRealSLCSP(
          formData.incomeRange,
          totalAdults,
          totalChildren,
          uniqueStates,
          primaryZip,
          allAges
        )
      : calculateSubsidy(
          formData.incomeRange,
          totalAdults,
          totalChildren,
          uniqueStates
        );

    // Calculate after-subsidy cost based on recommendation
    const afterSubsidyCost = {
      low: Math.max(0, INSURANCE_COSTS.ACA_ADULT_LOW * totalAdults + INSURANCE_COSTS.ACA_CHILD_LOW * totalChildren - subsidyResult.estimatedMonthlySubsidy),
      high: Math.max(0, INSURANCE_COSTS.ACA_ADULT_HIGH * totalAdults + INSURANCE_COSTS.ACA_CHILD_HIGH * totalChildren - subsidyResult.estimatedMonthlySubsidy),
    };

    subsidyAnalysis = {
      medicaidEligible: subsidyResult.medicaidEligible,
      subsidyEligible: subsidyResult.subsidyEligible,
      estimatedMonthlySubsidy: subsidyResult.estimatedMonthlySubsidy,
      estimatedAfterSubsidyCost: afterSubsidyCost,
      fplPercentage: subsidyResult.fplPercentage,
      explanation: subsidyResult.explanation,
      subsidyActionItems: subsidyResult.actionItems,
      benchmarkPremium: subsidyResult.benchmarkPremium,
      isRealSLCSP: subsidyResult.isRealSLCSP,
      slcspSource: subsidyResult.slcspSource,
      slcspPlanName: subsidyResult.slcspPlanName,
    };

    // Compare employer insurance if available
    if (formData.hasEmployerInsurance) {
      const employerComparisonResult = compareEmployerToMarketplace(
        formData.hasEmployerInsurance,
        formData.employerContribution || 0,
        formData.incomeRange,
        totalHousehold,
        afterSubsidyCost
      );

      if (employerComparisonResult) {
        employerPlanAnalysis = employerComparisonResult;
      }
    }
  }

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
    recommendation = await getNonMedicareRecommendation(
      formData,
      totalAdults,
      totalChildren,
      totalHousehold,
      coverageScore,
      budget,
      uniqueStates
    );
  }

  // Add subsidy analysis if calculated
  if (subsidyAnalysis) {
    recommendation.subsidyAnalysis = subsidyAnalysis;

    // If Medicaid eligible, override the recommendation
    if (subsidyAnalysis.medicaidEligible) {
      recommendation.recommendedInsurance = 'Medicaid (Free or Low-Cost Coverage)';
      recommendation.reasoning = subsidyAnalysis.explanation;
      recommendation.actionItems = [
        ...subsidyAnalysis.subsidyActionItems,
        ...recommendation.actionItems,
      ];
      recommendation.estimatedMonthlyCost = { low: 0, high: 50 }; // Medicaid typically free or minimal cost
    }
  }

  // Add employer comparison if calculated
  if (employerPlanAnalysis) {
    recommendation.employerPlanAnalysis = employerPlanAnalysis;

    // If employer plan is recommended, update action items
    if (employerPlanAnalysis.recommendation.toLowerCase().includes('keep')) {
      recommendation.actionItems = [
        employerPlanAnalysis.recommendation,
        ...employerPlanAnalysis.actionItems,
        ...recommendation.actionItems,
      ];
    } else {
      // Add employer comparison insights to action items
      recommendation.actionItems = [
        ...recommendation.actionItems,
        ...employerPlanAnalysis.actionItems,
      ];
    }
  }

  // Add current insurance comparison if provided
  if (hasCurrentInsurance && currentInsurance.carrier) {
    recommendation = addCurrentInsuranceComparison(
      recommendation,
      currentInsurance,
      uniqueStates
    );
  }

  // Generate add-on insurance recommendations if user is interested
  if (formData.interestedInAddOns !== false) {
    // Default to true (always show recommendations unless explicitly disabled)
    const addOnPreferences = {
      interested: true,
      maxMonthlyBudget: formData.addOnBudget,
    };

    const addOnAnalysis = generateAddOnRecommendations(
      formData,
      recommendation,
      addOnPreferences
    );

    recommendation.addOnInsuranceAnalysis = addOnAnalysis;
  }

  return recommendation;
}
