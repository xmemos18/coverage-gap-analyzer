/**
 * Medicare Advantage Comparison Helper
 * Helps users understand when Medicare Advantage might be better than Original Medicare + Medigap
 */

import { CalculatorFormData } from '@/types';
import { INSURANCE_COSTS } from '@/lib/constants';

export interface MedicareAdvantageAnalysis {
  isGoodFit: boolean;
  confidenceLevel: 'high' | 'medium' | 'low';
  reasoning: string[];
  pros: string[];
  cons: string[];
  estimatedMonthlyCost: {
    low: number;
    high: number;
  };
  whenToConsider: string[];
  redFlags: string[];
}

/**
 * Analyze if Medicare Advantage is a good fit for the user
 */
export function analyzeMedicareAdvantageFit(
  formData: CalculatorFormData,
  states: string[]
): MedicareAdvantageAnalysis {
  const reasoning: string[] = [];
  const pros: string[] = [];
  const cons: string[] = [];
  const whenToConsider: string[] = [];
  const redFlags: string[] = [];

  let isGoodFit = false;
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';

  // Factor 1: Number of states/residences
  const isMultiState = states.length > 1;
  if (isMultiState) {
    redFlags.push(`You have homes in ${states.length} states - Medicare Advantage plans typically only work well in one geographic area`);
    cons.push('Network restrictions make multi-state coverage challenging');
    reasoning.push('Multi-state lifestyle is NOT ideal for Medicare Advantage');
    confidenceLevel = 'low';
  } else {
    pros.push('Single-state residence works well with Medicare Advantage networks');
    reasoning.push('Single location means Medicare Advantage network restrictions are less of a concern');
    whenToConsider.push('You live primarily in one area');
    isGoodFit = true;
  }

  // Factor 2: Travel frequency
  if (formData.residences.length > 1) {
    const totalMonths = formData.residences.reduce((sum, res) => sum + (res.monthsPerYear || 0), 0);
    if (totalMonths > 3) {
      redFlags.push('You spend significant time in multiple locations');
      cons.push('Emergency coverage only when traveling - no routine care');
      reasoning.push('Frequent travel means limited access to in-network care');
    }
  }

  // Factor 3: Health status
  const hasChronicConditions = formData.hasChronicConditions && formData.chronicConditions.length > 0;
  const highRxCount = formData.prescriptionCount === '4-or-more';

  if (hasChronicConditions || highRxCount) {
    pros.push('Often includes prescription drug coverage at no extra cost');
    pros.push('Out-of-pocket maximum provides financial protection');
    reasoning.push('Your health needs mean built-in drug coverage could save money');
    whenToConsider.push('You need regular medications');
  } else {
    pros.push('Very low or $0 monthly premiums');
    reasoning.push('Healthy individuals can benefit from low premiums');
    whenToConsider.push('You are generally healthy with minimal healthcare needs');
  }

  // Factor 4: Provider preferences
  if (formData.providerPreference === 'specific-doctors') {
    redFlags.push('You prefer specific doctors - must verify they are in the Medicare Advantage network');
    cons.push('Must use network providers or pay significantly more');
    reasoning.push('Strong doctor preferences require careful network verification');
  } else {
    pros.push('If doctors are in-network, care is well-coordinated');
    whenToConsider.push('You are flexible with choosing doctors from a network');
  }

  // Factor 5: Budget considerations
  if (formData.budget === 'under-200' || formData.budget === '200-400') {
    pros.push('Lower monthly premiums than Medicare + Medigap');
    reasoning.push('Tight budget makes lower Medicare Advantage premiums attractive');
    whenToConsider.push('You want the lowest possible monthly premiums');
    isGoodFit = true;
  }

  // Factor 6: Additional benefits
  pros.push('May include dental, vision, and hearing benefits');
  pros.push('Often includes gym memberships and wellness programs');
  pros.push('Some plans offer over-the-counter drug allowances');
  whenToConsider.push('You value extra benefits like dental and vision');

  // Calculate costs
  const memberCount = formData.numAdults; // Assuming Medicare-eligible
  const estimatedMonthlyCost = {
    low: INSURANCE_COSTS.MEDICARE_ADVANTAGE_LOW,
    high: INSURANCE_COSTS.MEDICARE_ADVANTAGE_HIGH * memberCount
  };

  // Overall assessment
  if (isMultiState || redFlags.length >= 3) {
    isGoodFit = false;
    confidenceLevel = 'low';
    reasoning.push('Overall: Medicare Advantage is NOT recommended due to your multi-state lifestyle');
  } else if (redFlags.length === 0 && whenToConsider.length >= 3) {
    isGoodFit = true;
    confidenceLevel = 'high';
    reasoning.push('Overall: Medicare Advantage could be a good fit - verify network coverage carefully');
  } else {
    isGoodFit = true;
    confidenceLevel = 'medium';
    reasoning.push('Overall: Medicare Advantage might work - carefully weigh the trade-offs');
  }

  // Add comparison items
  cons.push('Limited to plan network (HMO) or higher costs for out-of-network (PPO)');
  cons.push('May need referrals to see specialists (HMO plans)');
  cons.push('Plans can change networks and coverage annually');

  return {
    isGoodFit,
    confidenceLevel,
    reasoning,
    pros,
    cons,
    estimatedMonthlyCost,
    whenToConsider,
    redFlags,
  };
}

/**
 * Get shopping tips for Medicare Advantage
 */
export function getMedicareAdvantageShoppingTips(states: string[]): string[] {
  const tips: string[] = [
    '📋 Use Medicare.gov Plan Finder to compare all plans in your area',
    '🏥 Check if your doctors are in the plan network before enrolling',
    '💊 Enter all your medications to see which plan covers them best',
    '📞 Call the plan to confirm coverage details and ask about restrictions',
    '📅 Review your plan every year during Open Enrollment (Oct 15 - Dec 7)',
  ];

  if (states.length > 1) {
    tips.push(`⚠️ IMPORTANT: Check if the plan has coverage in all your states: ${states.join(', ')}`);
    tips.push('🚨 Most Medicare Advantage plans only work in one service area');
  }

  tips.push('💰 Compare total costs: premiums + expected out-of-pocket costs, not just premiums');
  tips.push('⭐ Check plan star ratings (aim for 4+ stars)');

  return tips;
}

/**
 * Compare Original Medicare + Medigap vs Medicare Advantage
 */
export function compareToMedigap(
  memberCount: number,
  isMultiState: boolean
): {
  medigapAdvantages: string[];
  medicareAdvantageAdvantages: string[];
  recommendation: string;
} {
  const medigapAdvantages = [
    'Works everywhere in the US with any doctor',
    'No network restrictions or referrals needed',
    'More predictable costs',
    'Better for people who travel or have multiple homes',
    'Can keep the same coverage everywhere',
  ];

  const medicareAdvantageAdvantages = [
    'Lower monthly premiums ($0-$50 vs $125-200 for Medigap)',
    'Includes prescription drug coverage',
    'May include dental, vision, hearing',
    'Out-of-pocket maximum provides protection',
    'Extra perks like gym memberships',
  ];

  const recommendation = isMultiState
    ? 'For multi-state residents, Original Medicare + Medigap is strongly recommended due to nationwide coverage and no network restrictions.'
    : 'For single-state residents who stay in one area, Medicare Advantage can be cost-effective. Original Medicare + Medigap offers more flexibility if you plan to travel.';

  return {
    medigapAdvantages,
    medicareAdvantageAdvantages,
    recommendation,
  };
}
