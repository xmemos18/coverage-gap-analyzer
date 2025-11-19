/**
 * Multi-State Coverage Analysis
 *
 * Comprehensive analysis comparing insurance coverage across multiple states:
 * - Premium and total cost comparisons
 * - Medicaid eligibility differences
 * - Subsidy availability and amounts
 * - Market competitiveness analysis
 * - Relocation recommendations
 * - Border state opportunities
 *
 * Helps users make informed decisions about where to live for optimal coverage.
 */

import { STATE_METADATA, getAdjacentStates } from '../data/state-constants';
import { calculatePremiumForState } from './age-rating';
import { calculatePremiumTaxCredit, calculateFPL } from './advanced-subsidy';
import { analyzeTotalCostOfCare } from './total-cost-of-care';
import { ESTIMATED_MEDICAL_COSTS_BY_AGE, ESTIMATED_SAVINGS } from '../medicalCostConstants';
import type { MetalTier } from './age-rating';
import type { UtilizationScenario } from './total-cost-of-care';

// ============================================================================
// TYPES
// ============================================================================

export interface StateComparisonInput {
  age: number;
  householdSize: number;
  magi: number;
  metalTier: MetalTier;
  utilizationScenario?: UtilizationScenario;
  usesTobacco?: boolean;
}

export interface StateCoverageAnalysis {
  state: string;
  stateName: string;

  // Coverage eligibility
  medicaidEligible: boolean;
  ptcEligible: boolean;
  inCoverageGap: boolean;

  // Costs
  monthlyPremium: number;
  monthlyPTC: number;
  netMonthlyPremium: number;
  estimatedAnnualOOP: number;
  totalAnnualCost: number;

  // Market characteristics
  carrierCount: number;
  marketCompetitiveness: 'low' | 'moderate' | 'high';
  hasPublicOption: boolean;
  hasStateSubsidies: boolean;

  // Relative scoring
  affordabilityScore: number;  // 0-100 (higher = more affordable)
  accessScore: number;          // 0-100 (higher = better access)
  overallScore: number;         // 0-100 (weighted composite)
}

export interface MultiStateComparison {
  states: StateCoverageAnalysis[];
  bestOverall: string;
  bestAffordability: string;
  bestAccess: string;
  worstState: string;

  insights: string[];
  recommendations: string[];

  // Financial differences
  annualSavingsBestVsWorst: number;
  monthlyDifferenceBestVsWorst: number;

  // Categorical findings
  coverageGapStates: string[];
  medicaidEligibleStates: string[];
  subsidyEligibleStates: string[];
}

export interface BorderStateAnalysis {
  currentState: string;
  adjacentStates: string[];
  betterOptions: Array<{
    state: string;
    annualSavings: number;
    reason: string;
  }>;
  shouldConsiderMoving: boolean;
  primaryRecommendation: string | null;
}

export interface RelocationRecommendation {
  recommendMove: boolean;
  fromState: string;
  toState: string | null;
  annualSavings: number;
  reasons: string[];
  considerations: string[];
  confidence: 'low' | 'moderate' | 'high';
}

// ============================================================================
// STATE ANALYSIS
// ============================================================================

/**
 * Analyze coverage options in a single state
 */
export function analyzeStateCoverage(
  state: string,
  input: StateComparisonInput
): StateCoverageAnalysis {
  const metadata = STATE_METADATA[state];
  if (!metadata) {
    throw new Error(`Invalid state code: ${state}`);
  }

  const { age, householdSize, magi, metalTier, utilizationScenario = 'medium', usesTobacco = false } = input;

  // Calculate FPL percentage
  const fpl = calculateFPL(householdSize, state);
  const fplPercentage = (magi / fpl) * 100;

  // Eligibility
  const medicaidEligible = fplPercentage < metadata.medicaidThreshold;
  const inCoverageGap = !metadata.medicaidExpanded && fplPercentage >= 100 && fplPercentage < 138;
  const ptcEligible = fplPercentage >= 138 && !medicaidEligible;

  // Premium calculation
  const monthlyPremium = calculatePremiumForState(age, state, metalTier, usesTobacco);

  // Calculate PTC if eligible
  let monthlyPTC = 0;
  if (ptcEligible) {
    const ptcResult = calculatePremiumTaxCredit(magi, householdSize, state, monthlyPremium, metalTier);
    monthlyPTC = ptcResult.monthlyPTC;
  }

  const netMonthlyPremium = Math.max(0, monthlyPremium - monthlyPTC);

  // Total cost of care analysis
  const premiumsByTier = {
    Bronze: monthlyPremium,
    Silver: monthlyPremium,
    Gold: monthlyPremium,
    Platinum: monthlyPremium,
    Catastrophic: monthlyPremium,
  };

  // Use age-based expected costs (simplified - could be enhanced)
  const expectedMedicalCosts = age < 30
    ? ESTIMATED_MEDICAL_COSTS_BY_AGE.YOUNG_ADULT
    : age < 50
      ? ESTIMATED_MEDICAL_COSTS_BY_AGE.MIDDLE_AGE
      : age < 65
        ? ESTIMATED_MEDICAL_COSTS_BY_AGE.OLDER_ADULT
        : ESTIMATED_MEDICAL_COSTS_BY_AGE.MEDICARE_ELIGIBLE;

  const tccAnalysis = analyzeTotalCostOfCare(premiumsByTier, expectedMedicalCosts, utilizationScenario);
  const tierAnalysis = tccAnalysis.find(t => t.metalTier === metalTier);
  const estimatedAnnualOOP = tierAnalysis?.estimatedOOP ?? ESTIMATED_SAVINGS.DEFAULT_ANNUAL_OOP;

  const totalAnnualCost = (netMonthlyPremium * 12) + estimatedAnnualOOP;

  // Calculate scores
  const affordabilityScore = calculateAffordabilityScore(totalAnnualCost, magi);
  const accessScore = calculateAccessScore(metadata);
  const overallScore = (affordabilityScore * 0.6) + (accessScore * 0.4); // Affordability weighted higher

  return {
    state,
    stateName: metadata.name,
    medicaidEligible,
    ptcEligible,
    inCoverageGap,
    monthlyPremium,
    monthlyPTC,
    netMonthlyPremium,
    estimatedAnnualOOP,
    totalAnnualCost,
    carrierCount: metadata.carrierCount,
    marketCompetitiveness: metadata.marketCompetitiveness,
    hasPublicOption: metadata.hasPublicOption,
    hasStateSubsidies: metadata.hasStateSubsidies,
    affordabilityScore,
    accessScore,
    overallScore,
  };
}

/**
 * Calculate affordability score (0-100)
 * Based on healthcare costs as % of income
 */
function calculateAffordabilityScore(totalAnnualCost: number, magi: number): number {
  if (magi === 0) return 0;

  const healthcareBurden = totalAnnualCost / magi;

  // Scoring based on healthcare burden
  // < 5% = excellent (100)
  // 5-10% = good (80-100)
  // 10-15% = moderate (60-80)
  // 15-20% = challenging (40-60)
  // > 20% = severe burden (0-40)

  if (healthcareBurden < 0.05) {
    return 100;
  } else if (healthcareBurden < 0.10) {
    return 100 - ((healthcareBurden - 0.05) / 0.05) * 20;
  } else if (healthcareBurden < 0.15) {
    return 80 - ((healthcareBurden - 0.10) / 0.05) * 20;
  } else if (healthcareBurden < 0.20) {
    return 60 - ((healthcareBurden - 0.15) / 0.05) * 20;
  } else {
    return Math.max(0, 40 - ((healthcareBurden - 0.20) * 100));
  }
}

/**
 * Calculate access score (0-100)
 * Based on market competition, public options, subsidies
 */
function calculateAccessScore(metadata: typeof STATE_METADATA[string]): number {
  let score = 0;

  // Carrier count (max 40 points)
  const carrierScore = Math.min(40, (metadata.carrierCount / 15) * 40);
  score += carrierScore;

  // Medicaid expansion (20 points)
  if (metadata.medicaidExpanded) {
    score += 20;
  }

  // Public option (15 points)
  if (metadata.hasPublicOption) {
    score += 15;
  }

  // State subsidies (15 points)
  if (metadata.hasStateSubsidies) {
    score += 15;
  }

  // Exchange type (10 points - SBM often better)
  if (metadata.exchangeType === 'SBM') {
    score += 10;
  } else if (metadata.exchangeType === 'SBM-FP') {
    score += 5;
  }

  return Math.min(100, score);
}

// ============================================================================
// MULTI-STATE COMPARISON
// ============================================================================

/**
 * Compare coverage across multiple states
 */
export function compareMultipleStates(
  states: string[],
  input: StateComparisonInput
): MultiStateComparison {
  if (states.length === 0) {
    throw new Error('Must provide at least one state');
  }

  // Analyze each state
  const analyses = states.map(state => analyzeStateCoverage(state, input));

  // Sort by overall score (descending)
  analyses.sort((a, b) => b.overallScore - a.overallScore);

  // Get best and worst states (guaranteed to exist since states.length > 0)
  const bestAnalysis = analyses[0];
  const worstAnalysis = analyses[analyses.length - 1];

  if (!bestAnalysis || !worstAnalysis) {
    throw new Error('Failed to analyze states');
  }

  const bestOverall = bestAnalysis.state;
  const worstState = worstAnalysis.state;

  // Find best for specific criteria
  const sortedByAffordability = [...analyses].sort((a, b) => b.affordabilityScore - a.affordabilityScore);
  const bestAffordabilityAnalysis = sortedByAffordability[0];
  const bestAffordability = bestAffordabilityAnalysis?.state ?? bestOverall;

  const sortedByAccess = [...analyses].sort((a, b) => b.accessScore - a.accessScore);
  const bestAccessAnalysis = sortedByAccess[0];
  const bestAccess = bestAccessAnalysis?.state ?? bestOverall;

  // Calculate savings
  const bestCost = bestAnalysis.totalAnnualCost;
  const worstCost = worstAnalysis.totalAnnualCost;
  const annualSavingsBestVsWorst = worstCost - bestCost;
  const monthlyDifferenceBestVsWorst = annualSavingsBestVsWorst / 12;

  // Categorize states
  const coverageGapStates = analyses.filter(a => a.inCoverageGap).map(a => a.state);
  const medicaidEligibleStates = analyses.filter(a => a.medicaidEligible).map(a => a.state);
  const subsidyEligibleStates = analyses.filter(a => a.ptcEligible && a.monthlyPTC > 0).map(a => a.state);

  // Generate insights
  const insights = generateInsights(analyses, input);
  const recommendations = generateRecommendations(analyses, input);

  return {
    states: analyses,
    bestOverall,
    bestAffordability,
    bestAccess,
    worstState,
    insights,
    recommendations,
    annualSavingsBestVsWorst,
    monthlyDifferenceBestVsWorst,
    coverageGapStates,
    medicaidEligibleStates,
    subsidyEligibleStates,
  };
}

/**
 * Generate insights from multi-state analysis
 */
function generateInsights(analyses: StateCoverageAnalysis[], _input: StateComparisonInput): string[] {
  const insights: string[] = [];

  // Coverage gap insights
  const gapStates = analyses.filter(a => a.inCoverageGap);
  if (gapStates.length > 0) {
    insights.push(
      `${gapStates.length} state(s) have a coverage gap: ${gapStates.map(s => s.stateName).join(', ')}. ` +
      `You would not qualify for Medicaid or subsidies in these states.`
    );
  }

  // Medicaid opportunities
  const medicaidStates = analyses.filter(a => a.medicaidEligible);
  if (medicaidStates.length > 0 && medicaidStates.length < analyses.length) {
    insights.push(
      `You would qualify for free/low-cost Medicaid in ${medicaidStates.length} state(s): ` +
      `${medicaidStates.map(s => s.stateName).join(', ')}`
    );
  }

  // Cost variation
  const costs = analyses.map(a => a.totalAnnualCost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const costRange = maxCost - minCost;

  if (costRange > ESTIMATED_SAVINGS.COST_VARIATION_THRESHOLD) {
    insights.push(
      `Significant cost variation: Annual costs range from $${minCost.toLocaleString()} to ` +
      `$${maxCost.toLocaleString()} (difference of $${costRange.toLocaleString()}).`
    );
  }

  // Public option availability
  const publicOptionStates = analyses.filter(a => a.hasPublicOption);
  if (publicOptionStates.length > 0) {
    insights.push(
      `Public option available in: ${publicOptionStates.map(s => s.stateName).join(', ')}. ` +
      `These plans often have lower premiums.`
    );
  }

  // Market competition
  const lowCompetition = analyses.filter(a => a.carrierCount <= 2);
  if (lowCompetition.length > 0) {
    insights.push(
      `Limited carrier choice in: ${lowCompetition.map(s => `${s.stateName} (${s.carrierCount})`).join(', ')}. ` +
      `This may result in higher premiums.`
    );
  }

  return insights;
}

/**
 * Generate recommendations from multi-state analysis
 */
function generateRecommendations(analyses: StateCoverageAnalysis[], _input: StateComparisonInput): string[] {
  const recommendations: string[] = [];

  const best = analyses[0];
  const worst = analyses[analyses.length - 1];

  // Guard against empty analyses
  if (!best || !worst) {
    return ['Unable to generate recommendations - no state data available'];
  }

  // Primary recommendation
  recommendations.push(
    `Best overall option: ${best.stateName} with total annual cost of $${best.totalAnnualCost.toLocaleString()} ` +
    `(Score: ${Math.round(best.overallScore)}/100)`
  );

  // Specific advantages
  if (best.medicaidEligible) {
    recommendations.push(`${best.stateName}: Qualify for Medicaid - free or nearly-free coverage`);
  } else if (best.monthlyPTC > 0) {
    recommendations.push(
      `${best.stateName}: Receive $${Math.round(best.monthlyPTC)}/month in subsidies ` +
      `(${Math.round((best.monthlyPTC / best.monthlyPremium) * 100)}% of premium covered)`
    );
  }

  // Market advantages
  if (best.hasPublicOption) {
    recommendations.push(`${best.stateName}: Public option available for additional savings`);
  }

  if (best.carrierCount >= 6) {
    recommendations.push(`${best.stateName}: Strong market competition (${best.carrierCount} carriers)`);
  }

  // Warnings about worst state
  if (worst.inCoverageGap) {
    recommendations.push(
      `⚠️ Avoid ${worst.stateName}: You would fall into the coverage gap with no Medicaid or subsidies`
    );
  } else if (worst.totalAnnualCost > best.totalAnnualCost * 1.3) {
    const extraCost = worst.totalAnnualCost - best.totalAnnualCost;
    recommendations.push(
      `⚠️ ${worst.stateName} would cost $${Math.round(extraCost).toLocaleString()} more annually than ${best.stateName}`
    );
  }

  return recommendations;
}

// ============================================================================
// BORDER STATE ANALYSIS
// ============================================================================

/**
 * Analyze opportunities in adjacent states
 */
export function analyzeBorderStates(
  currentState: string,
  input: StateComparisonInput
): BorderStateAnalysis {
  const adjacentStates = getAdjacentStates(currentState);

  if (adjacentStates.length === 0) {
    return {
      currentState,
      adjacentStates: [],
      betterOptions: [],
      shouldConsiderMoving: false,
      primaryRecommendation: null,
    };
  }

  // Analyze current state + all adjacent states
  const allStates = [currentState, ...adjacentStates];
  const comparison = compareMultipleStates(allStates, input);

  const currentAnalysis = comparison.states.find(s => s.state === currentState)!;
  const adjacentAnalyses = comparison.states.filter(s => s.state !== currentState);

  // Find better options
  const betterOptions = adjacentAnalyses
    .filter(adj => adj.totalAnnualCost < currentAnalysis.totalAnnualCost)
    .map(adj => ({
      state: adj.state,
      annualSavings: currentAnalysis.totalAnnualCost - adj.totalAnnualCost,
      reason: generateMoveReason(currentAnalysis, adj),
    }))
    .sort((a, b) => b.annualSavings - a.annualSavings);

  const bestOption = betterOptions[0];
  const shouldConsiderMoving = Boolean(bestOption && bestOption.annualSavings > ESTIMATED_SAVINGS.RELOCATION_THRESHOLD);

  const primaryRecommendation = shouldConsiderMoving && bestOption
    ? `Consider moving to ${STATE_METADATA[bestOption.state]?.name ?? bestOption.state} to save ` +
      `$${Math.round(bestOption.annualSavings).toLocaleString()}/year. ${bestOption.reason}`
    : null;

  return {
    currentState,
    adjacentStates,
    betterOptions,
    shouldConsiderMoving,
    primaryRecommendation,
  };
}

function generateMoveReason(current: StateCoverageAnalysis, better: StateCoverageAnalysis): string {
  const reasons: string[] = [];

  if (current.inCoverageGap && !better.inCoverageGap) {
    reasons.push('Escape coverage gap');
  }

  if (!current.medicaidEligible && better.medicaidEligible) {
    reasons.push('Qualify for Medicaid');
  }

  if (better.monthlyPTC > current.monthlyPTC + 50) {
    reasons.push(`Higher subsidies ($${Math.round(better.monthlyPTC - current.monthlyPTC)}/month more)`);
  }

  if (better.hasPublicOption && !current.hasPublicOption) {
    reasons.push('Public option available');
  }

  if (better.carrierCount > current.carrierCount + 2) {
    reasons.push('More carrier choices');
  }

  return reasons.length > 0 ? reasons.join('; ') : 'Lower overall costs';
}

// ============================================================================
// RELOCATION RECOMMENDATION
// ============================================================================

/**
 * Comprehensive relocation recommendation
 */
export function analyzeRelocationOpportunity(
  currentState: string,
  input: StateComparisonInput,
  considerAllStates: boolean = false
): RelocationRecommendation {
  // Start with border states
  const borderAnalysis = analyzeBorderStates(currentState, input);

  let bestAlternative: StateCoverageAnalysis | null = null;
  let statesToConsider: string[] = [];

  if (considerAllStates) {
    // Consider all states
    statesToConsider = Object.keys(STATE_METADATA);
  } else {
    // Just border states
    statesToConsider = [currentState, ...borderAnalysis.adjacentStates];
  }

  const comparison = compareMultipleStates(statesToConsider, input);
  const currentAnalysis = comparison.states.find(s => s.state === currentState)!;

  // Find best alternative (excluding current state)
  const alternatives = comparison.states.filter(s => s.state !== currentState);
  if (alternatives.length > 0) {
    bestAlternative = alternatives[0] ?? null; // Already sorted by overall score
  }

  if (!bestAlternative) {
    return {
      recommendMove: false,
      fromState: currentState,
      toState: null,
      annualSavings: 0,
      reasons: [],
      considerations: [],
      confidence: 'low',
    };
  }

  const annualSavings = currentAnalysis.totalAnnualCost - bestAlternative.totalAnnualCost;
  const reasons: string[] = [];
  const considerations: string[] = [];

  // Determine if move is recommended
  const significantSavings = annualSavings > 3000;
  const escapeCoverageGap = currentAnalysis.inCoverageGap && !bestAlternative.inCoverageGap;
  const gainMedicaid = !currentAnalysis.medicaidEligible && bestAlternative.medicaidEligible;

  const recommendMove = significantSavings || escapeCoverageGap || gainMedicaid;

  // Build reasons
  if (escapeCoverageGap) {
    reasons.push('Escape coverage gap - gain access to Medicaid or subsidies');
  }

  if (gainMedicaid) {
    reasons.push('Qualify for Medicaid - free or nearly-free coverage');
  }

  if (annualSavings > 5000) {
    reasons.push(`Significant annual savings: $${Math.round(annualSavings).toLocaleString()}`);
  } else if (annualSavings > 3000) {
    reasons.push(`Moderate annual savings: $${Math.round(annualSavings).toLocaleString()}`);
  }

  if (bestAlternative.hasPublicOption && !currentAnalysis.hasPublicOption) {
    reasons.push('Access to public option plan');
  }

  if (bestAlternative.carrierCount > currentAnalysis.carrierCount + 3) {
    reasons.push(`More carrier choices (${bestAlternative.carrierCount} vs ${currentAnalysis.carrierCount})`);
  }

  // Build considerations
  considerations.push('Moving costs (housing, employment, family)');
  considerations.push('Network changes - verify doctor/hospital availability');

  if (!considerAllStates) {
    considerations.push('Only adjacent states considered - other states may have better options');
  }

  considerations.push('State income tax differences may affect overall savings');

  if (input.magi > 0) {
    const fpl = calculateFPL(input.householdSize, currentState);
    const fplPct = (input.magi / fpl) * 100;
    if (fplPct > 130 && fplPct < 145) {
      considerations.push('Income near Medicaid cutoff - small income changes could affect eligibility');
    }
  }

  // Determine confidence
  let confidence: 'low' | 'moderate' | 'high' = 'low';

  if (escapeCoverageGap || gainMedicaid) {
    confidence = 'high';
  } else if (annualSavings > 8000) {
    confidence = 'high';
  } else if (annualSavings > 5000) {
    confidence = 'moderate';
  } else if (annualSavings > 3000) {
    confidence = 'moderate';
  }

  return {
    recommendMove,
    fromState: currentState,
    toState: bestAlternative.state,
    annualSavings,
    reasons,
    considerations,
    confidence,
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick comparison of two specific states
 */
export function compareTwoStates(
  state1: string,
  state2: string,
  input: StateComparisonInput
): {
  state1Analysis: StateCoverageAnalysis;
  state2Analysis: StateCoverageAnalysis;
  betterState: string;
  annualDifference: number;
  recommendation: string;
} {
  const comparison = compareMultipleStates([state1, state2], input);

  const analysis1 = comparison.states.find(s => s.state === state1)!;
  const analysis2 = comparison.states.find(s => s.state === state2)!;

  const betterState = analysis1.overallScore > analysis2.overallScore ? state1 : state2;
  const annualDifference = Math.abs(analysis1.totalAnnualCost - analysis2.totalAnnualCost);

  const better = betterState === state1 ? analysis1 : analysis2;

  const recommendation =
    `${better.stateName} is the better choice, saving $${Math.round(annualDifference).toLocaleString()}/year. ` +
    comparison.recommendations[0];

  return {
    state1Analysis: analysis1,
    state2Analysis: analysis2,
    betterState,
    annualDifference,
    recommendation,
  };
}
