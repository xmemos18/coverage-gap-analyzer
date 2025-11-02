import { CalculatorFormData, AlternativeOption } from '@/types';
import { INSURANCE_COSTS, COVERAGE_SCORES, DEDUCTIBLE_RANGES, SUBSIDY_REDUCTION, COPAY_AMOUNTS } from '@/lib/constants';

/**
 * Generate alternative options for Medicare-eligible households
 */
export function getMedicareAlternatives(
  formData: CalculatorFormData,
  memberCount: number,
  states: string[]
): AlternativeOption[] {
  const statesList = states.join(', ');
  const multiStateWarning = states.length > 2
    ? `May need different plans across ${states.length} states`
    : `May need different plans in ${statesList}`;

  return [
    {
      name: 'Medicare Advantage',
      monthlyCost: {
        low: INSURANCE_COSTS.MEDICARE_ADVANTAGE_LOW,
        high: INSURANCE_COSTS.MEDICARE_ADVANTAGE_HIGH * memberCount
      },
      pros: [
        'Lower monthly premiums (sometimes $0)',
        'Often includes dental, vision, and prescription coverage',
        'Out-of-pocket maximum protects you',
      ],
      cons: [
        'Limited to specific networks in each state',
        multiStateWarning,
        'Requires referrals for specialists',
        'Coverage may not work seamlessly between states',
      ],
    },
    {
      name: 'Medicare + Medicare Supplement Plan N',
      monthlyCost: {
        low: INSURANCE_COSTS.MEDIGAP_PLAN_N_LOW * memberCount,
        high: INSURANCE_COSTS.MEDIGAP_PLAN_N_HIGH * memberCount
      },
      pros: [
        'Slightly lower premiums than Plan G',
        'Works nationwide with any Medicare provider',
        'No network restrictions',
      ],
      cons: [
        `Small copays for doctor visits ($${COPAY_AMOUNTS.DOCTOR_VISIT}) and ER ($${COPAY_AMOUNTS.EMERGENCY_ROOM})`,
        'Must pay Part B excess charges (rare)',
      ],
    },
  ];
}

/**
 * Generate alternative options for mixed households
 */
export function getMixedHouseholdAlternatives(
  formData: CalculatorFormData,
  medicareCount: number,
  adultCount: number,
  childCount: number,
  states: string[]
): AlternativeOption[] {
  const alternatives: AlternativeOption[] = [];
  const statesList = states.join(', ');
  const multiStateCon = states.length > 2
    ? `May need separate MA plans across ${states.length} states`
    : `May need separate MA plans in ${statesList}`;

  const multiStatePlanCon = states.length > 2
    ? `May need different plans across ${states.length} states`
    : `May need different plans for ${statesList}`;

  // Medicare Advantage for seniors
  if (medicareCount > 0) {
    alternatives.push({
      name: 'Medicare Advantage for seniors + PPO for others',
      monthlyCost: {
        low: (medicareCount * INSURANCE_COSTS.MEDICARE_ADVANTAGE_LOW) +
             (adultCount * INSURANCE_COSTS.ADULT_PPO_LOW) +
             (childCount * INSURANCE_COSTS.CHILD_LOW),
        high: (medicareCount * INSURANCE_COSTS.MEDICARE_ADVANTAGE_HIGH) +
              (adultCount * INSURANCE_COSTS.ADULT_PPO_HIGH) +
              (childCount * INSURANCE_COSTS.CHILD_HIGH),
      },
      pros: [
        'Lower costs for Medicare-eligible members',
        'Single PPO plan covers all non-Medicare members',
      ],
      cons: [
        'Medicare Advantage has network limitations',
        multiStateCon,
        'Complex coordination between Medicare and private insurance',
      ],
    });
  }

  // ACA Marketplace
  alternatives.push({
    name: 'ACA Marketplace plans for all non-Medicare members',
    monthlyCost: {
      low: (adultCount * INSURANCE_COSTS.ACA_ADULT_LOW) +
           (childCount * INSURANCE_COSTS.ACA_CHILD_LOW),
      high: (adultCount * INSURANCE_COSTS.ACA_ADULT_HIGH) +
            (childCount * INSURANCE_COSTS.ACA_CHILD_HIGH),
    },
    pros: [
      'Income-based subsidies may significantly reduce costs',
      'Guaranteed coverage regardless of health conditions',
      'Pediatric dental and vision included for children',
    ],
    cons: [
      'Network coverage varies by state',
      multiStatePlanCon,
      'Limited to specific enrollment periods',
    ],
  });

  return alternatives;
}

/**
 * Generate alternative options for non-Medicare households
 */
export function getNonMedicareAlternatives(
  formData: CalculatorFormData,
  adultCount: number,
  childCount: number,
  states: string[],
  coverageScore: number
): AlternativeOption[] {
  const totalMembers = adultCount + childCount;
  const alternatives: AlternativeOption[] = [];
  const statesList = states.join(', ');

  // Regional PPO (if states are adjacent)
  if (coverageScore === COVERAGE_SCORES.ADJACENT_STATES && states.length === 2) {
    alternatives.push({
      name: 'Regional PPO Plan',
      monthlyCost: {
        low: totalMembers * INSURANCE_COSTS.REGIONAL_PPO_PER_PERSON_LOW,
        high: totalMembers * INSURANCE_COSTS.REGIONAL_PPO_PER_PERSON_HIGH,
      },
      pros: [
        `Lower premiums than national plans`,
        `Good network coverage in ${statesList}`,
        'Still allows out-of-network care at higher cost',
      ],
      cons: [
        'Smaller provider network than national plans',
        'May have higher costs if you travel outside the region',
      ],
    });
  }

  // ACA Marketplace
  const multiStatePlanCon = states.length > 2
    ? `May need separate plans across ${states.length} states`
    : `May need separate plans in ${statesList}`;

  alternatives.push({
    name: 'ACA Marketplace Plans',
    monthlyCost: {
      low: (adultCount * INSURANCE_COSTS.ACA_ADULT_LOW) +
           (childCount * INSURANCE_COSTS.ACA_CHILD_LOW),
      high: (adultCount * INSURANCE_COSTS.ACA_ADULT_HIGH) +
            (childCount * INSURANCE_COSTS.ACA_CHILD_HIGH),
    },
    pros: [
      `Income-based subsidies can reduce costs by ${SUBSIDY_REDUCTION.LOW}-${SUBSIDY_REDUCTION.HIGH}%`,
      'Guaranteed coverage regardless of pre-existing conditions',
      'Essential health benefits required',
    ],
    cons: [
      'Network limited to specific state',
      multiStatePlanCon,
      'Can only enroll during open enrollment (Nov-Jan) unless qualifying event',
    ],
  });

  // High Deductible Health Plan with HSA
  alternatives.push({
    name: 'High-Deductible Health Plan (HDHP) with HSA',
    monthlyCost: {
      low: (adultCount * INSURANCE_COSTS.HDHP_ADULT_LOW) +
           (childCount * INSURANCE_COSTS.HDHP_CHILD_LOW),
      high: (adultCount * INSURANCE_COSTS.HDHP_ADULT_HIGH) +
            (childCount * INSURANCE_COSTS.HDHP_CHILD_HIGH),
    },
    pros: [
      'Significantly lower monthly premiums',
      'HSA contributions are tax-deductible',
      'HSA funds roll over year to year and grow tax-free',
      'Good option if your household is healthy',
    ],
    cons: [
      `High deductible ($${DEDUCTIBLE_RANGES.HDHP_FAMILY_LOW.toLocaleString()}-$${DEDUCTIBLE_RANGES.HDHP_FAMILY_HIGH.toLocaleString()} for families)`,
      'You pay full cost of care until deductible is met',
      'Not ideal if you have chronic conditions or need frequent care',
    ],
  });

  return alternatives;
}
