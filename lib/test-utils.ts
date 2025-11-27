/**
 * Test Utilities
 *
 * Shared test helpers for creating test data and mocks.
 */

import type { CalculatorFormData, Residence } from '@/types';

/**
 * Default test residences
 */
export const DEFAULT_TEST_RESIDENCE: Residence = {
  zip: '27601',
  state: 'NC',
  isPrimary: true,
  monthsPerYear: 12,
};

/**
 * Create test form data with optional overrides
 */
export function createTestFormData(
  overrides?: Partial<CalculatorFormData>
): CalculatorFormData {
  return {
    residences: [DEFAULT_TEST_RESIDENCE],
    numAdults: 1,
    adultAges: [35],
    adultsUseTobacco: [false],
    numChildren: 0,
    childAges: [],
    childrenUseTobacco: [],
    hasMedicareEligible: false,
    hasEmployerInsurance: false,
    employerContribution: 0,
    hasChronicConditions: false,
    chronicConditions: [],
    prescriptionCount: '0-2',
    providerPreference: 'no-preference',
    doctorVisitsPerYear: '0-2',
    specialistVisitsPerYear: 'none',
    erVisitsPerYear: 'none',
    plannedProcedures: false,
    takesSpecialtyMeds: false,
    monthlyMedicationCost: 'under-50',
    usesMailOrderPharmacy: false,
    hasPreferredHospital: false,
    preferredHospitalName: '',
    hospitalImportance: 'no-preference',
    needsNationalCoverage: 'not-important',
    financialPriority: 'balanced',
    canAffordUnexpectedBill: 'yes-easily',
    preferredPlanTypes: [],
    budget: '400-600',
    incomeRange: '60k-80k',
    currentStep: 4,
    simpleMode: false,
    hasCurrentInsurance: false,
    currentInsurance: {
      carrier: '',
      planType: '',
      monthlyCost: 0,
      deductible: 0,
      outOfPocketMax: 0,
      coverageNotes: '',
    },
    interestedInAddOns: true,
    addOnBudget: undefined,
    ...overrides,
  };
}

/**
 * Create form data for a family
 */
export function createFamilyFormData(
  numAdults: number = 2,
  numChildren: number = 2,
  overrides?: Partial<CalculatorFormData>
): CalculatorFormData {
  const adultAges = numAdults === 2 ? [38, 36] : Array(numAdults).fill(35);
  const childAges = numChildren === 2 ? [8, 5] : Array(numChildren).fill(10);

  return createTestFormData({
    numAdults,
    numChildren,
    adultAges,
    childAges,
    adultsUseTobacco: Array(numAdults).fill(false),
    childrenUseTobacco: Array(numChildren).fill(false),
    ...overrides,
  });
}

/**
 * Create form data for a Medicare-eligible individual
 */
export function createMedicareFormData(
  overrides?: Partial<CalculatorFormData>
): CalculatorFormData {
  return createTestFormData({
    numAdults: 1,
    adultAges: [67],
    hasMedicareEligible: true,
    ...overrides,
  });
}

/**
 * Create form data for a multi-state household
 */
export function createMultiStateFormData(
  states: string[] = ['NC', 'FL'],
  overrides?: Partial<CalculatorFormData>
): CalculatorFormData {
  const residences: Residence[] = states.map((state, index) => ({
    zip: getTestZipForState(state),
    state,
    isPrimary: index === 0,
    monthsPerYear: index === 0 ? 8 : 4,
  }));

  return createTestFormData({
    residences,
    ...overrides,
  });
}

/**
 * Get a test ZIP code for a given state
 */
export function getTestZipForState(state: string): string {
  const stateZips: Record<string, string> = {
    'AL': '35201', 'AK': '99501', 'AZ': '85001', 'AR': '72201',
    'CA': '90210', 'CO': '80202', 'CT': '06101', 'DE': '19901',
    'FL': '33139', 'GA': '30301', 'HI': '96801', 'ID': '83702',
    'IL': '60601', 'IN': '46201', 'IA': '50301', 'KS': '66101',
    'KY': '40201', 'LA': '70112', 'ME': '04101', 'MD': '21201',
    'MA': '02101', 'MI': '48201', 'MN': '55401', 'MS': '39201',
    'MO': '63101', 'MT': '59601', 'NE': '68101', 'NV': '89101',
    'NH': '03101', 'NJ': '07101', 'NM': '87101', 'NY': '10001',
    'NC': '27601', 'ND': '58501', 'OH': '43201', 'OK': '73101',
    'OR': '97201', 'PA': '19101', 'RI': '02901', 'SC': '29201',
    'SD': '57501', 'TN': '37201', 'TX': '75001', 'UT': '84101',
    'VT': '05401', 'VA': '23218', 'WA': '98101', 'WV': '25301',
    'WI': '53201', 'WY': '82001', 'DC': '20001',
  };
  return stateZips[state] || '27601';
}
