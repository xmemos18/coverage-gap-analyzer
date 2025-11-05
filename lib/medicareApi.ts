/**
 * Medicare Plan Data Helpers
 *
 * NOTE: Unlike Healthcare.gov, Medicare does NOT have a real-time queryable API
 * for plan comparison data. CMS publishes Medicare plan data as downloadable files.
 *
 * See MEDICARE_DATA.md for full explanation and implementation guide.
 *
 * Current Implementation:
 * - Provides structure for future file-based data integration
 * - Returns sample/mock data for demonstration
 * - Links users to Medicare.gov Plan Finder for real searches
 *
 * Future Enhancement:
 * - Download annual landscape files from CMS
 * - Import into local database
 * - Query by ZIP/county for real plan data
 */

// Medicare Plan Types
export type MedicarePlanType = 'HMO' | 'PPO' | 'PFFS' | 'SNP' | 'MSA' | 'Cost';
export type MedigapPlanLetter = 'A' | 'B' | 'C' | 'D' | 'F' | 'G' | 'K' | 'L' | 'M' | 'N';

export interface MedicareAdvantagePlan {
  contractId: string;
  planId: string;
  planName: string;
  organizationName: string;
  planType: MedicarePlanType;
  monthlyPremium: number; // Additional premium beyond Part B
  annualDeductible: number;
  outOfPocketMax: number;
  starRating?: number; // 1-5 stars
  countyName: string;
  countyFips: string;
  state: string;

  // Benefits
  includesPartD: boolean; // Prescription drug coverage
  dentalCoverage: boolean;
  visionCoverage: boolean;
  hearingCoverage: boolean;
  fitnessProgram: boolean;
  overTheCounterBenefit?: number; // Monthly OTC allowance

  // Provider network
  hasNationalNetwork: boolean;
  requiresReferrals: boolean;
}

export interface MedigapPlan {
  planLetter: MedigapPlanLetter;
  carrier: string;
  monthlyPremium: number;
  state: string;

  // Standardized coverage (same for all carriers)
  coversPartADeductible: boolean;
  coversPartBDeductible: boolean;
  coversPartBExcessCharges: boolean;
  foreignTravelCoverage: boolean;
}

export interface PartDPlan {
  contractId: string;
  planId: string;
  planName: string;
  organizationName: string;
  monthlyPremium: number;
  annualDeductible: number;
  starRating?: number;

  // Coverage gap ("donut hole") info
  coverageGapDiscount: number; // Percentage discount in gap

  countyName: string;
  countyFips: string;
  state: string;
}

/**
 * Check if Medicare data is available
 * Currently always returns false until landscape files are imported
 */
export function isMedicareDataAvailable(): boolean {
  // TODO: Check if landscape file data has been imported to database
  return false;
}

/**
 * Search Medicare Advantage plans by ZIP code
 *
 * NOTE: This requires importing CMS landscape files into a database first.
 * See MEDICARE_DATA.md for implementation guide.
 *
 * @param zipCode - 5-digit ZIP code
 * @param includePartD - Filter for plans with prescription drug coverage
 * @returns Array of Medicare Advantage plans (currently returns empty array)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function searchMedicareAdvantagePlans(
  _zipCode: string,
  _options?: {
    includePartD?: boolean;
    planTypes?: MedicarePlanType[];
    minStarRating?: number;
  }
): Promise<MedicareAdvantagePlan[]> {
  // TODO: Implement database query when landscape files are imported

  console.warn(
    'Medicare plan data not available. CMS does not provide a real-time API. ' +
    'See MEDICARE_DATA.md for how to implement file-based plan data.'
  );

  return [];
}

/**
 * Search Medigap plans by ZIP code
 *
 * NOTE: Medigap premiums vary significantly by carrier and are not included
 * in CMS landscape files. Best to direct users to Medicare.gov or state
 * insurance departments for accurate Medigap quotes.
 *
 * @param zipCode - 5-digit ZIP code
 * @param planLetters - Specific Medigap plans to search for (e.g., ['G', 'N'])
 * @returns Array of Medigap plans (currently returns empty array)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function searchMedigapPlans(
  _zipCode: string,
  _planLetters?: MedigapPlanLetter[]
): Promise<MedigapPlan[]> {
  // TODO: Integrate with private carriers or state insurance departments

  console.warn(
    'Medigap plan pricing not available via API. Premiums vary by carrier. ' +
    'Direct users to medicare.gov/medigap-supplemental-insurance-plans'
  );

  return [];
}

/**
 * Search Part D prescription drug plans by ZIP code
 *
 * NOTE: This requires importing monthly Part D files from data.cms.gov
 *
 * @param zipCode - 5-digit ZIP code
 * @returns Array of Part D plans (currently returns empty array)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function searchPartDPlans(
  _zipCode: string,
  _options?: {
    minStarRating?: number;
  }
): Promise<PartDPlan[]> {
  // TODO: Implement database query when Part D files are imported

  console.warn(
    'Part D plan data not available. Requires importing monthly files from data.cms.gov. ' +
    'See MEDICARE_DATA.md for implementation guide.'
  );

  return [];
}

/**
 * Get Medicare Plan Finder URL for a specific ZIP code
 * This is the recommended approach until file-based data is implemented
 *
 * @param zipCode - 5-digit ZIP code
 * @param planType - Type of plan to search for
 * @returns URL to Medicare.gov Plan Finder pre-filled with ZIP code
 */
export function getMedicarePlanFinderUrl(
  zipCode: string,
  planType: 'advantage' | 'partd' | 'medigap' = 'advantage'
): string {
  const baseUrl = 'https://www.medicare.gov/plan-compare';

  // Add ZIP code as query parameter
  const params = new URLSearchParams({
    zip: zipCode,
  });

  // Add plan type filter
  if (planType === 'advantage') {
    params.append('type', 'ma');
  } else if (planType === 'partd') {
    params.append('type', 'pdp');
  }

  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Get estimated Medicare costs (national averages)
 * Use this when real plan data is not available
 */
export function getEstimatedMedicareCosts() {
  return {
    partB: {
      monthlyPremium: 174.70, // 2025 standard premium
      annualDeductible: 257,
    },
    medigapPlanG: {
      monthlyPremium: {
        low: 120,
        high: 350,
      },
      note: 'Varies significantly by state, age, and carrier',
    },
    medigapPlanN: {
      monthlyPremium: {
        low: 80,
        high: 250,
      },
      note: 'Lower premiums than Plan G, with small copays',
    },
    medicareAdvantage: {
      monthlyPremium: {
        low: 0,
        high: 200,
      },
      note: 'Many $0 premium plans available, varies by location',
    },
    partD: {
      monthlyPremium: {
        low: 8,
        high: 150,
      },
      note: 'Varies by formulary and location',
    },
  };
}

/**
 * Get Medicare eligibility information
 */
export function getMedicareEligibilityInfo(age: number) {
  return {
    isEligible: age >= 65,
    enrollmentPeriod: {
      initial: 'Starts 3 months before your 65th birthday',
      annual: 'October 15 - December 7 each year',
      special: 'Available when you lose other coverage',
    },
    parts: {
      partA: {
        name: 'Hospital Insurance',
        cost: 'Usually free if you or spouse worked 10+ years',
      },
      partB: {
        name: 'Medical Insurance',
        cost: '$174.70/month (2025 standard premium)',
      },
      partD: {
        name: 'Prescription Drug Coverage',
        cost: 'Varies by plan ($8-$150/month average)',
      },
    },
    options: {
      originalMedicare: {
        description: 'Part A + Part B + Medigap + Part D',
        pros: ['Works everywhere', 'No networks', 'Predictable costs'],
        cons: ['Multiple premiums', 'Requires coordination'],
      },
      medicareAdvantage: {
        description: 'Part C (replaces Original Medicare)',
        pros: ['Often includes Part D', 'Extra benefits', 'Lower premiums'],
        cons: ['Network restrictions', 'Less flexibility', 'Varies by location'],
      },
    },
  };
}

/**
 * Get Medicare resources and next steps
 */
export function getMedicareResources(zipCode: string) {
  return {
    planFinder: getMedicarePlanFinderUrl(zipCode, 'advantage'),
    medigapFinder: getMedicarePlanFinderUrl(zipCode, 'medigap'),
    partDFinder: getMedicarePlanFinderUrl(zipCode, 'partd'),

    helplines: {
      medicare: '1-800-MEDICARE (1-800-633-4227)',
      ship: {
        name: 'State Health Insurance Assistance Program (SHIP)',
        description: 'Free local counseling',
        link: 'https://www.shiphelp.org/',
      },
    },

    deadlines: {
      initialEnrollment: 'Sign up during 7-month window around 65th birthday',
      annualEnrollment: 'Change plans October 15 - December 7',
      lateEnrollmentPenalty: 'Avoid gaps in coverage to prevent penalties',
    },

    importantLinks: {
      medicareGov: 'https://www.medicare.gov/',
      handbookPdf: 'https://www.medicare.gov/Pubs/pdf/10050-Medicare-and-You.pdf',
      glossary: 'https://www.medicare.gov/glossary',
      preventiveCare: 'https://www.medicare.gov/coverage/preventive-screening-services',
    },
  };
}

/**
 * Download instructions for Medicare landscape files
 * Use this to guide users on how to obtain real plan data
 */
export function getLandscapeFileInstructions() {
  return {
    title: 'How to Get Real Medicare Plan Data',
    steps: [
      {
        step: 1,
        title: 'Download Landscape File',
        description: 'Visit the CMS Medicare Advantage/Part D Contract and Enrollment Data page',
        url: 'https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data',
        action: 'Download the annual Landscape file (CSV format)',
      },
      {
        step: 2,
        title: 'Set Up Database',
        description: 'Import the CSV file into a database (PostgreSQL, MySQL, or SQLite)',
        technicalNote: 'File is ~50-100MB with 100k+ rows',
      },
      {
        step: 3,
        title: 'Create Query Functions',
        description: 'Write SQL queries to filter plans by ZIP code, county FIPS, or plan features',
        example: 'SELECT * FROM plans WHERE county_fips = ... AND plan_year = 2025',
      },
      {
        step: 4,
        title: 'Update Annually',
        description: 'Re-import the landscape file each September during open enrollment preparation',
        schedule: 'CMS releases new files in mid-September each year',
      },
    ],
    dataIncluded: [
      'Plan premiums and deductibles',
      'Out-of-pocket maximums',
      'Star ratings',
      'Covered benefits (dental, vision, hearing)',
      'Service areas (county FIPS codes)',
      'Plan types (HMO, PPO, etc.)',
      'Special Needs Plan (SNP) information',
    ],
    limitations: [
      'Not real-time (updated annually)',
      'Requires manual download and import',
      'Large file size',
      'County-level only (not ZIP code specific)',
    ],
  };
}

const medicareApi = {
  isMedicareDataAvailable,
  searchMedicareAdvantagePlans,
  searchMedigapPlans,
  searchPartDPlans,
  getMedicarePlanFinderUrl,
  getEstimatedMedicareCosts,
  getMedicareEligibilityInfo,
  getMedicareResources,
  getLandscapeFileInstructions,
};

export default medicareApi;
