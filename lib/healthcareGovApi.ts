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

import { logger } from './logger';

const API_BASE_URL = 'https://marketplace.api.healthcare.gov/api/v1';
const API_KEY = process.env.NEXT_PUBLIC_HEALTHCARE_GOV_API_KEY;
const API_TIMEOUT_MS = 10000; // 10 second timeout
const MAX_RETRIES = 2; // Retry failed requests up to 2 times
const RETRY_DELAY_MS = 1000; // Wait 1 second between retries

// Simple in-memory cache for county lookups (expires after 1 hour)
const countyCache = new Map<string, { data: County[]; timestamp: number }>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

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
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Retry logic for API calls
 */
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on 4xx errors (client errors)
      if (lastError.message.includes('API error: 4')) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        logger.warn(`API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('API call failed after retries');
}

/**
 * Validate API response structure
 */
function validateCountyResponse(data: unknown): data is { counties: County[] } {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const response = data as { counties?: unknown };

  if (!Array.isArray(response.counties)) {
    return false;
  }

  // Validate first county structure (if exists)
  if (response.counties.length > 0) {
    const county = response.counties[0];
    if (!county || typeof county !== 'object') {
      return false;
    }

    const c = county as County;
    if (typeof c.fips !== 'string' || typeof c.name !== 'string' || typeof c.state !== 'string') {
      return false;
    }
  }

  return true;
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
 * Results are cached for 1 hour to reduce API calls
 */
export async function getCountyByZip(zipcode: string): Promise<County[] | null> {
  if (!API_KEY) {
    logger.warn('Healthcare.gov API key not configured');
    return null;
  }

  if (!zipcode || !/^\d{5}$/.test(zipcode)) {
    logger.warn('Invalid ZIP code format', { zipcode });
    return null;
  }

  // Check cache first
  const cached = countyCache.get(zipcode);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    logger.info('County lookup cache hit', { zipcode });
    return cached.data;
  }

  try {
    const response = await fetchWithRetry(async () => {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/counties/by/zip/${zipcode}?apikey=${API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!res.ok) {
        if (res.status === 404) {
          logger.info('ZIP code not found in Healthcare.gov API', { zipcode });
          return null;
        }
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res;
    });

    if (!response) {
      return null;
    }

    const data: unknown = await response.json();

    // Validate response structure
    if (!validateCountyResponse(data)) {
      logger.error('Invalid API response structure for county lookup', { zipcode });
      return null;
    }

    const counties = data.counties || [];

    // Cache the result
    countyCache.set(zipcode, { data: counties, timestamp: Date.now() });

    return counties;
  } catch (error) {
    logger.error('County lookup error', { zipcode, error });
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
    logger.warn('Healthcare.gov API key not configured. Request one at: https://developer.cms.gov/marketplace-api/key-request.html');
    return null;
  }

  try {
    // Step 1: Get county FIPS code for the ZIP
    const counties = await getCountyByZip(params.zipcode);
    if (!counties || counties.length === 0) {
      logger.error('No counties found for ZIP code', { zipcode: params.zipcode });
      return null;
    }

    // Use first county if multiple (rare)
    const county = counties[0];

    if (!county?.fips || !county?.state) {
      logger.error('Invalid county data', { county });
      return null;
    }

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

    // Step 3: Search for plans with retry logic
    const response = await fetchWithRetry(async () => {
      const res = await fetchWithTimeout(
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

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res;
    });

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
 */
export async function getPlanDetails(planId: string, year?: number): Promise<MarketplacePlan | null> {
  if (!API_KEY) {
    logger.warn('Healthcare.gov API key not configured');
    return null;
  }

  if (!planId) {
    logger.warn('Plan ID is required for plan details lookup');
    return null;
  }

  try {
    const yearParam = year || new Date().getFullYear();

    const response = await fetchWithRetry(async () => {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/plans/${planId}?year=${yearParam}&apikey=${API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!res.ok) {
        if (res.status === 404) {
          logger.info('Plan not found', { planId, year: yearParam });
          return null;
        }
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res;
    });

    if (!response) {
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
    logger.warn('Healthcare.gov API key not configured');
    return null;
  }

  try {
    // Get county for ZIP
    const counties = await getCountyByZip(zipcode);
    if (!counties || counties.length === 0) {
      logger.error('No counties found for subsidy calculation', { zipcode });
      return null;
    }

    const county = counties[0];

    if (!county?.fips || !county?.state) {
      logger.error('Invalid county data for subsidy calculation', { county });
      return null;
    }

    const response = await fetchWithRetry(async () => {
      const res = await fetchWithTimeout(
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

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res;
    });

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
      score: (plan.quality_rating.global_rating || 3) / plan.premium,
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
