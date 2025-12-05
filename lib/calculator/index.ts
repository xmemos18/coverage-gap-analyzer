import { CalculatorFormData, InsuranceRecommendation, SubsidyAnalysis, EmployerPlanAnalysis, CostProjectionSummary, RiskAnalysisSummary, TypeSpecificRecommendation } from '@/types';
import { SELECTABLE_PLAN_TYPES } from '@/lib/constants';
import { logger } from '@/lib/logger';
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
  const hasIncomeData = formData.annualIncome !== null || formData.incomeRange;
  if (!allAdultsMedicareEligible && hasIncomeData) {
    // Try to use real SLCSP data if ZIP code is available
    const primaryZip = residences[0]?.zip;
    const allAges = [...adultAges, ...childAges];

    const subsidyResult = primaryZip && allAges.length === totalHousehold
      ? await calculateSubsidyWithRealSLCSP(
          formData.annualIncome,
          formData.incomeRange,
          totalAdults,
          totalChildren,
          uniqueStates,
          primaryZip,
          allAges
        )
      : calculateSubsidy(
          formData.annualIncome,
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
        formData.annualIncome,
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

  // Generate type-specific recommendations based on user's preferredPlanTypes
  if (formData.preferredPlanTypes && formData.preferredPlanTypes.length > 0) {
    const typeSpecificRecs = generateTypeSpecificRecommendations(
      formData,
      totalAdults,
      totalChildren,
      medicareEligibleCount,
      uniqueStates,
      coverageScore
    );
    recommendation.typeSpecificRecommendations = typeSpecificRecs;
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
    logger.error('Failed to generate cost projections', { error: error instanceof Error ? error.message : error });
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
    logger.error('Failed to generate risk analysis', { error: error instanceof Error ? error.message : error });
    return undefined;
  }
}

/**
 * Generate type-specific recommendations based on user's preferredPlanTypes
 *
 * Scoring Methodology:
 * - Starts with baseCoverageScore from main recommendation engine
 * - Adjustments are made based on plan type characteristics and user situation:
 *   - PPO: +10 for multi-state (good out-of-network), -10 for lowest-premium priority (higher cost)
 *   - HMO: -15 for multi-state (network limitations), +10 for single-state + budget priority
 *   - EPO: +5 for single-state (good middle ground)
 *   - HDHP: +15 for healthy + budget priority, -15 for chronic conditions, +5 for financial cushion
 *   - Medicare Advantage: +10 for single-state, -10 for multi-state
 *   - Medigap: +15 for multi-state (nationwide), +10 for predictable cost priority
 * - All scores are bounded between 0-100
 * - Results are sorted by score (highest first) and ranked
 */
function generateTypeSpecificRecommendations(
  formData: CalculatorFormData,
  totalAdults: number,
  totalChildren: number,
  medicareEligibleCount: number,
  states: string[],
  baseCoverageScore: number
): TypeSpecificRecommendation[] {
  const preferredTypes = formData.preferredPlanTypes || [];
  if (preferredTypes.length === 0) return [];

  // Input validation for edge cases
  if (totalAdults < 0 || totalChildren < 0) return [];
  if (medicareEligibleCount > totalAdults) {
    // Invalid state: can't have more Medicare-eligible than total adults
    medicareEligibleCount = totalAdults;
  }
  if (totalAdults === 0 && totalChildren === 0) return []; // No household members

  const recommendations: TypeSpecificRecommendation[] = [];

  // Calculate type-specific scores and recommendations
  for (const planType of preferredTypes) {
    const planTypeInfo = SELECTABLE_PLAN_TYPES.find(p => p.value === planType);
    if (!planTypeInfo) continue;

    // Skip Medicare options for non-Medicare-eligible users
    if ((planType === 'Medicare Advantage' || planType === 'Medigap') && medicareEligibleCount === 0) {
      continue;
    }

    // Calculate type-specific coverage score
    let typeScore = baseCoverageScore;
    let monthlyCost = { low: 0, high: 0 };
    let reasoning = '';

    // Adjust score and cost based on plan type and user preferences
    switch (planType) {
      case 'PPO':
        monthlyCost = calculatePPOCost(totalAdults, totalChildren, medicareEligibleCount);
        reasoning = generatePPOReasoning(formData, states, typeScore);
        // PPO is better for multi-state, travelers
        if (states.length > 1 || formData.needsNationalCoverage === 'critical') {
          typeScore = Math.min(100, typeScore + 10);
        }
        // PPO is worse for budget-conscious users
        if (formData.financialPriority === 'lowest-premium') {
          typeScore = Math.max(0, typeScore - 10);
        }
        break;

      case 'HMO':
        monthlyCost = calculateHMOCost(totalAdults, totalChildren, medicareEligibleCount);
        reasoning = generateHMOReasoning(formData, states, typeScore);
        // HMO is worse for multi-state
        if (states.length > 1) {
          typeScore = Math.max(0, typeScore - 15);
        }
        // HMO is better for budget-conscious with single state
        if (formData.financialPriority === 'lowest-premium' && states.length === 1) {
          typeScore = Math.min(100, typeScore + 10);
        }
        break;

      case 'EPO':
        monthlyCost = calculateEPOCost(totalAdults, totalChildren, medicareEligibleCount);
        reasoning = generateEPOReasoning(formData, states, typeScore);
        // EPO middle ground
        if (states.length === 1) {
          typeScore = Math.min(100, typeScore + 5);
        }
        break;

      case 'HDHP':
        monthlyCost = calculateHDHPCost(totalAdults, totalChildren, medicareEligibleCount);
        reasoning = generateHDHPReasoning(formData, states, typeScore, medicareEligibleCount);
        // HDHP great for healthy, budget-conscious
        if (!formData.hasChronicConditions && formData.financialPriority === 'lowest-premium') {
          typeScore = Math.min(100, typeScore + 15);
        }
        // HDHP worse for chronic conditions
        if (formData.hasChronicConditions) {
          typeScore = Math.max(0, typeScore - 15);
        }
        // HDHP better for those who can handle unexpected bills
        if (formData.canAffordUnexpectedBill === 'yes-easily') {
          typeScore = Math.min(100, typeScore + 5);
        }
        break;

      case 'Medicare Advantage':
        monthlyCost = calculateMedicareAdvantageCost(medicareEligibleCount);
        reasoning = generateMedicareAdvantageReasoning(formData, states, typeScore, medicareEligibleCount);
        // Medicare Advantage better for single state
        if (states.length === 1) {
          typeScore = Math.min(100, typeScore + 10);
        } else {
          // Reduced from -15 to -10: some MA plans have reasonable multi-state networks
          typeScore = Math.max(0, typeScore - 10);
        }
        break;

      case 'Medigap':
        monthlyCost = calculateMedigapCost(medicareEligibleCount);
        reasoning = generateMedigapReasoning(formData, states, typeScore, medicareEligibleCount);
        // Medigap excellent for multi-state
        if (states.length > 1) {
          typeScore = Math.min(100, typeScore + 15);
        }
        // Medigap better for those wanting predictable costs
        if (formData.financialPriority === 'lowest-oop-max') {
          typeScore = Math.min(100, typeScore + 10);
        }
        break;
    }

    recommendations.push({
      planType: planType,
      planTypeLabel: `${planTypeInfo.label} - ${planTypeInfo.fullName}`,
      recommendedPlan: `Best ${planTypeInfo.label} Option`,
      monthlyCost,
      coverageScore: Math.round(typeScore),
      reasoning,
      pros: [...planTypeInfo.pros],
      cons: [...planTypeInfo.cons],
      rank: 0, // Will be set after sorting
    });
  }

  // Sort by coverage score (best first) and assign ranks
  recommendations.sort((a, b) => b.coverageScore - a.coverageScore);
  recommendations.forEach((rec, index) => {
    rec.rank = index + 1;
  });

  return recommendations;
}

// Helper cost calculation functions
function calculatePPOCost(adults: number, children: number, medicareCount: number): { low: number; high: number } {
  const nonMedicareAdults = adults - medicareCount;
  return {
    low: INSURANCE_COSTS.ADULT_PPO_LOW * nonMedicareAdults + INSURANCE_COSTS.CHILD_LOW * children + INSURANCE_COSTS.MEDICARE_PER_PERSON_LOW * medicareCount,
    high: INSURANCE_COSTS.ADULT_PPO_HIGH * nonMedicareAdults + INSURANCE_COSTS.CHILD_HIGH * children + INSURANCE_COSTS.MEDICARE_PER_PERSON_HIGH * medicareCount,
  };
}

function calculateHMOCost(adults: number, children: number, medicareCount: number): { low: number; high: number } {
  const nonMedicareAdults = adults - medicareCount;
  // HMO typically 15-20% cheaper than PPO (consistent discount for adults and children)
  const HMO_DISCOUNT = 0.85; // 15% cheaper than PPO
  return {
    low: Math.round(INSURANCE_COSTS.ADULT_PPO_LOW * HMO_DISCOUNT * nonMedicareAdults + INSURANCE_COSTS.CHILD_LOW * HMO_DISCOUNT * children + INSURANCE_COSTS.MEDICARE_PER_PERSON_LOW * medicareCount),
    high: Math.round(INSURANCE_COSTS.ADULT_PPO_HIGH * HMO_DISCOUNT * nonMedicareAdults + INSURANCE_COSTS.CHILD_HIGH * HMO_DISCOUNT * children + INSURANCE_COSTS.MEDICARE_PER_PERSON_HIGH * medicareCount),
  };
}

function calculateEPOCost(adults: number, children: number, medicareCount: number): { low: number; high: number } {
  const nonMedicareAdults = adults - medicareCount;
  // EPO typically 10% cheaper than PPO (consistent discount for adults and children)
  const EPO_DISCOUNT = 0.9; // 10% cheaper than PPO
  return {
    low: Math.round(INSURANCE_COSTS.ADULT_PPO_LOW * EPO_DISCOUNT * nonMedicareAdults + INSURANCE_COSTS.CHILD_LOW * EPO_DISCOUNT * children + INSURANCE_COSTS.MEDICARE_PER_PERSON_LOW * medicareCount),
    high: Math.round(INSURANCE_COSTS.ADULT_PPO_HIGH * EPO_DISCOUNT * nonMedicareAdults + INSURANCE_COSTS.CHILD_HIGH * EPO_DISCOUNT * children + INSURANCE_COSTS.MEDICARE_PER_PERSON_HIGH * medicareCount),
  };
}

function calculateHDHPCost(adults: number, children: number, medicareCount: number): { low: number; high: number } {
  const nonMedicareAdults = adults - medicareCount;
  // Note: HDHP is not typically appropriate for Medicare-eligible users, but we include
  // Medicare costs defensively for mixed households where non-Medicare members use HDHP
  return {
    low: INSURANCE_COSTS.HDHP_ADULT_LOW * nonMedicareAdults + INSURANCE_COSTS.HDHP_CHILD_LOW * children + INSURANCE_COSTS.MEDICARE_PER_PERSON_LOW * medicareCount,
    high: INSURANCE_COSTS.HDHP_ADULT_HIGH * nonMedicareAdults + INSURANCE_COSTS.HDHP_CHILD_HIGH * children + INSURANCE_COSTS.MEDICARE_PER_PERSON_HIGH * medicareCount,
  };
}

function calculateMedicareAdvantageCost(medicareCount: number): { low: number; high: number } {
  return {
    low: INSURANCE_COSTS.MEDICARE_ADVANTAGE_LOW * medicareCount,
    high: INSURANCE_COSTS.MEDICARE_ADVANTAGE_HIGH * medicareCount,
  };
}

function calculateMedigapCost(medicareCount: number): { low: number; high: number } {
  return {
    low: INSURANCE_COSTS.MEDIGAP_PLAN_N_LOW * medicareCount,
    high: INSURANCE_COSTS.MEDIGAP_PLAN_N_HIGH * medicareCount,
  };
}

// Helper reasoning generation functions
function generatePPOReasoning(formData: CalculatorFormData, states: string[], _score: number): string {
  const reasons: string[] = [];
  if (states.length > 1) {
    reasons.push('PPO provides excellent multi-state flexibility with out-of-network coverage');
  }
  if (formData.needsNationalCoverage === 'critical') {
    reasons.push('ideal for frequent travelers');
  }
  if (formData.hasPreferredHospital) {
    reasons.push('allows you to see specialists without referrals');
  }
  if (reasons.length === 0) {
    reasons.push('provides maximum flexibility in choosing healthcare providers');
  }
  return reasons.join('; ') + '.';
}

function generateHMOReasoning(formData: CalculatorFormData, states: string[], _score: number): string {
  const reasons: string[] = [];
  if (states.length > 1) {
    // Warn multi-state users about HMO limitations
    reasons.push('WARNING: HMO networks are typically limited to single states - not ideal for your multi-state situation');
  } else if (states.length === 1) {
    reasons.push('HMO offers excellent value for single-state coverage');
  }
  if (formData.financialPriority === 'lowest-premium') {
    reasons.push('provides lower premiums than PPO');
  }
  if (formData.hasChronicConditions) {
    reasons.push('coordinated care can be beneficial for managing conditions');
  }
  if (reasons.length === 0) {
    reasons.push('offers coordinated care with lower out-of-pocket costs');
  }
  return reasons.join('; ') + '.';
}

function generateEPOReasoning(formData: CalculatorFormData, states: string[], _score: number): string {
  const reasons: string[] = [];
  if (states.length === 1) {
    reasons.push('EPO is a good middle ground between HMO and PPO');
  }
  reasons.push('no referrals needed for specialists');
  if (formData.financialPriority === 'balanced') {
    reasons.push('offers balanced costs and flexibility');
  }
  return reasons.join('; ') + '.';
}

function generateHDHPReasoning(formData: CalculatorFormData, _states: string[], _score: number, medicareCount: number = 0): string {
  const reasons: string[] = [];
  if (!formData.hasChronicConditions) {
    reasons.push('HDHP with HSA is excellent for healthy individuals');
  }
  if (formData.canAffordUnexpectedBill === 'yes-easily') {
    reasons.push('you can handle higher deductibles comfortably');
  }
  // Only mention HSA tax benefits if user is not Medicare-eligible (Medicare recipients cannot contribute to HSA)
  if (medicareCount === 0) {
    reasons.push('offers significant tax advantages through HSA');
  } else {
    reasons.push('note: Medicare-eligible members cannot contribute to HSA');
  }
  if (formData.financialPriority === 'lowest-premium') {
    reasons.push('has the lowest monthly premiums');
  }
  return reasons.join('; ') + '.';
}

function generateMedicareAdvantageReasoning(_formData: CalculatorFormData, states: string[], _score: number, medicareCount: number): string {
  const reasons: string[] = [];
  if (states.length === 1) {
    reasons.push('Medicare Advantage works well for single-state residents');
  }
  reasons.push(`provides all-in-one coverage for ${medicareCount} Medicare-eligible member${medicareCount > 1 ? 's' : ''}`);
  reasons.push('often includes extra benefits like dental and vision');
  if (states.length > 1) {
    reasons.push('note: network restrictions may limit coverage in other states');
  }
  return reasons.join('; ') + '.';
}

function generateMedigapReasoning(formData: CalculatorFormData, states: string[], _score: number, medicareCount: number): string {
  const reasons: string[] = [];
  if (states.length > 1) {
    reasons.push('Medigap provides nationwide coverage - perfect for multi-state living');
  }
  reasons.push(`covers ${medicareCount} Medicare-eligible member${medicareCount > 1 ? 's' : ''} with predictable costs`);
  if (formData.financialPriority === 'lowest-oop-max') {
    reasons.push('offers the most predictable out-of-pocket costs');
  }
  reasons.push('works with any doctor who accepts Medicare');
  return reasons.join('; ') + '.';
}
