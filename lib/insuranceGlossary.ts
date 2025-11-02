/**
 * Insurance Glossary
 * Plain English definitions and explanations of insurance terms
 */

export interface GlossaryTerm {
  term: string;
  shortDefinition: string;
  longDefinition: string;
  analogy?: string;
  example?: string;
}

export const INSURANCE_GLOSSARY: Record<string, GlossaryTerm> = {
  premium: {
    term: 'Premium',
    shortDefinition: 'Your monthly insurance payment',
    longDefinition: 'The amount you pay every month to keep your insurance active, whether you use it or not.',
    analogy: 'Like a monthly membership fee for a gym - you pay it even if you never go.',
    example: 'If your premium is $400/month, you pay $4,800 per year just to have insurance.',
  },

  deductible: {
    term: 'Deductible',
    shortDefinition: 'What you pay before insurance kicks in',
    longDefinition: 'The amount you must pay out of pocket each year before your insurance starts covering most costs.',
    analogy: 'Like a threshold - once you cross it by paying this amount, insurance starts helping more.',
    example: 'With a $2,000 deductible, you pay the first $2,000 of medical bills each year, then insurance covers most costs after that.',
  },

  copay: {
    term: 'Copay',
    shortDefinition: 'Fixed fee per doctor visit or prescription',
    longDefinition: 'A fixed amount you pay for specific services, like doctor visits or prescriptions. Usually a small, predictable cost.',
    example: '$25 copay for primary care doctor, $50 copay for specialists, $10 copay for generic prescriptions.',
  },

  coinsurance: {
    term: 'Coinsurance',
    shortDefinition: 'Your share of costs after deductible',
    longDefinition: 'The percentage you pay for covered services after meeting your deductible. Your insurance pays the rest.',
    analogy: 'Like splitting a restaurant bill - you pay your percentage, insurance pays theirs.',
    example: 'With 20% coinsurance, if a procedure costs $1,000, you pay $200 and insurance pays $800 (after deductible is met).',
  },

  outOfPocketMax: {
    term: 'Out-of-Pocket Maximum',
    shortDefinition: 'The most you\'ll pay in a year',
    longDefinition: 'The maximum amount you\'ll pay for covered services in a year. Once you hit this limit, insurance pays 100% of covered costs.',
    analogy: 'Your annual safety net - insurance protects you from unlimited expenses.',
    example: 'With a $8,000 out-of-pocket max, once you\'ve paid $8,000 in deductibles, copays, and coinsurance, insurance covers everything else that year.',
  },

  ppo: {
    term: 'PPO (Preferred Provider Organization)',
    shortDefinition: 'Flexible plan - see any doctor, no referrals needed',
    longDefinition: 'A health plan that gives you freedom to see any doctor or specialist without referrals. Lower costs with in-network providers, but you can go out-of-network too.',
    analogy: 'Like having a membership that works everywhere, but you get discounts at preferred locations.',
    example: 'You can see a specialist directly without seeing your primary doctor first. Works great if you travel between states.',
  },

  hmo: {
    term: 'HMO (Health Maintenance Organization)',
    shortDefinition: 'Lower cost, but you need referrals',
    longDefinition: 'A health plan with lower premiums but more restrictions. You must choose a primary care doctor and get referrals to see specialists. Usually only covers in-network care.',
    analogy: 'Like a club with house rules - follow the process, get lower prices.',
    example: 'Want to see a dermatologist? First see your primary doctor for a referral. Emergency care is always covered.',
  },

  epo: {
    term: 'EPO (Exclusive Provider Organization)',
    shortDefinition: 'Like HMO but no referrals needed',
    longDefinition: 'A health plan that only covers in-network care (except emergencies) but doesn\'t require referrals to see specialists.',
    example: 'You can see specialists directly, but they must be in your network or you pay full price.',
  },

  pos: {
    term: 'POS (Point of Service)',
    shortDefinition: 'Hybrid of HMO and PPO',
    longDefinition: 'A health plan that combines features of HMO and PPO. Need a primary doctor and referrals, but can go out-of-network for higher costs.',
    example: 'Like HMO for in-network care (need referrals), but you can go out-of-network if needed (costs more).',
  },

  medicarePartA: {
    term: 'Medicare Part A',
    shortDefinition: 'Hospital insurance',
    longDefinition: 'Covers inpatient hospital stays, skilled nursing facility care, hospice, and some home health care. Usually premium-free if you worked 40+ quarters.',
    example: 'Covers your hospital room, meals, and nursing care when admitted to the hospital.',
  },

  medicarePartB: {
    term: 'Medicare Part B',
    shortDefinition: 'Medical insurance (doctors and outpatient)',
    longDefinition: 'Covers doctor visits, outpatient care, medical equipment, preventive services. Has a monthly premium (2024: $174.70 for most people).',
    example: 'Covers your annual checkup, X-rays, lab tests, wheelchairs, and doctor appointments.',
  },

  medicarePartC: {
    term: 'Medicare Part C (Medicare Advantage)',
    shortDefinition: 'All-in-one Medicare alternative from private companies',
    longDefinition: 'Private insurance that replaces Original Medicare (Parts A & B) and usually includes Part D. Often includes extra benefits like dental and vision.',
    analogy: 'Like trading in Original Medicare for a bundled package deal.',
    example: 'One plan that covers everything - hospital, doctors, prescriptions, sometimes dental/vision. May have network restrictions.',
  },

  medicarePartD: {
    term: 'Medicare Part D',
    shortDefinition: 'Prescription drug coverage',
    longDefinition: 'Covers prescription medications. Sold by private companies, approved by Medicare. Each plan has its own formulary (list of covered drugs).',
    example: 'Monthly premium averages $30-50. Covers your prescription drugs with copays varying by drug tier.',
  },

  medigap: {
    term: 'Medigap (Medicare Supplement)',
    shortDefinition: 'Fills gaps in Original Medicare',
    longDefinition: 'Private insurance that covers costs Original Medicare doesn\'t pay, like deductibles, copays, and coinsurance. Standardized plans (A, B, C, D, F, G, K, L, M, N). Works anywhere Medicare is accepted.',
    analogy: 'Like adding comprehensive coverage to basic auto insurance - fills the gaps.',
    example: 'Plan G covers almost everything Original Medicare doesn\'t: deductibles, copays, foreign travel emergencies. Works with any doctor who accepts Medicare.',
  },

  medicareAdvantage: {
    term: 'Medicare Advantage',
    shortDefinition: 'Private alternative to Original Medicare',
    longDefinition: 'Replaces Original Medicare with a private plan (HMO, PPO, or PFFS). Includes Parts A, B, and usually D. May have network restrictions but often includes extras.',
    example: 'UnitedHealthcare Medicare Advantage PPO with $0 premium, includes drug coverage, dental, vision, gym membership. But must use network providers.',
  },

  hsa: {
    term: 'HSA (Health Savings Account)',
    shortDefinition: 'Tax-advantaged savings for medical costs',
    longDefinition: 'A savings account for medical expenses that you can only have with a high-deductible health plan. Contributions are tax-deductible, growth is tax-free, and withdrawals for medical costs are tax-free.',
    analogy: 'A triple tax-advantaged piggy bank for healthcare - money goes in tax-free, grows tax-free, comes out tax-free for medical costs.',
    example: 'Contribute $4,150/year (2024 individual limit). Pay no taxes on that money. Use it for deductibles, prescriptions, glasses, dental. Money rolls over every year - you never lose it.',
  },

  fsa: {
    term: 'FSA (Flexible Spending Account)',
    shortDefinition: 'Employer-offered pre-tax account for medical costs',
    longDefinition: 'Pre-tax money set aside for healthcare expenses. Must use by year-end (some allow small rollover or grace period). Offered through employers.',
    example: 'Set aside $2,850/year pre-tax. Use it for copays, prescriptions, glasses. "Use it or lose it" by Dec 31 (or grace period).',
  },

  network: {
    term: 'Network',
    shortDefinition: 'Doctors and hospitals that accept your insurance',
    longDefinition: 'The group of doctors, hospitals, and other healthcare providers that have contracted with your insurance company to provide care at negotiated rates.',
    analogy: 'Like a club membership - these providers agreed to give discounts to insurance members.',
    example: 'UnitedHealthcare\'s network includes 1.3 million providers nationwide. If your doctor is "in-network," your costs are lower.',
  },

  inNetwork: {
    term: 'In-Network',
    shortDefinition: 'Providers that accept your insurance',
    longDefinition: 'Healthcare providers who have contracts with your insurance company. You pay less when using in-network providers.',
    example: 'In-network specialist visit: $50 copay. Same visit out-of-network: $300+ (you pay the difference).',
  },

  outOfNetwork: {
    term: 'Out-of-Network',
    shortDefinition: 'Providers outside your insurance network',
    longDefinition: 'Healthcare providers who haven\'t contracted with your insurance. You typically pay much more, and costs may not count toward your deductible or out-of-pocket max.',
    example: 'Emergency room visit in-network: $500 (counts toward max). Out-of-network: $3,000 (might not count toward max).',
  },

  formulary: {
    term: 'Formulary',
    shortDefinition: 'List of drugs your plan covers',
    longDefinition: 'The list of prescription medications covered by your insurance plan, organized into tiers. Each tier has different copay amounts.',
    example: 'Tier 1 (generic): $10 copay. Tier 2 (preferred brand): $40. Tier 3 (non-preferred brand): $80. Tier 4 (specialty): $200+',
  },

  priorAuthorization: {
    term: 'Prior Authorization',
    shortDefinition: 'Approval needed before insurance covers something',
    longDefinition: 'Insurance company must approve certain services, medications, or procedures before they\'ll cover the cost. Your doctor requests this approval.',
    analogy: 'Like getting permission from your boss before making a large purchase.',
    example: 'MRI needs prior authorization. Doctor submits request, insurance reviews medical necessity, approves or denies within 2-5 days.',
  },

  hdhp: {
    term: 'HDHP (High-Deductible Health Plan)',
    shortDefinition: 'Low premiums, high deductible',
    longDefinition: 'A health plan with lower monthly premiums but higher deductibles ($1,600+ individual, $3,200+ family for 2024). Required to open an HSA.',
    example: 'Premium: $200/month (low), Deductible: $3,000 (high). Good if you\'re healthy and want to save with an HSA.',
  },

  networkProvider: {
    term: 'Network Provider',
    shortDefinition: 'Doctor or hospital in your plan\'s network',
    longDefinition: 'A healthcare provider that has agreed to provide services at pre-negotiated rates for your insurance plan\'s members.',
    example: 'Finding a network provider: Use your insurance company\'s online directory or call the number on your card.',
  },

  openEnrollment: {
    term: 'Open Enrollment',
    shortDefinition: 'Annual period to enroll or change plans',
    longDefinition: 'The yearly period when you can sign up for health insurance or change your plan. For Medicare: Oct 15 - Dec 7. For ACA Marketplace: Nov 1 - Jan 15.',
    example: 'Miss open enrollment? You\'ll need a qualifying life event (marriage, birth, job loss) for a Special Enrollment Period.',
  },

  specialEnrollment: {
    term: 'Special Enrollment Period',
    shortDefinition: 'Enroll outside open enrollment with qualifying event',
    longDefinition: 'A time when you can sign up for insurance outside the annual open enrollment if you have a qualifying life event.',
    example: 'Qualifying events: Marriage, having a baby, losing other coverage, moving to a new state. Usually have 60 days to enroll.',
  },
};

/**
 * Get glossary term by key
 */
export function getGlossaryTerm(key: string): GlossaryTerm | undefined {
  return INSURANCE_GLOSSARY[key];
}

/**
 * Search glossary by term name
 */
export function searchGlossary(searchTerm: string): GlossaryTerm[] {
  const lowerSearch = searchTerm.toLowerCase();
  return Object.values(INSURANCE_GLOSSARY).filter(term =>
    term.term.toLowerCase().includes(lowerSearch) ||
    term.shortDefinition.toLowerCase().includes(lowerSearch)
  );
}

/**
 * Get all glossary terms
 */
export function getAllGlossaryTerms(): GlossaryTerm[] {
  return Object.values(INSURANCE_GLOSSARY);
}
