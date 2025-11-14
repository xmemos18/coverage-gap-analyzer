/**
 * Healthcare.gov Marketplace API Integration
 *
 * API Documentation: https://developer.cms.gov/marketplace-api/
 * API Key Required: Request at https://developer.cms.gov/marketplace-api/key-request.html
 *
 * To use this API:
 * 1. Request an API key from CMS
 * 2. Add to .env.local: HEALTHCARE_GOV_API_KEY=your_key_here (server-side only)
 * 3. Restart development server
 *
 * NOTE: This client-side module now uses server-side API routes to protect the API key.
 * The API key is never exposed to the client.
 */

import { logger } from './logger';

// Client-side API calls now go through our Next.js API routes
const API_BASE_URL = '/api';

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
 * This is now always true since we use server-side API routes
 */
export function isHealthcareGovApiAvailable(): boolean {
  return true; // Server-side API routes handle availability
}

/**
 * Get county FIPS code from ZIP code
 * Required for plan searches
 * Now uses server-side API route to protect API key
 */
export async function getCountyByZip(zipcode: string): Promise<County[] | null> {
  if (!zipcode || !/^\d{5}$/.test(zipcode)) {
    logger.warn('Invalid ZIP code format', { zipcode });
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/counties/${zipcode}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.info('ZIP code not found', { zipcode });
        return null;
      }
      logger.error('County lookup failed', { zipcode, status: response.status });
      return null;
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      logger.error('Invalid API response structure for county lookup', { zipcode });
      return null;
    }

    const countyResponse = data as { counties?: County[] };
    return countyResponse.counties || [];
  } catch (error) {
    logger.error('County lookup error', { zipcode, error });
    return null;
  }
}

/**
 * Search for marketplace health insurance plans
 * Now uses server-side API route to protect API key
 *
 * @param params - Search parameters including ZIP, household info, filters
 * @returns Array of matching plans with pricing and coverage details
 */
export async function searchMarketplacePlans(
  params: PlanSearchParams
): Promise<PlanSearchResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/marketplace-plans/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      logger.error('Plan search failed', { status: response.status });
      return null;
    }

    const data: unknown = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      logger.error('Invalid API response structure for plan search');
      return null;
    }

    const apiResponse = data as {
      plans?: unknown[];
      total?: number;
      facets?: {
        metal_levels?: Array<{ name: string; count: number }>;
        type?: Array<{ name: string; count: number }>;
        issuers?: Array<{ name: string; id: string; count: number }>;
      };
      ranges?: {
        premium?: { min: number; max: number };
        deductible?: { min: number; max: number };
      };
    };

    // Transform response into our format with safe defaults
    return {
      plans: Array.isArray(apiResponse.plans) ? apiResponse.plans as MarketplacePlan[] : [],
      total: typeof apiResponse.total === 'number' ? apiResponse.total : 0,
      facets: {
        metal_levels: Array.isArray(apiResponse.facets?.metal_levels) ? apiResponse.facets.metal_levels : [],
        types: Array.isArray(apiResponse.facets?.type) ? apiResponse.facets.type : [],
        issuers: Array.isArray(apiResponse.facets?.issuers) ? apiResponse.facets.issuers : [],
      },
      ranges: {
        premium: apiResponse.ranges?.premium || { min: 0, max: 0 },
        deductible: apiResponse.ranges?.deductible || { min: 0, max: 0 },
      },
    };
  } catch (error) {
    logger.error('Plan search error', { params, error });
    return null;
  }
}

/**
 * Get detailed information for a specific plan
 * Now uses server-side API route to protect API key
 */
export async function getPlanDetails(planId: string, year?: number): Promise<MarketplacePlan | null> {
  if (!planId) {
    logger.warn('Plan ID is required for plan details lookup');
    return null;
  }

  try {
    const yearParam = year || new Date().getFullYear();

    const response = await fetch(
      `${API_BASE_URL}/marketplace-plans/details?planId=${planId}&year=${yearParam}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.info('Plan not found', { planId, year: yearParam });
        return null;
      }
      logger.error('Plan details lookup failed', { planId, status: response.status });
      return null;
    }

    const data: unknown = await response.json();

    // Basic validation
    if (!data || typeof data !== 'object') {
      logger.error('Invalid API response structure for plan details', { planId });
      return null;
    }

    return data as MarketplacePlan;
  } catch (error) {
    logger.error('Plan details error', { planId, year, error });
    return null;
  }
}

/**
 * Calculate subsidy eligibility estimates
 * Premium Tax Credit (APTC) and Cost-Sharing Reductions (CSR)
 * Now uses server-side API route to protect API key
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
  try {
    const response = await fetch(`${API_BASE_URL}/subsidies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        zipcode,
        household,
        year: year || new Date().getFullYear(),
      }),
    });

    if (!response.ok) {
      logger.error('Subsidy calculation failed', { zipcode, status: response.status });
      return null;
    }

    const data: unknown = await response.json();

    // Validate response
    if (!data || typeof data !== 'object') {
      logger.error('Invalid API response structure for subsidy estimates', { zipcode });
      return null;
    }

    const subsidyData = data as {
      aptc?: number;
      csr?: string;
      is_medicaid_chip?: boolean;
    };

    return {
      aptc: typeof subsidyData.aptc === 'number' ? subsidyData.aptc : 0,
      csr: typeof subsidyData.csr === 'string' ? subsidyData.csr : 'None',
      is_medicaid_chip: Boolean(subsidyData.is_medicaid_chip),
    };
  } catch (error) {
    logger.error('Subsidy calculation error', { zipcode, error });
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

  if (!results || !Array.isArray(results.plans) || results.plans.length === 0) {
    return [];
  }

  // Sort by value score (quality rating / premium)
  const scoredPlans = results.plans
    .filter(plan => plan?.quality_rating?.available && plan.premium > 0)
    .map(plan => ({
      plan,
      score: plan.premium > 0 ? (plan.quality_rating.global_rating || 3) / plan.premium : 0,
    }))
    .sort((a, b) => b.score - a.score);

  // Return top 3 best value plans
  return scoredPlans.slice(0, 3).map(item => item.plan);
}

/**
 * Format plan premium for display
 */
export function formatPlanPremium(plan: MarketplacePlan): string {
  if (!plan || typeof plan.premium !== 'number') {
    return 'N/A';
  }

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
