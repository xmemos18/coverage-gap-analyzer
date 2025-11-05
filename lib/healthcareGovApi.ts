/**
 * Healthcare.gov Marketplace API Integration
 *
 * API Documentation: https://developer.cms.gov/marketplace-api/
 * API Key Required: Request at https://developer.cms.gov/marketplace-api/key-request.html
 *
 * To use this API:
 * 1. Request an API key from CMS
 * 2. Add to .env.local: NEXT_PUBLIC_HEALTHCARE_GOV_API_KEY=your_key_here
 * 3. Restart development server
 */

const API_BASE_URL = 'https://marketplace.api.healthcare.gov/api/v1';
const API_KEY = process.env.NEXT_PUBLIC_HEALTHCARE_GOV_API_KEY;

export interface County {
  fips: string;
  name: string;
  state: string;
}

export interface MarketplacePlan {
  id: string;
  name: string;
  issuer: {
    name: string;
    id: string;
  };
  type: string; // HMO, PPO, EPO, POS
  metal_level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Catastrophic';
  premium: number; // Monthly premium
  deductibles: Array<{
    amount: number;
    family_cost: string;
    individual: {
      amount: number;
      display_string: string;
    };
  }>;
  moops: Array<{
    amount: number;
    family_cost: string;
    individual: {
      amount: number;
      display_string: string;
    };
  }>;
  benefits: Array<{
    name: string;
    covered: boolean;
    cost_sharings: Array<{
      coinsurance_rate: number;
      copay_amount: number;
      display_string: string;
    }>;
  }>;
  quality_rating: {
    available: boolean;
    year: number;
    global_rating: number;
    global_not_rated_reason: string | null;
  };
  premium_w_credit?: number; // Premium after tax credit (if eligible)
  has_national_network: boolean;
  disease_mgmt_programs: string[];
}

export interface PlanSearchParams {
  zipcode: string;
  state?: string; // Will be auto-detected if not provided
  year?: number; // Defaults to current year
  household?: {
    income: number;
    people: Array<{
      age?: number;
      dob?: string; // YYYY-MM-DD
      aptc_eligible: boolean;
      gender?: 'Male' | 'Female';
      uses_tobacco: boolean;
    }>;
  };
  market?: 'Individual' | 'SHOP' | 'Any';
  filter?: {
    metal_levels?: Array<'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Catastrophic'>;
    type?: Array<'HMO' | 'PPO' | 'EPO' | 'POS'>;
    premium?: { min?: number; max?: number };
    deductible?: { min?: number; max?: number };
    issuer_ids?: string[];
  };
  limit?: number; // Max 100
  offset?: number;
}

export interface PlanSearchResponse {
  plans: MarketplacePlan[];
  total: number;
  facets: {
    metal_levels: Array<{ name: string; count: number }>;
    types: Array<{ name: string; count: number }>;
    issuers: Array<{ name: string; id: string; count: number }>;
  };
  ranges: {
    premium: { min: number; max: number };
    deductible: { min: number; max: number };
  };
}

/**
 * Check if Healthcare.gov API is configured
 */
export function isHealthcareGovApiAvailable(): boolean {
  return !!API_KEY;
}

/**
 * Get county FIPS code from ZIP code
 * Required for plan searches
 */
export async function getCountyByZip(zipcode: string): Promise<County[] | null> {
  if (!API_KEY) {
    console.warn('Healthcare.gov API key not configured');
    return null;
  }

  if (!zipcode || !/^\d{5}$/.test(zipcode)) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/counties/by/zip/${zipcode}?apikey=${API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // ZIP not found
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.counties || [];
  } catch (error) {
    console.error('County lookup error:', error);
    return null;
  }
}

/**
 * Search for marketplace health insurance plans
 *
 * @param params - Search parameters including ZIP, household info, filters
 * @returns Array of matching plans with pricing and coverage details
 */
export async function searchMarketplacePlans(
  params: PlanSearchParams
): Promise<PlanSearchResponse | null> {
  if (!API_KEY) {
    console.warn('Healthcare.gov API key not configured. Request one at: https://developer.cms.gov/marketplace-api/key-request.html');
    return null;
  }

  try {
    // Step 1: Get county FIPS code for the ZIP
    const counties = await getCountyByZip(params.zipcode);
    if (!counties || counties.length === 0) {
      console.error('No counties found for ZIP code:', params.zipcode);
      return null;
    }

    // Use first county if multiple (rare)
    const county = counties[0];

    // Step 2: Build request body
    interface RequestBody {
      place: {
        countyfips: string;
        state: string;
        zipcode: string;
      };
      market: string;
      year: number;
      household?: typeof params.household;
      filter?: typeof params.filter;
      limit?: number;
      offset?: number;
    }

    const requestBody: RequestBody = {
      place: {
        countyfips: county.fips,
        state: params.state || county.state,
        zipcode: params.zipcode,
      },
      market: params.market || 'Individual',
      year: params.year || new Date().getFullYear(),
    };

    // Add household data if provided
    if (params.household) {
      requestBody.household = params.household;
    }

    // Add filters if provided
    if (params.filter) {
      requestBody.filter = params.filter;
    }

    // Add pagination
    if (params.limit) {
      requestBody.limit = Math.min(params.limit, 100);
    }
    if (params.offset) {
      requestBody.offset = params.offset;
    }

    // Step 3: Search for plans
    const response = await fetch(
      `${API_BASE_URL}/plans/search?apikey=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform response into our format
    return {
      plans: data.plans || [],
      total: data.total || 0,
      facets: {
        metal_levels: data.facets?.metal_levels || [],
        types: data.facets?.type || [],
        issuers: data.facets?.issuers || [],
      },
      ranges: {
        premium: data.ranges?.premium || { min: 0, max: 0 },
        deductible: data.ranges?.deductible || { min: 0, max: 0 },
      },
    };
  } catch (error) {
    console.error('Plan search error:', error);
    return null;
  }
}

/**
 * Get detailed information for a specific plan
 */
export async function getPlanDetails(planId: string, year?: number): Promise<MarketplacePlan | null> {
  if (!API_KEY) {
    console.warn('Healthcare.gov API key not configured');
    return null;
  }

  try {
    const yearParam = year || new Date().getFullYear();
    const response = await fetch(
      `${API_BASE_URL}/plans/${planId}?year=${yearParam}&apikey=${API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Plan details error:', error);
    return null;
  }
}

/**
 * Calculate subsidy eligibility estimates
 * Premium Tax Credit (APTC) and Cost-Sharing Reductions (CSR)
 */
export async function calculateSubsidyEstimates(
  zipcode: string,
  household: {
    income: number;
    people: Array<{
      age?: number;
      dob?: string;
      aptc_eligible: boolean;
      uses_tobacco: boolean;
    }>;
  },
  year?: number
): Promise<{
  aptc: number; // Advanced Premium Tax Credit (monthly)
  csr: string; // Cost-Sharing Reduction level
  is_medicaid_chip: boolean;
} | null> {
  if (!API_KEY) {
    console.warn('Healthcare.gov API key not configured');
    return null;
  }

  try {
    // Get county for ZIP
    const counties = await getCountyByZip(zipcode);
    if (!counties || counties.length === 0) {
      return null;
    }

    const county = counties[0];

    const response = await fetch(
      `${API_BASE_URL}/households/eligibility/estimates?apikey=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          place: {
            countyfips: county.fips,
            state: county.state,
            zipcode: zipcode,
          },
          household: household,
          market: 'Individual',
          year: year || new Date().getFullYear(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      aptc: data.aptc || 0,
      csr: data.csr || 'None',
      is_medicaid_chip: data.is_medicaid_chip || false,
    };
  } catch (error) {
    console.error('Subsidy calculation error:', error);
    return null;
  }
}

/**
 * Get recommended plans based on user profile
 * Returns top 3 plans sorted by value (quality vs cost)
 */
export async function getRecommendedPlans(
  params: PlanSearchParams
): Promise<MarketplacePlan[]> {
  const results = await searchMarketplacePlans({
    ...params,
    limit: 20, // Get more plans to filter from
  });

  if (!results || results.plans.length === 0) {
    return [];
  }

  // Sort by value score (quality rating / premium)
  const scoredPlans = results.plans
    .filter(plan => plan.quality_rating.available)
    .map(plan => ({
      plan,
      score: (plan.quality_rating.global_rating || 3) / (plan.premium || 1),
    }))
    .sort((a, b) => b.score - a.score);

  // Return top 3 best value plans
  return scoredPlans.slice(0, 3).map(item => item.plan);
}

/**
 * Format plan premium for display
 */
export function formatPlanPremium(plan: MarketplacePlan): string {
  if (plan.premium_w_credit !== undefined && plan.premium_w_credit < plan.premium) {
    return `$${plan.premium_w_credit.toFixed(2)}/mo (After Credit)`;
  }
  return `$${plan.premium.toFixed(2)}/mo`;
}

/**
 * Get plan type display name
 */
export function getPlanTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    HMO: 'Health Maintenance Organization - Lower costs, network restrictions',
    PPO: 'Preferred Provider Organization - More flexibility, higher costs',
    EPO: 'Exclusive Provider Organization - Network required, no referrals needed',
    POS: 'Point of Service - Hybrid HMO/PPO with referrals',
  };
  return descriptions[type] || type;
}
