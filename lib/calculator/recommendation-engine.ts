/**
 * Modular Recommendation Engine
 *
 * Professional-grade decision tree for health insurance recommendations.
 * Integrates all calculators into a cohesive, actionable recommendation system.
 *
 * Architecture:
 * - Clear separation of concerns (eligibility, costs, risks, life events)
 * - Modular decision nodes
 * - Priority-based recommendation ordering
 * - Contextual explanations
 */

import { calculateHouseholdPremium, getHouseholdPremiumRange, MetalTier } from './age-rating';
import { calculatePremiumTaxCredit, calculateFPL, calculateMAGI, MAGIComponents } from './advanced-subsidy';
import { analyzeTotalCostOfCare, determineUtilizationScenario, UtilizationScenario } from './total-cost-of-care';
import { assessActuarialRisk, generateCostScenarios } from './actuarial-models';
import { STATE_METADATA, isInCoverageGap, isMedicaidEligible } from '../data/state-constants';
import { analyzeBorderStates, analyzeRelocationOpportunity } from './multi-state-analysis';
import { analyzeAgeTransitions, calculateSpecialEnrollmentPeriod, isOpenEnrollmentPeriod, getNextOpenEnrollment, SpecialEnrollmentReason } from './edge-case-handlers';

// ============================================================================
// TYPES
// ============================================================================

export interface RecommendationInput {
  // Demographics
  age: number;
  birthDate?: Date;
  householdSize: number;
  adults?: number[];
  children?: number[];
  state: string;

  // Financial
  magiComponents?: MAGIComponents;
  estimatedIncome?: number; // Simplified alternative to MAGI components

  // Health
  healthStatus?: 'excellent' | 'good' | 'fair' | 'poor';
  chronicConditions?: string[];
  expectedMedicalCosts?: number;
  utilizationScenario?: UtilizationScenario;

  // Life Events
  specialEnrollmentReason?: SpecialEnrollmentReason;
  specialEnrollmentDate?: Date;
  consideringRelocation?: boolean;

  // Preferences
  riskTolerance?: 'low' | 'moderate' | 'high';
  preferredMetalTier?: MetalTier;
}

export interface Recommendation {
  priority: number; // 1 = highest priority
  category: 'eligibility' | 'cost' | 'coverage' | 'life_event' | 'relocation' | 'planning';
  title: string;
  summary: string;
  details: string[];
  action: string;
  urgency: 'low' | 'moderate' | 'high' | 'critical';
  potentialSavings?: number;
  deadline?: Date;
}

export interface ComprehensiveRecommendation {
  // Primary recommendation
  primaryRecommendation: string;
  recommendedPlan: {
    metalTier: MetalTier;
    monthlyPremium: number;
    estimatedAnnualCost: number;
    reasoning: string;
  };

  // All recommendations
  recommendations: Recommendation[];

  // Financial summary
  financialSummary: {
    eligibility: {
      medicaid: boolean;
      premiumTaxCredit: boolean;
      monthlyPTC: number;
      inCoverageGap: boolean;
    };
    costs: {
      lowestTotalCost: number;
      highestTotalCost: number;
      recommendedTotalCost: number;
    };
    riskAssessment: {
      category: 'low' | 'moderate' | 'high' | 'very-high';
      recommendedReserve: number;
    };
  };

  // Next steps
  nextSteps: Array<{
    step: string;
    deadline?: Date;
    priority: 'low' | 'moderate' | 'high' | 'critical';
  }>;

  // Important warnings
  warnings: string[];
}

// ============================================================================
// MAIN RECOMMENDATION ENGINE
// ============================================================================

/**
 * Generate comprehensive health insurance recommendations
 */
export function generateRecommendations(input: RecommendationInput): ComprehensiveRecommendation {
  const recommendations: Recommendation[] = [];
  const warnings: string[] = [];
  const nextSteps: Array<{ step: string; deadline?: Date; priority: 'low' | 'moderate' | 'high' | 'critical' }> = [];

  // Calculate MAGI
  const magi = input.magiComponents
    ? calculateMAGI(input.magiComponents)
    : input.estimatedIncome ?? 0;

  // Step 1: Life Event Analysis (highest priority)
  const lifeEventRecs = analyzeLifeEvents(input, magi);
  recommendations.push(...lifeEventRecs.recommendations);
  warnings.push(...lifeEventRecs.warnings);
  nextSteps.push(...lifeEventRecs.nextSteps);

  // Step 2: Eligibility Analysis
  const eligibilityRecs = analyzeEligibility(input, magi);
  recommendations.push(...eligibilityRecs.recommendations);
  warnings.push(...eligibilityRecs.warnings);

  // Step 3: Cost & Coverage Analysis
  const costRecs = analyzeCostsAndCoverage(input, magi, eligibilityRecs.eligibility);
  recommendations.push(...costRecs.recommendations);

  // Step 4: Relocation Analysis (if requested)
  if (input.consideringRelocation) {
    const relocationRecs = analyzeRelocationOptions(input, magi);
    recommendations.push(...relocationRecs.recommendations);
  }

  // Step 5: Planning & Prevention
  const planningRecs = analyzePlanningOpportunities(input, magi);
  recommendations.push(...planningRecs.recommendations);
  nextSteps.push(...planningRecs.nextSteps);

  // Sort recommendations by priority
  recommendations.sort((a, b) => a.priority - b.priority);

  // Generate primary recommendation
  const primary = generatePrimaryRecommendation(input, eligibilityRecs.eligibility, costRecs.recommendedPlan);

  // Build financial summary
  const financialSummary = {
    eligibility: eligibilityRecs.eligibility,
    costs: costRecs.costSummary,
    riskAssessment: costRecs.riskAssessment,
  };

  return {
    primaryRecommendation: primary.message,
    recommendedPlan: primary.plan,
    recommendations,
    financialSummary,
    nextSteps,
    warnings,
  };
}

// ============================================================================
// DECISION TREE MODULES
// ============================================================================

/**
 * Module 1: Life Event Analysis
 */
function analyzeLifeEvents(input: RecommendationInput, magi: number) {
  const recommendations: Recommendation[] = [];
  const warnings: string[] = [];
  const nextSteps: Array<{ step: string; deadline?: Date; priority: 'low' | 'moderate' | 'high' | 'critical' }> = [];

  // Age transitions
  if (input.birthDate) {
    const transitions = analyzeAgeTransitions(input.birthDate);

    // Immediate concerns (critical/high urgency)
    transitions.immediateConcerns.forEach((concern, index) => {
      const transition = transitions.transitions.find(t => t.urgency === 'critical' || t.urgency === 'high');

      recommendations.push({
        priority: 1 + index,
        category: 'life_event',
        title: transition?.event ?? 'Age Transition',
        summary: concern,
        details: transition?.impacts ?? [],
        action: transition?.actions[0] ?? 'Review your coverage options',
        urgency: transition?.urgency ?? 'high',
        deadline: transition?.date,
      });

      warnings.push(concern);
    });

    // Also create recommendations for high-urgency planning items (like approaching age 26)
    transitions.transitions.forEach((transition, index) => {
      if (transition.urgency === 'high' && !transitions.immediateConcerns.length) {
        recommendations.push({
          priority: 2 + index,
          category: 'life_event',
          title: transition.event,
          summary: `Approaching ${transition.event.toLowerCase()} in ${Math.round(transition.daysUntil / 30)} months`,
          details: transition.impacts,
          action: transition.actions[0] ?? 'Start planning for this transition',
          urgency: transition.urgency,
          deadline: transition.date,
        });
      }
    });

    transitions.planningRecommendations.forEach(rec => {
      nextSteps.push({
        step: rec,
        priority: 'moderate',
      });
    });
  }

  // Special Enrollment Periods
  if (input.specialEnrollmentReason && input.specialEnrollmentDate) {
    const sep = calculateSpecialEnrollmentPeriod(input.specialEnrollmentReason, input.specialEnrollmentDate);

    if (sep.isActive) {
      recommendations.push({
        priority: 1,
        category: 'life_event',
        title: 'Special Enrollment Period Active',
        summary: `You qualify for a Special Enrollment Period due to ${input.specialEnrollmentReason.replace(/_/g, ' ')}`,
        details: sep.instructions,
        action: `Enroll within ${sep.daysRemaining} days`,
        urgency: sep.urgency,
        deadline: sep.enrollmentWindowEnd,
      });

      nextSteps.push({
        step: `Complete enrollment by ${sep.enrollmentWindowEnd.toLocaleDateString()}`,
        deadline: sep.enrollmentWindowEnd,
        priority: sep.urgency,
      });
    } else if (sep.daysRemaining < 0) {
      warnings.push('Your Special Enrollment Period has ended. You must wait until Open Enrollment unless you have another qualifying event.');
    }
  }

  // Open Enrollment Period
  if (!isOpenEnrollmentPeriod()) {
    const nextOEP = getNextOpenEnrollment();

    if (nextOEP.daysUntil < 60) {
      nextSteps.push({
        step: `Open Enrollment starts ${nextOEP.start.toLocaleDateString()}`,
        deadline: nextOEP.start,
        priority: nextOEP.daysUntil < 30 ? 'high' : 'moderate',
      });
    }
  }

  return { recommendations, warnings, nextSteps };
}

/**
 * Module 2: Eligibility Analysis
 */
function analyzeEligibility(input: RecommendationInput, magi: number) {
  const recommendations: Recommendation[] = [];
  const warnings: string[] = [];

  const fpl = calculateFPL(input.householdSize, input.state);
  const fplPercentage = (magi / fpl) * 100;

  const medicaidEligible = isMedicaidEligible(input.state, fplPercentage);
  const inCoverageGap = isInCoverageGap(input.state, fplPercentage);

  let monthlyPTC = 0;
  let premiumTaxCreditEligible = false;

  // Calculate PTC if not Medicaid eligible
  if (!medicaidEligible && !inCoverageGap) {
    // Use a sample premium for calculation
    const samplePremium = STATE_METADATA[input.state]?.baseMonthlyPremium ?? 400;
    const ptcResult = calculatePremiumTaxCredit(magi, input.householdSize, input.state, samplePremium);

    monthlyPTC = ptcResult.monthlyPTC;
    premiumTaxCreditEligible = monthlyPTC > 0;
  }

  // Medicaid Eligibility
  if (medicaidEligible) {
    recommendations.push({
      priority: 1,
      category: 'eligibility',
      title: 'You Qualify for Medicaid',
      summary: 'Free or low-cost coverage through Medicaid',
      details: [
        `Your income ($${magi.toLocaleString()}) is ${Math.round(fplPercentage)}% of Federal Poverty Level`,
        `${input.state} has expanded Medicaid`,
        'Medicaid provides comprehensive coverage with little to no cost',
      ],
      action: 'Apply for Medicaid immediately',
      urgency: 'critical',
      potentialSavings: 5000,
    });
  }

  // Coverage Gap
  if (inCoverageGap) {
    recommendations.push({
      priority: 1,
      category: 'eligibility',
      title: 'Coverage Gap Detected',
      summary: `You fall into the coverage gap in ${input.state}`,
      details: [
        `Your income ($${magi.toLocaleString()}) is ${Math.round(fplPercentage)}% of FPL`,
        `${input.state} has not expanded Medicaid`,
        'You do not qualify for Medicaid or Premium Tax Credits',
        'Consider moving to an expansion state or exploring other options',
      ],
      action: 'Explore relocation to a Medicaid expansion state',
      urgency: 'high',
    });

    warnings.push('You are in the coverage gap. Consider relocating to a state with Medicaid expansion.');
  }

  // Premium Tax Credits
  if (premiumTaxCreditEligible) {
    const annualPTC = monthlyPTC * 12;

    recommendations.push({
      priority: 2,
      category: 'eligibility',
      title: 'Premium Tax Credits Available',
      summary: `You qualify for $${Math.round(monthlyPTC)}/month in subsidies`,
      details: [
        `Annual subsidy: $${Math.round(annualPTC).toLocaleString()}`,
        `Your income is ${Math.round(fplPercentage)}% of FPL`,
        'Subsidies apply to Silver plans on the marketplace',
      ],
      action: 'Apply for marketplace coverage with Premium Tax Credits',
      urgency: 'moderate',
      potentialSavings: annualPTC,
    });
  }

  const eligibility = {
    medicaid: medicaidEligible,
    premiumTaxCredit: premiumTaxCreditEligible,
    monthlyPTC,
    inCoverageGap,
  };

  return { recommendations, warnings, eligibility };
}

/**
 * Module 3: Cost & Coverage Analysis
 */
function analyzeCostsAndCoverage(input: RecommendationInput, magi: number, eligibility: any) {
  const recommendations: Recommendation[] = [];

  // Get premium range
  const baseRate = STATE_METADATA[input.state]?.baseMonthlyPremium ?? 400;
  const adults = input.adults ?? [input.age];
  const children = input.children ?? [];

  const premiumRange = getHouseholdPremiumRange(adults, children, input.state);

  // Apply subsidies
  const adjustedRange = {
    Bronze: Math.max(0, premiumRange.bronze - eligibility.monthlyPTC),
    Silver: Math.max(0, premiumRange.silver - eligibility.monthlyPTC),
    Gold: Math.max(0, premiumRange.gold - eligibility.monthlyPTC),
    Platinum: Math.max(0, premiumRange.platinum - eligibility.monthlyPTC),
  };

  // Determine utilization
  const utilization = input.utilizationScenario ?? determineUtilizationScenario(
    input.age,
    input.chronicConditions ?? [],
    '0' // Default to no prescriptions
  );

  // Analyze total cost of care
  const expectedMedicalCosts = input.expectedMedicalCosts ?? (input.age < 30 ? 3000 : input.age < 50 ? 5000 : 8000);
  const tccAnalysis = analyzeTotalCostOfCare(adjustedRange, expectedMedicalCosts, utilization);

  // Recommended plan is the one with lowest total cost
  const recommended = tccAnalysis[0];

  // Risk assessment
  const riskProfile = assessActuarialRisk({
    age: input.age,
    gender: 'other', // Simplified
    healthStatus: input.healthStatus ?? 'good',
    chronicConditions: input.chronicConditions ?? [],
    baselineCost: expectedMedicalCosts,
  });

  // Generate cost recommendation
  recommendations.push({
    priority: 3,
    category: 'cost',
    title: `Best Value: ${recommended.metalTier} Plan`,
    summary: `Lowest total annual cost: $${recommended.totalAnnualCost.toLocaleString()}`,
    details: [
      `Monthly premium: $${Math.round(recommended.annualPremium / 12).toLocaleString()}`,
      `Estimated out-of-pocket: $${recommended.estimatedOOP.toLocaleString()}`,
      `Deductible: $${recommended.deductible.toLocaleString()}`,
      `Out-of-pocket maximum: $${recommended.oopMaximum.toLocaleString()}`,
    ],
    action: `Enroll in ${recommended.metalTier} plan`,
    urgency: 'moderate',
  });

  // Risk-based recommendations
  if (riskProfile.riskCategory === 'high' || riskProfile.riskCategory === 'very-high') {
    recommendations.push({
      priority: 4,
      category: 'coverage',
      title: 'Consider Higher Coverage',
      summary: 'Your health profile suggests higher coverage may be beneficial',
      details: [
        `Risk category: ${riskProfile.riskCategory}`,
        `Recommended emergency reserve: $${riskProfile.recommendedReserve.toLocaleString()}`,
        'Higher metal tiers provide better protection against large medical bills',
      ],
      action: 'Compare Gold or Platinum plans',
      urgency: 'moderate',
    });
  }

  const costSummary = {
    lowestTotalCost: tccAnalysis[0].totalAnnualCost,
    highestTotalCost: tccAnalysis[tccAnalysis.length - 1].totalAnnualCost,
    recommendedTotalCost: recommended.totalAnnualCost,
  };

  const riskAssessment = {
    category: riskProfile.riskCategory,
    recommendedReserve: riskProfile.recommendedReserve,
  };

  const recommendedPlan = {
    metalTier: recommended.metalTier,
    monthlyPremium: recommended.annualPremium / 12,
    estimatedAnnualCost: recommended.totalAnnualCost,
    reasoning: `Based on your ${utilization} utilization scenario and ${riskProfile.riskCategory} risk profile`,
  };

  return { recommendations, costSummary, riskAssessment, recommendedPlan };
}

/**
 * Module 4: Relocation Analysis
 */
function analyzeRelocationOptions(input: RecommendationInput, magi: number) {
  const recommendations: Recommendation[] = [];

  const relocationAnalysis = analyzeRelocationOpportunity(input.state, {
    age: input.age,
    householdSize: input.householdSize,
    magi,
    metalTier: input.preferredMetalTier ?? 'Silver',
  }, false); // Check border states only

  if (relocationAnalysis.recommendMove && relocationAnalysis.toState) {
    const confidence = relocationAnalysis.confidence;
    const urgency: 'low' | 'moderate' | 'high' | 'critical' =
      confidence === 'high' ? 'high' :
      confidence === 'moderate' ? 'moderate' : 'low';

    recommendations.push({
      priority: 5,
      category: 'relocation',
      title: `Consider Moving to ${STATE_METADATA[relocationAnalysis.toState]?.name}`,
      summary: `Potential savings: $${Math.round(relocationAnalysis.annualSavings).toLocaleString()}/year`,
      details: relocationAnalysis.reasons,
      action: 'Research relocation feasibility',
      urgency,
      potentialSavings: relocationAnalysis.annualSavings,
    });
  }

  return { recommendations };
}

/**
 * Module 5: Planning & Prevention
 */
function analyzePlanningOpportunities(input: RecommendationInput, magi: number) {
  const recommendations: Recommendation[] = [];
  const nextSteps: Array<{ step: string; deadline?: Date; priority: 'low' | 'moderate' | 'high' | 'critical' }> = [];

  // Annual review recommendation
  recommendations.push({
    priority: 10,
    category: 'planning',
    title: 'Annual Coverage Review',
    summary: 'Review your coverage annually during Open Enrollment',
    details: [
      'Health needs change over time',
      'Premium and subsidy amounts change each year',
      'New plans may become available',
    ],
    action: 'Set calendar reminder for next Open Enrollment',
    urgency: 'low',
  });

  // Income reporting
  if (magi > 0) {
    nextSteps.push({
      step: 'Report income changes to the marketplace within 30 days',
      priority: 'moderate',
    });
  }

  return { recommendations, nextSteps };
}

// ============================================================================
// PRIMARY RECOMMENDATION GENERATOR
// ============================================================================

function generatePrimaryRecommendation(
  input: RecommendationInput,
  eligibility: any,
  recommendedPlan: any
): { message: string; plan: any } {
  let message = '';

  if (eligibility.medicaid) {
    message = `Apply for Medicaid immediately - you qualify for free or low-cost coverage in ${input.state}.`;
  } else if (eligibility.inCoverageGap) {
    message = `You're in the coverage gap in ${input.state}. Consider relocating to a Medicaid expansion state to access affordable coverage.`;
  } else if (eligibility.premiumTaxCredit) {
    message = `Enroll in a ${recommendedPlan.metalTier} plan with $${Math.round(eligibility.monthlyPTC)}/month in subsidies for the best value.`;
  } else {
    message = `Enroll in a ${recommendedPlan.metalTier} plan for the most cost-effective coverage based on your health needs.`;
  }

  return {
    message,
    plan: recommendedPlan,
  };
}
