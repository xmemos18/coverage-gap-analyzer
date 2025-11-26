import { CalculatorFormData, InsuranceRecommendation, SubsidyAnalysis, EmployerPlanAnalysis, CostProjectionSummary, RiskAnalysisSummary } from '@/types';
import { calculateCoverageScore } from './coverage-scoring';
import { getMedicareRecommendation, getMixedHouseholdRecommendation, getNonMedicareRecommendation } from './recommendations';
import { addCurrentInsuranceComparison } from './comparison';
import { calculateSubsidy, calculateSubsidyWithRealSLCSP } from './subsidyCalculator';
import { compareEmployerToMarketplace } from './employerComparison';
import { generateAddOnRecommendations } from './addOnRecommendations';
import { INSURANCE_COSTS } from '@/lib/constants';
import { generateMultiYearProjection, type LifetimeProjection } from './projections';
import { generateMonteCarloAnalysis, type MonteCarloAnalysis } from './simulations';

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

  // Generate multi-year cost projections (Professional Grade Enhancement)
  const costProjections = generateCostProjections(formData, uniqueStates);
  if (costProjections) {
    recommendation.costProjections = costProjections;
  }

  // Generate risk analysis using Monte Carlo simulation (Professional Grade Enhancement)
  const riskAnalysis = await generateRiskAnalysis(formData, recommendation);
  if (riskAnalysis) {
    recommendation.riskAnalysis = riskAnalysis;
  }

  return recommendation;
}

/**
 * Generate cost projections for the household
 */
function generateCostProjections(
  formData: CalculatorFormData,
  states: string[]
): CostProjectionSummary | undefined {
  try {
    // Get primary adult age for projections
    const primaryAge = formData.adultAges[0];
    if (!primaryAge) {
      return undefined;
    }

    // Get primary state
    const primaryState = states[0] || 'NC';

    // Determine health status from form data
    let healthStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    if (formData.hasChronicConditions && formData.chronicConditions.length > 2) {
      healthStatus = 'fair';
    } else if (formData.hasChronicConditions && formData.chronicConditions.length > 0) {
      healthStatus = 'good';
    }

    // Generate 5-year projection
    const projection = generateMultiYearProjection({
      currentAge: primaryAge,
      yearsToProject: 5,
      state: primaryState,
      metalTier: 'Silver',
      usesTobacco: formData.adultsUseTobacco[0] || false,
      healthStatus,
      chronicConditions: formData.chronicConditions || [],
    });

    // Convert to CostProjectionSummary format
    return convertToSummary(projection);
  } catch (error) {
    // Don't fail the main analysis if projections fail
    console.error('Failed to generate cost projections:', error);
    return undefined;
  }
}

/**
 * Convert LifetimeProjection to CostProjectionSummary
 */
function convertToSummary(projection: LifetimeProjection): CostProjectionSummary {
  const lastProjection = projection.projections[projection.projections.length - 1];

  return {
    yearlyProjections: projection.projections.map(p => ({
      year: p.year,
      calendarYear: p.calendarYear,
      age: p.age,
      monthlyPremium: p.projectedMonthlyPremium,
      annualPremium: p.projectedAnnualPremium,
      estimatedMedicalCosts: p.projectedMedicalCosts,
      estimatedOOP: p.projectedOOP,
      totalAnnualCost: p.totalAnnualCost,
      cumulativeCost: p.cumulativeCost,
      hasTransition: !!p.transition,
    })),
    totalProjectedCost: projection.totalLifetimeCost,
    averageAnnualCost: projection.averageAnnualCost,
    transitions: projection.majorTransitions.map((t, index) => {
      const transitionYear = projection.projections.find(p => p.transition?.type === t.type);
      return {
        age: transitionYear?.age || projection.startAge + index,
        year: transitionYear?.calendarYear || new Date().getFullYear() + index,
        type: t.type,
        description: t.description,
        impact: t.impact,
        recommendedAction: t.recommendedAction,
      };
    }),
    insights: projection.insights,
    confidenceRange: {
      optimistic: lastProjection?.confidenceInterval.p10 || 0,
      expected: lastProjection?.confidenceInterval.p50 || 0,
      pessimistic: lastProjection?.confidenceInterval.p90 || 0,
    },
  };
}

/**
 * Generate risk analysis using Monte Carlo simulation
 */
async function generateRiskAnalysis(
  formData: CalculatorFormData,
  recommendation: InsuranceRecommendation
): Promise<RiskAnalysisSummary | undefined> {
  try {
    // Calculate expected medical costs based on healthcare usage patterns
    let baseMedicalCosts = 3000; // Default base

    // Adjust based on doctor visits
    switch (formData.doctorVisitsPerYear) {
      case '0-2':
        baseMedicalCosts = 2000;
        break;
      case '3-5':
        baseMedicalCosts = 4000;
        break;
      case '6-10':
        baseMedicalCosts = 6000;
        break;
      case '10+':
        baseMedicalCosts = 10000;
        break;
    }

    // Adjust for specialist visits
    if (formData.specialistVisitsPerYear === 'monthly-or-more') {
      baseMedicalCosts += 5000;
    } else if (formData.specialistVisitsPerYear === '1-3') {
      baseMedicalCosts += 2000;
    }

    // Adjust for ER visits
    if (formData.erVisitsPerYear === '3+') {
      baseMedicalCosts += 8000;
    } else if (formData.erVisitsPerYear === '1-2') {
      baseMedicalCosts += 3000;
    }

    // Adjust for chronic conditions
    if (formData.hasChronicConditions && formData.chronicConditions.length > 0) {
      baseMedicalCosts += formData.chronicConditions.length * 1500;
    }

    // Adjust for planned procedures
    if (formData.plannedProcedures) {
      baseMedicalCosts += 15000;
    }

    // Adjust for specialty medications
    if (formData.takesSpecialtyMeds) {
      baseMedicalCosts += 10000;
    }

    // Adjust based on medication costs
    switch (formData.monthlyMedicationCost) {
      case '200-500':
        baseMedicalCosts += 3000;
        break;
      case '500-1000':
        baseMedicalCosts += 7000;
        break;
      case 'over-1000':
        baseMedicalCosts += 12000;
        break;
    }

    // Adjust for age (older = higher costs)
    const primaryAge = formData.adultAges[0] || 40;
    if (primaryAge >= 50) {
      baseMedicalCosts *= 1.3;
    } else if (primaryAge >= 60) {
      baseMedicalCosts *= 1.6;
    }

    // Adjust for tobacco use
    if (formData.adultsUseTobacco.some(Boolean)) {
      baseMedicalCosts *= 1.2;
    }

    // Get deductible and OOP max from recommendation
    // Use typical values based on plan type
    let deductible = 3000;
    let outOfPocketMax = 8000;

    const planType = recommendation.planType?.toLowerCase() || '';
    if (planType.includes('bronze') || planType.includes('hdhp')) {
      deductible = 7000;
      outOfPocketMax = 9450;
    } else if (planType.includes('silver')) {
      deductible = 5000;
      outOfPocketMax = 9450;
    } else if (planType.includes('gold')) {
      deductible = 1500;
      outOfPocketMax = 8700;
    } else if (planType.includes('platinum')) {
      deductible = 500;
      outOfPocketMax = 4000;
    }

    // Run Monte Carlo simulation
    const analysis: MonteCarloAnalysis = await generateMonteCarloAnalysis({
      baseCost: Math.round(baseMedicalCosts),
      deductible,
      outOfPocketMax,
      config: {
        iterations: 1000, // MVP default
        sigma: 0.6, // Slightly higher variance for healthcare
      },
    });

    // Convert to RiskAnalysisSummary type
    return {
      result: {
        median: analysis.result.median,
        mean: analysis.result.mean,
        standardDeviation: analysis.result.standardDeviation,
        percentiles: analysis.result.percentiles,
        probabilityOfExceedingDeductible: analysis.result.probabilityOfExceedingDeductible,
        probabilityOfHittingOOPMax: analysis.result.probabilityOfHittingOOPMax,
        expectedValueAtRisk: analysis.result.expectedValueAtRisk,
        simulationCount: analysis.result.simulationCount,
        executionTimeMs: analysis.result.executionTimeMs,
      },
      interpretation: analysis.interpretation,
      histogramData: analysis.histogramData,
      inputParameters: analysis.inputParameters,
    };
  } catch (error) {
    // Don't fail the main analysis if risk analysis fails
    console.error('Failed to generate risk analysis:', error);
    return undefined;
  }
}
