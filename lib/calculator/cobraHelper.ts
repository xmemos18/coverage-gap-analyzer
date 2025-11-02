/**
 * COBRA Analysis Helper
 * Helps users understand if COBRA continuation coverage is worth it
 */

import { CostRange } from '@/types';

export interface COBRAAnalysis {
  isWorthIt: boolean;
  monthsRemaining: number;
  estimatedMonthlyCost: CostRange;
  pros: string[];
  cons: string[];
  alternatives: string[];
  recommendation: string;
  warnings: string[];
}

/**
 * Analyze if COBRA is worth continuing
 * COBRA typically costs 102% of the employer's full premium cost
 */
export function analyzeCOBRA(
  currentMonthlyCost: number,
  monthsSinceJobLoss: number,
  hasPreexistingConditions: boolean,
  alternativeCost: CostRange
): COBRAAnalysis {
  // COBRA is available for 18 months after job loss
  const monthsRemaining = Math.max(0, 18 - monthsSinceJobLoss);

  // COBRA typically costs 102% of full premium (employer + employee portions)
  // If current cost is employee-only, COBRA is usually 3-4x higher
  const estimatedCOBRACost = currentMonthlyCost * 3.5; // Rough estimate

  const estimatedMonthlyCost: CostRange = {
    low: estimatedCOBRACost * 0.9,
    high: estimatedCOBRACost * 1.1,
  };

  const pros: string[] = [
    'Same coverage and doctors as before',
    'No waiting period or pre-existing condition exclusions',
    'Familiar plan - you know how it works',
    'Good for short-term coverage while job searching',
  ];

  const cons: string[] = [
    `Very expensive - typically $${estimatedCOBRACost.toFixed(0)}/month or more`,
    'No employer contribution - you pay 100% + 2% admin fee',
    `Only available for ${monthsRemaining} more months`,
    'Premiums can increase annually',
  ];

  const alternatives: string[] = [
    'ACA Marketplace plans (income-based subsidies available)',
    'Spouse\'s employer plan (special enrollment period)',
    'Short-term health insurance (limited coverage)',
    'Medicaid (if income qualifies)',
  ];

  const warnings: string[] = [];

  // Determine if worth it
  let isWorthIt = false;
  let recommendation = '';

  // Scenario 1: Very short-term (1-3 months)
  if (monthsRemaining >= 1 && monthsRemaining <= 3) {
    isWorthIt = true;
    recommendation = `COBRA may be worth it for ${monthsRemaining} month${monthsRemaining > 1 ? 's' : ''} if you're between jobs or waiting for new employer coverage. Short-term is easier than switching plans.`;
  }
  // Scenario 2: Pre-existing condition + ongoing treatment
  else if (hasPreexistingConditions && monthsRemaining > 0) {
    isWorthIt = true;
    recommendation = 'COBRA recommended if you have ongoing treatment or prescriptions that work well with your current plan. Continuity of care is valuable.';
    warnings.push('Consider switching to ACA plan during next Open Enrollment to save money');
  }
  // Scenario 3: COBRA is much cheaper than alternatives (rare)
  else if (estimatedMonthlyCost.high < alternativeCost.low * 0.8) {
    isWorthIt = true;
    recommendation = 'COBRA is unusually affordable compared to alternatives - this is rare but worth taking advantage of.';
  }
  // Scenario 4: Not worth it - marketplace is better
  else {
    isWorthIt = false;
    recommendation = `COBRA is NOT recommended. At ~$${estimatedCOBRACost.toFixed(0)}/month, you'll save $${Math.abs(estimatedCOBRACost - ((alternativeCost.low + alternativeCost.high) / 2)).toFixed(0)}/month by switching to an ACA Marketplace plan with similar coverage.`;
    cons.push(`Could save $${Math.abs((estimatedCOBRACost * 12) - ((alternativeCost.low + alternativeCost.high) / 2 * 12)).toFixed(0)}/year with marketplace plan`);
  }

  // Add time-sensitive warnings
  if (monthsRemaining <= 3 && monthsRemaining > 0) {
    warnings.push(`⏰ URGENT: Only ${monthsRemaining} month${monthsRemaining > 1 ? 's' : ''} of COBRA remaining - enroll in alternative coverage NOW`);
  }

  if (monthsRemaining === 0) {
    warnings.push('⚠️ COBRA has expired - must find alternative coverage immediately');
  }

  return {
    isWorthIt,
    monthsRemaining,
    estimatedMonthlyCost,
    pros,
    cons,
    alternatives,
    recommendation,
    warnings,
  };
}

/**
 * Get COBRA decision flowchart
 */
export function getCOBRADecisionFlowchart(): {
  question: string;
  yesPath: string;
  noPath: string;
}[] {
  return [
    {
      question: 'Do you have a new job with health insurance starting soon (within 1-3 months)?',
      yesPath: '✅ Consider COBRA for short-term continuity',
      noPath: '⬇️ Continue to next question',
    },
    {
      question: 'Are you in active treatment for a serious condition?',
      yesPath: '✅ COBRA may be worth it to continue current care',
      noPath: '⬇️ Continue to next question',
    },
    {
      question: 'Would you qualify for marketplace subsidies (income under $60k individual/$120k family)?',
      yesPath: '✅ Marketplace likely cheaper - switch ASAP',
      noPath: '⬇️ Continue to next question',
    },
    {
      question: 'Can you afford $1,500-2,000/month for COBRA?',
      yesPath: '⚠️ COBRA possible but expensive - compare marketplace',
      noPath: '❌ COBRA not affordable - explore marketplace and Medicaid',
    },
  ];
}

/**
 * Calculate when to drop COBRA
 */
export function calculateCOBRADropDate(
  jobLossDate: Date,
  nextOpenEnrollment: Date
): {
  dropDate: Date;
  reasoning: string;
} {
  const cobraEndDate = new Date(jobLossDate);
  cobraEndDate.setMonth(cobraEndDate.getMonth() + 18);

  // If next open enrollment is before COBRA ends, drop at open enrollment
  if (nextOpenEnrollment < cobraEndDate) {
    return {
      dropDate: nextOpenEnrollment,
      reasoning: `Drop COBRA during Open Enrollment (${nextOpenEnrollment.toLocaleDateString()}) to switch to a marketplace plan and save money.`,
    };
  }

  // Otherwise, you're stuck until COBRA ends
  return {
    dropDate: cobraEndDate,
    reasoning: `COBRA coverage ends ${cobraEndDate.toLocaleDateString()}. You'll have a Special Enrollment Period to switch to marketplace coverage at that time.`,
  };
}
