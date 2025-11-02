/**
 * Insurance Terms Dictionary
 * Provides plain-language definitions for insurance jargon
 */

export interface InsuranceTerm {
  term: string;
  definition: string;
  example?: string;
}

export const INSURANCE_TERMS: Record<string, InsuranceTerm> = {
  // Plan Types
  'Medicare': {
    term: 'Medicare',
    definition: 'Federal health insurance program for people 65 or older, certain younger people with disabilities, and people with End-Stage Renal Disease.',
    example: 'If you\'re 65 or older, you qualify for Medicare.',
  },
  'Medicare Advantage': {
    term: 'Medicare Advantage',
    definition: 'An alternative to Original Medicare offered by private companies. Bundles hospital coverage (Part A), medical coverage (Part B), and often prescription drugs (Part D).',
    example: 'Also called Medicare Part C. Often includes vision and dental coverage.',
  },
  'Medigap': {
    term: 'Medigap',
    definition: 'Supplemental insurance that helps pay for costs not covered by Original Medicare, like copayments, coinsurance, and deductibles.',
    example: 'Plan N is a popular Medigap option that covers most gaps in Medicare.',
  },
  'PPO': {
    term: 'PPO (Preferred Provider Organization)',
    definition: 'A health plan that gives you flexibility to see any doctor or specialist without a referral, but offers lower costs if you use in-network providers.',
    example: 'With a PPO, you can see specialists without getting a referral first.',
  },
  'HMO': {
    term: 'HMO (Health Maintenance Organization)',
    definition: 'A health plan that requires you to choose a primary care doctor and get referrals to see specialists. You must use in-network providers except in emergencies.',
    example: 'HMOs typically have lower premiums but less flexibility than PPOs.',
  },
  'EPO': {
    term: 'EPO (Exclusive Provider Organization)',
    definition: 'A managed care plan that only covers services from in-network providers, except in emergencies. No referrals needed for specialists.',
    example: 'Like an HMO but without requiring referrals for specialists.',
  },
  'ACA': {
    term: 'ACA (Affordable Care Act)',
    definition: 'Federal law that created health insurance marketplaces and provides subsidies to help people afford coverage. Also called "Obamacare."',
    example: 'ACA marketplace plans cover essential health benefits and pre-existing conditions.',
  },
  'HDHP': {
    term: 'HDHP (High Deductible Health Plan)',
    definition: 'A health plan with lower monthly premiums but higher deductibles. Can be paired with a Health Savings Account (HSA) for tax-advantaged savings.',
    example: 'Good for healthy individuals who want to save on monthly costs.',
  },

  // Cost-Related Terms
  'Premium': {
    term: 'Premium',
    definition: 'The amount you pay each month for your health insurance coverage, whether you use medical services or not.',
    example: 'Your premium is like your monthly membership fee for health insurance.',
  },
  'Deductible': {
    term: 'Deductible',
    definition: 'The amount you must pay out-of-pocket for covered healthcare services before your insurance starts paying.',
    example: 'With a $2,000 deductible, you pay the first $2,000 of covered services yourself.',
  },
  'Copay': {
    term: 'Copay (Copayment)',
    definition: 'A fixed amount you pay for a covered healthcare service, usually at the time of service.',
    example: 'You might pay a $20 copay each time you visit your doctor.',
  },
  'Coinsurance': {
    term: 'Coinsurance',
    definition: 'Your share of the costs of a covered healthcare service, calculated as a percentage (usually after you\'ve paid your deductible).',
    example: 'With 20% coinsurance, you pay 20% and insurance pays 80% after your deductible is met.',
  },
  'Out-of-Pocket Maximum': {
    term: 'Out-of-Pocket Maximum',
    definition: 'The most you have to pay for covered services in a plan year. After you reach this amount, your insurance pays 100% of covered services.',
    example: 'If your max is $8,000, once you\'ve spent that much, insurance covers everything else.',
  },

  // Coverage Terms
  'In-Network': {
    term: 'In-Network',
    definition: 'Doctors, hospitals, and other healthcare providers that have contracted with your insurance company to provide services at negotiated rates.',
    example: 'Using in-network providers typically costs less than going out-of-network.',
  },
  'Out-of-Network': {
    term: 'Out-of-Network',
    definition: 'Providers who don\'t have a contract with your insurance company. Services usually cost more and may not be covered at all.',
    example: 'Emergency care is usually covered even if the hospital is out-of-network.',
  },
  'Network': {
    term: 'Network',
    definition: 'The group of doctors, hospitals, and other healthcare providers that have agreements with an insurance plan.',
    example: 'Check if your doctor is in your plan\'s network before choosing.',
  },
  'Prior Authorization': {
    term: 'Prior Authorization',
    definition: 'Approval from your insurance company required before certain services, medications, or procedures are covered.',
    example: 'Some MRI scans require prior authorization from your insurance.',
  },
  'Formulary': {
    term: 'Formulary',
    definition: 'The list of prescription drugs covered by your insurance plan, often organized into tiers with different costs.',
    example: 'Generic drugs are usually on the lowest tier of the formulary.',
  },

  // Medicare-Specific
  'Medicare Part A': {
    term: 'Medicare Part A',
    definition: 'Hospital insurance that covers inpatient hospital stays, skilled nursing facility care, hospice care, and some home health care.',
    example: 'Most people get Part A premium-free if they worked and paid Medicare taxes.',
  },
  'Medicare Part B': {
    term: 'Medicare Part B',
    definition: 'Medical insurance that covers doctor visits, outpatient care, preventive services, and some home health care.',
    example: 'Part B has a monthly premium based on your income.',
  },
  'Medicare Part D': {
    term: 'Medicare Part D',
    definition: 'Prescription drug coverage offered by private insurance companies approved by Medicare.',
    example: 'You can add Part D to Original Medicare or choose a Medicare Advantage plan with drug coverage.',
  },
  'Donut Hole': {
    term: 'Donut Hole (Coverage Gap)',
    definition: 'A temporary limit on what Medicare Part D will cover for prescription drugs, occurring after you and your plan have spent a certain amount on covered drugs.',
    example: 'In the donut hole, you pay more for your prescriptions until you reach catastrophic coverage.',
  },

  // Other Common Terms
  'Primary Residence': {
    term: 'Primary Residence',
    definition: 'The home where you spend most of your time throughout the year.',
    example: 'Your primary residence determines which state\'s insurance regulations apply.',
  },
  'Secondary Residence': {
    term: 'Secondary Residence',
    definition: 'An additional home where you spend part of the year, such as a vacation home or seasonal residence.',
    example: 'Snowbirds often have a secondary residence in a warmer climate.',
  },
  'Open Enrollment': {
    term: 'Open Enrollment',
    definition: 'A specific period each year when you can enroll in health insurance or make changes to your coverage.',
    example: 'For ACA marketplace plans, open enrollment typically runs from November to January.',
  },
  'Special Enrollment Period': {
    term: 'Special Enrollment Period',
    definition: 'A time outside the annual open enrollment when you can sign up for health insurance due to qualifying life events (marriage, moving, losing coverage, etc.).',
    example: 'Moving to a new state qualifies you for a special enrollment period.',
  },
  'Pre-existing Condition': {
    term: 'Pre-existing Condition',
    definition: 'A health problem you had before the date your new health coverage starts.',
    example: 'Under the ACA, insurers cannot deny coverage or charge more for pre-existing conditions.',
  },
  'Essential Health Benefits': {
    term: 'Essential Health Benefits',
    definition: 'Ten categories of services that ACA marketplace plans must cover, including emergency services, hospitalization, prescription drugs, and preventive care.',
    example: 'All marketplace plans must cover these 10 essential health benefits.',
  },
  'Subsidy': {
    term: 'Subsidy',
    definition: 'Financial assistance from the government to help pay for health insurance premiums and out-of-pocket costs.',
    example: 'If your income is below a certain level, you may qualify for ACA subsidies.',
  },
} as const;

/**
 * Get definition for an insurance term
 */
export function getInsuranceTerm(term: string): InsuranceTerm | undefined {
  return INSURANCE_TERMS[term];
}

/**
 * Check if a term has a definition available
 */
export function hasDefinition(term: string): boolean {
  return term in INSURANCE_TERMS;
}

/**
 * Get all available terms (for autocomplete, search, etc.)
 */
export function getAllTerms(): string[] {
  return Object.keys(INSURANCE_TERMS);
}
