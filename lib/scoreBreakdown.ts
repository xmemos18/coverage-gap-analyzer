/**
 * Coverage Gap Score Breakdown
 *
 * Breaks down the overall coverage gap score (0-100) into four categories
 * for visualization purposes. This provides transparency into how the
 * recommendation score was calculated.
 */

import { CalculatorFormData, InsuranceRecommendation } from '@/types';

export interface ScoreBreakdown {
  categories: ScoreCategory[];
  totalScore: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  color: string; // Tailwind color class
  icon: string; // Emoji or icon identifier
  description: string;
}

/**
 * Calculate detailed score breakdown for visualization
 *
 * The total coverage gap score is distributed across 4 categories:
 * 1. Network Coverage (25 points) - Geographic reach and provider access
 * 2. Cost Value (25 points) - Budget fit and cost effectiveness
 * 3. Flexibility (25 points) - Plan features and freedom
 * 4. Benefits Match (25 points) - Alignment with health needs
 */
export function calculateScoreBreakdown(
  recommendation: InsuranceRecommendation,
  formData: CalculatorFormData
): ScoreBreakdown {
  const totalScore = recommendation.coverageGapScore;

  // Calculate each category score (distribute the total score logically)
  const networkScore = calculateNetworkScore(formData, totalScore);
  const costScore = calculateCostScore(recommendation, formData, totalScore);
  const flexibilityScore = calculateFlexibilityScore(recommendation, formData, totalScore);
  const benefitsScore = calculateBenefitsScore(recommendation, formData, totalScore);

  const categories: ScoreCategory[] = [
    {
      name: 'Network Coverage',
      score: networkScore,
      maxScore: 25,
      color: 'from-green-400 to-green-600',
      icon: '🏥',
      description: 'Geographic reach and provider access across your residences',
    },
    {
      name: 'Cost Value',
      score: costScore,
      maxScore: 25,
      color: 'from-blue-400 to-blue-600',
      icon: '💰',
      description: 'Affordability and budget compatibility',
    },
    {
      name: 'Flexibility',
      score: flexibilityScore,
      maxScore: 25,
      color: 'from-indigo-400 to-indigo-600',
      icon: '🔄',
      description: 'Plan freedom and provider choice',
    },
    {
      name: 'Benefits Match',
      score: benefitsScore,
      maxScore: 25,
      color: 'from-purple-400 to-purple-600',
      icon: '✨',
      description: 'Alignment with your healthcare needs',
    },
  ];

  // Determine confidence level based on score
  const confidence = totalScore >= 85 ? 'high' : totalScore >= 70 ? 'medium' : 'low';

  return {
    categories,
    totalScore,
    confidence,
  };
}

/**
 * Calculate network coverage score (0-25)
 * Based on number of residences and geographic spread
 */
function calculateNetworkScore(formData: CalculatorFormData, totalScore: number): number {
  const numResidences = formData.residences.length;

  // More residences = more complex, slightly lower score
  // 1 residence: 100% of allocation
  // 2+ residences: 90-95% of allocation
  const baseScore = 25;

  if (numResidences === 1) {
    return Math.min(baseScore, Math.round((totalScore / 100) * 25));
  } else if (numResidences === 2) {
    return Math.min(baseScore, Math.round((totalScore / 100) * 24));
  } else {
    return Math.min(baseScore, Math.round((totalScore / 100) * 23));
  }
}

/**
 * Calculate cost value score (0-25)
 * Based on budget compatibility and estimated savings
 */
function calculateCostScore(
  recommendation: InsuranceRecommendation,
  formData: CalculatorFormData,
  totalScore: number
): number {
  const baseScore = 25;
  const avgCost = (recommendation.estimatedMonthlyCost.low + recommendation.estimatedMonthlyCost.high) / 2;

  // Check budget compatibility
  const budgetRanges: { [key: string]: number } = {
    'less-500': 500,
    '500-1000': 1000,
    '1000-2000': 2000,
    '2000-3500': 3500,
    '3500-plus': 10000,
    'not-sure': 10000,
  };

  const budgetMax = budgetRanges[formData.budget] || 10000;
  const withinBudget = avgCost <= budgetMax;

  // If within budget: 92-100% of allocation
  // If over budget: 70-85% of allocation
  let multiplier = withinBudget ? 0.96 : 0.78;

  // Bonus if there are cost savings vs current insurance
  if (recommendation.costComparison?.monthlySavings && recommendation.costComparison.monthlySavings > 0) {
    multiplier = Math.min(1, multiplier + 0.04);
  }

  return Math.min(baseScore, Math.round((totalScore / 100) * 25 * multiplier));
}

/**
 * Calculate flexibility score (0-25)
 * Based on plan type and provider freedom
 */
function calculateFlexibilityScore(
  recommendation: InsuranceRecommendation,
  formData: CalculatorFormData,
  totalScore: number
): number {
  const baseScore = 25;
  const planName = recommendation.recommendedInsurance.toLowerCase();

  // PPO and Flexible plans score higher for flexibility
  let multiplier = 0.88; // Default

  if (planName.includes('ppo') || planName.includes('flexible')) {
    multiplier = 0.92; // High flexibility
  } else if (planName.includes('medicare')) {
    multiplier = 0.90; // Medicare has good flexibility
  } else if (planName.includes('hmo')) {
    multiplier = 0.82; // HMO is less flexible
  }

  // Boost if covers multiple states
  if (formData.residences.length > 1) {
    multiplier = Math.min(1, multiplier + 0.04);
  }

  return Math.min(baseScore, Math.round((totalScore / 100) * 25 * multiplier));
}

/**
 * Calculate benefits match score (0-25)
 * Based on how well plan matches health profile
 */
function calculateBenefitsScore(
  recommendation: InsuranceRecommendation,
  formData: CalculatorFormData,
  totalScore: number
): number {
  const baseScore = 25;
  let multiplier = 0.84; // Base multiplier

  // Check health profile alignment
  const hasChronicConditions = formData.hasChronicConditions;
  const hasHighRx = formData.prescriptionCount === '4-or-more';
  const hasProviderPreference = formData.providerPreference === 'specific-doctors';

  // If user has specific needs and plan addresses them
  if (hasChronicConditions || hasHighRx) {
    const planName = recommendation.recommendedInsurance.toLowerCase();

    // PPO/Flexible plans better for chronic conditions
    if (planName.includes('ppo') || planName.includes('flexible')) {
      multiplier = 0.92;
    } else if (planName.includes('medicare')) {
      multiplier = 0.90; // Medicare also good for chronic conditions
    }
  }

  // Boost if plan allows specific providers when user wants them
  if (hasProviderPreference) {
    const planName = recommendation.recommendedInsurance.toLowerCase();
    if (planName.includes('ppo') || planName.includes('flexible')) {
      multiplier = Math.min(1, multiplier + 0.04);
    }
  }

  return Math.min(baseScore, Math.round((totalScore / 100) * 25 * multiplier));
}

/**
 * Get confidence indicator details
 */
export function getConfidenceDetails(score: number): {
  level: 'high' | 'medium' | 'low';
  color: string;
  label: string;
  description: string;
} {
  if (score >= 85) {
    return {
      level: 'high',
      color: 'green',
      label: 'High Confidence',
      description: 'Excellent match for your situation',
    };
  } else if (score >= 70) {
    return {
      level: 'medium',
      color: 'blue',
      label: 'Good Match',
      description: 'Solid option with minor trade-offs',
    };
  } else {
    return {
      level: 'low',
      color: 'amber',
      label: 'Consider Alternatives',
      description: 'May have significant trade-offs',
    };
  }
}
