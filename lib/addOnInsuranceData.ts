/**
 * Add-On Insurance Data Configuration
 *
 * Defines all available add-on insurance products with age-based recommendations
 */

import type { AddOnInsurance } from '@/types/addOnInsurance';

/**
 * All available add-on insurance products
 * Base costs are national averages and will be adjusted by state multipliers
 */
export const ADD_ON_INSURANCE_PRODUCTS: AddOnInsurance[] = [
  {
    id: 'dental',
    name: 'Dental Insurance',
    shortName: 'Dental',
    description: 'Coverage for preventive care, basic procedures, and major dental work',
    category: 'dental',
    baseCostPerMonth: 45,
    benefits: [
      '2 cleanings & exams per year',
      'X-rays and diagnostics',
      'Fillings and extractions',
      'Root canals and crowns',
      'Orthodontics (some plans)',
    ],
    typicalCoverage: '100% preventive, 80% basic, 50% major',
    bestFor: ['Families with children', 'Anyone needing regular dental care', 'Orthodontic needs'],
    ageRecommendations: [
      {
        minAge: 0,
        maxAge: 17,
        priority: 'high',
        probabilityThreshold: 95,
        reasonCode: 'CHILDREN_PRESENT',
      },
      {
        minAge: 18,
        maxAge: 30,
        priority: 'medium',
        probabilityThreshold: 70,
        reasonCode: 'PREVENTIVE_CARE',
      },
      {
        minAge: 31,
        maxAge: 50,
        priority: 'high',
        probabilityThreshold: 85,
        reasonCode: 'PREVENTIVE_CARE',
      },
      {
        minAge: 51,
        maxAge: 64,
        priority: 'high',
        probabilityThreshold: 85,
        reasonCode: 'PREVENTIVE_CARE',
      },
      {
        minAge: 65,
        maxAge: 120,
        priority: 'high',
        probabilityThreshold: 90,
        reasonCode: 'MEDICARE_GAPS',
      },
    ],
  },
  {
    id: 'vision',
    name: 'Vision Insurance',
    shortName: 'Vision',
    description: 'Coverage for eye exams, glasses, contact lenses, and vision correction',
    category: 'vision',
    baseCostPerMonth: 22,
    benefits: [
      'Annual eye exam',
      'Prescription glasses or contacts',
      'Discounts on LASIK surgery',
      'Frames and lenses allowance',
    ],
    typicalCoverage: '$150-300 frames allowance, exam covered',
    bestFor: ['Anyone who wears glasses/contacts', 'Families with children', 'Computer workers'],
    ageRecommendations: [
      {
        minAge: 0,
        maxAge: 17,
        priority: 'high',
        probabilityThreshold: 90,
        reasonCode: 'CHILDREN_PRESENT',
      },
      {
        minAge: 18,
        maxAge: 40,
        priority: 'medium',
        probabilityThreshold: 65,
        reasonCode: 'PREVENTIVE_CARE',
      },
      {
        minAge: 41,
        maxAge: 64,
        priority: 'medium',
        probabilityThreshold: 70,
        reasonCode: 'PREVENTIVE_CARE',
      },
      {
        minAge: 65,
        maxAge: 120,
        priority: 'high',
        probabilityThreshold: 85,
        reasonCode: 'MEDICARE_GAPS',
      },
    ],
  },
  {
    id: 'accident',
    name: 'Accident Insurance',
    shortName: 'Accident',
    description: 'Cash benefits for injuries from accidents, covering out-of-pocket costs',
    category: 'accident',
    baseCostPerMonth: 35,
    benefits: [
      'Emergency room visits',
      'Ambulance transportation',
      'Fractures and dislocations',
      'Burns and lacerations',
      'Follow-up care',
    ],
    typicalCoverage: 'Lump sum payments based on injury type',
    bestFor: ['Active individuals', 'Families with children', 'High-deductible health plans'],
    ageRecommendations: [
      {
        minAge: 0,
        maxAge: 17,
        priority: 'medium',
        probabilityThreshold: 70,
        reasonCode: 'CHILDREN_PRESENT',
      },
      {
        minAge: 18,
        maxAge: 30,
        priority: 'high',
        probabilityThreshold: 85,
        reasonCode: 'YOUNG_ADULT',
      },
      {
        minAge: 31,
        maxAge: 50,
        priority: 'medium',
        probabilityThreshold: 60,
        reasonCode: 'OUT_OF_POCKET',
      },
      {
        minAge: 51,
        maxAge: 120,
        priority: 'low',
        probabilityThreshold: 40,
        reasonCode: 'OUT_OF_POCKET',
      },
    ],
  },
  {
    id: 'critical-illness',
    name: 'Critical Illness Insurance',
    shortName: 'Critical Illness',
    description: 'Lump sum payment upon diagnosis of major illnesses like cancer, heart attack, or stroke',
    category: 'critical-illness',
    baseCostPerMonth: 100,
    benefits: [
      'Cancer diagnosis coverage',
      'Heart attack and stroke',
      'Organ transplant',
      'Kidney failure',
      'Major burn coverage',
    ],
    typicalCoverage: '$10,000-$100,000 lump sum benefit',
    bestFor: ['Mid-career professionals', 'Those with family history', 'High-deductible plans'],
    ageRecommendations: [
      {
        minAge: 18,
        maxAge: 30,
        priority: 'low',
        probabilityThreshold: 30,
        reasonCode: 'CATASTROPHIC_PROTECTION',
      },
      {
        minAge: 31,
        maxAge: 40,
        priority: 'medium',
        probabilityThreshold: 60,
        reasonCode: 'FAMILY_PLANNING',
      },
      {
        minAge: 41,
        maxAge: 50,
        priority: 'high',
        probabilityThreshold: 80,
        reasonCode: 'MID_CAREER',
      },
      {
        minAge: 51,
        maxAge: 64,
        priority: 'high',
        probabilityThreshold: 90,
        reasonCode: 'PRE_RETIREMENT',
      },
      {
        minAge: 65,
        maxAge: 74,
        priority: 'high',
        probabilityThreshold: 85,
        reasonCode: 'SENIOR_HEALTH',
      },
      {
        minAge: 75,
        maxAge: 120,
        priority: 'medium',
        probabilityThreshold: 65,
        reasonCode: 'SENIOR_HEALTH',
      },
    ],
  },
  {
    id: 'hospital-indemnity',
    name: 'Hospital Indemnity Insurance',
    shortName: 'Hospital Indemnity',
    description: 'Daily cash benefit for hospital stays, regardless of medical bills',
    category: 'hospital-indemnity',
    baseCostPerMonth: 55,
    benefits: [
      'Daily hospital confinement benefit',
      'ICU daily benefit (higher amount)',
      'Hospital admission benefit',
      'Emergency room benefit',
      'Ambulance benefit',
    ],
    typicalCoverage: '$100-500 per day of hospitalization',
    bestFor: ['High-deductible plans', 'Frequent travelers', 'Older adults'],
    ageRecommendations: [
      {
        minAge: 18,
        maxAge: 40,
        priority: 'low',
        probabilityThreshold: 35,
        reasonCode: 'OUT_OF_POCKET',
      },
      {
        minAge: 41,
        maxAge: 50,
        priority: 'medium',
        probabilityThreshold: 60,
        reasonCode: 'OUT_OF_POCKET',
      },
      {
        minAge: 51,
        maxAge: 64,
        priority: 'high',
        probabilityThreshold: 75,
        reasonCode: 'HOSPITAL_RISK',
      },
      {
        minAge: 65,
        maxAge: 74,
        priority: 'high',
        probabilityThreshold: 85,
        reasonCode: 'HOSPITAL_RISK',
      },
      {
        minAge: 75,
        maxAge: 120,
        priority: 'high',
        probabilityThreshold: 95,
        reasonCode: 'HOSPITAL_RISK',
      },
    ],
  },
  {
    id: 'disability',
    name: 'Disability Insurance (Income Protection)',
    shortName: 'Disability',
    description: 'Replaces portion of income if unable to work due to illness or injury',
    category: 'disability',
    baseCostPerMonth: 125,
    benefits: [
      'Short-term disability (90 days - 2 years)',
      'Long-term disability (2+ years)',
      '50-70% income replacement',
      'Own-occupation coverage',
      'Residual benefits for partial disability',
    ],
    typicalCoverage: '60% of pre-disability income',
    bestFor: ['Primary earners', 'Self-employed', 'Single-income households'],
    ageRecommendations: [
      {
        minAge: 18,
        maxAge: 30,
        priority: 'low',
        probabilityThreshold: 40,
        reasonCode: 'INCOME_REPLACEMENT',
      },
      {
        minAge: 31,
        maxAge: 40,
        priority: 'high',
        probabilityThreshold: 90,
        reasonCode: 'PRIMARY_EARNER',
      },
      {
        minAge: 41,
        maxAge: 50,
        priority: 'high',
        probabilityThreshold: 90,
        reasonCode: 'PRIMARY_EARNER',
      },
      {
        minAge: 51,
        maxAge: 64,
        priority: 'medium',
        probabilityThreshold: 70,
        reasonCode: 'PRE_RETIREMENT',
      },
      {
        minAge: 65,
        maxAge: 120,
        priority: 'low',
        probabilityThreshold: 20,
        reasonCode: 'INCOME_REPLACEMENT',
      },
    ],
  },
  {
    id: 'long-term-care',
    name: 'Long-Term Care Insurance',
    shortName: 'Long-Term Care',
    description: 'Coverage for extended care services like nursing homes, assisted living, or in-home care',
    category: 'long-term-care',
    baseCostPerMonth: 200,
    benefits: [
      'Nursing home care',
      'Assisted living facility',
      'In-home care services',
      'Adult day care',
      'Respite care for caregivers',
    ],
    typicalCoverage: '$150-300 per day for 3-5 years',
    bestFor: ['Ages 50-60 (best rates)', 'Those with family history', 'Asset protection'],
    ageRecommendations: [
      {
        minAge: 18,
        maxAge: 40,
        priority: 'low',
        probabilityThreshold: 10,
        reasonCode: 'CATASTROPHIC_PROTECTION',
      },
      {
        minAge: 41,
        maxAge: 50,
        priority: 'low',
        probabilityThreshold: 30,
        reasonCode: 'FAMILY_PLANNING',
      },
      {
        minAge: 51,
        maxAge: 64,
        priority: 'medium',
        probabilityThreshold: 70,
        reasonCode: 'PRE_RETIREMENT',
      },
      {
        minAge: 65,
        maxAge: 74,
        priority: 'high',
        probabilityThreshold: 85,
        reasonCode: 'SENIOR_HEALTH',
      },
      {
        minAge: 75,
        maxAge: 120,
        priority: 'high',
        probabilityThreshold: 90,
        reasonCode: 'SENIOR_HEALTH',
      },
    ],
  },
  {
    id: 'term-life',
    name: 'Term Life Insurance',
    shortName: 'Term Life',
    description: 'Death benefit to protect dependents and replace income for 10-30 years',
    category: 'life',
    baseCostPerMonth: 60,
    benefits: [
      'Death benefit payment',
      'Income replacement',
      'Mortgage protection',
      'College fund protection',
      'Final expense coverage',
    ],
    typicalCoverage: '$250,000-$1,000,000 death benefit',
    bestFor: ['Parents with children', 'Primary earners', 'Mortgage holders'],
    ageRecommendations: [
      {
        minAge: 18,
        maxAge: 30,
        priority: 'low',
        probabilityThreshold: 40,
        reasonCode: 'FAMILY_PLANNING',
      },
      {
        minAge: 31,
        maxAge: 40,
        priority: 'high',
        probabilityThreshold: 85,
        reasonCode: 'DEPENDENTS',
      },
      {
        minAge: 41,
        maxAge: 50,
        priority: 'high',
        probabilityThreshold: 85,
        reasonCode: 'DEPENDENTS',
      },
      {
        minAge: 51,
        maxAge: 64,
        priority: 'medium',
        probabilityThreshold: 60,
        reasonCode: 'DEPENDENTS',
      },
      {
        minAge: 65,
        maxAge: 120,
        priority: 'low',
        probabilityThreshold: 30,
        reasonCode: 'CATASTROPHIC_PROTECTION',
      },
    ],
  },
];

/**
 * Get all add-on insurance products
 */
export function getAllAddOnInsurance(): AddOnInsurance[] {
  return ADD_ON_INSURANCE_PRODUCTS;
}

/**
 * Get add-on insurance by ID
 */
export function getAddOnInsuranceById(id: string): AddOnInsurance | undefined {
  return ADD_ON_INSURANCE_PRODUCTS.find((product) => product.id === id);
}

/**
 * Get add-on insurance by category
 */
export function getAddOnInsuranceByCategory(
  category: string
): AddOnInsurance[] {
  return ADD_ON_INSURANCE_PRODUCTS.filter(
    (product) => product.category === category
  );
}

/**
 * Cost adjustment factors
 */
export const ADD_ON_COST_ADJUSTMENTS = {
  // Family discounts (2+ members)
  FAMILY_DISCOUNT: 0.9, // 10% off

  // Bundle discounts (3+ add-ons)
  BUNDLE_DISCOUNT: 0.95, // 5% off

  // Multi-state premium adjustment
  MULTI_STATE_PREMIUM: 1.05, // 5% increase for coverage across multiple states
} as const;

/**
 * Priority display thresholds
 */
export const PRIORITY_THRESHOLDS = {
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
} as const;
