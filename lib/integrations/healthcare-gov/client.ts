/**
 * Healthcare.gov Marketplace API Client
 * Provides typed access to CMS Marketplace API v1
 */

import type {
  PlanSearchRequest,
  PlanSearchResponse,
  Plan,
  EligibilityRequest,
  EligibilityResponse,
  County,
  CountyResponse,
  State,
  StateResponse,
  MedicaidEligibility,
  PovertyGuideline,
  DrugCoverage,
  ProviderSearchResult,
  ProviderCoverage,
  RateArea,
  Place,
  APIError,
  Household,
  QualityRating,
} from './types';

const BASE_URL = 'https://marketplace.api.healthcare.gov/api/v1';

/**
 * Healthcare.gov API Client Configuration
 */
interface ClientConfig {
  apiKey: string;
  timeout?: number;
}

/**
 * Healthcare.gov Marketplace API Client
 */
export class HealthcareGovClient {
  private apiKey: string;
  private timeout: number;

  constructor(config: ClientConfig) {
    if (!config.apiKey) {
      throw new Error(
        'Healthcare.gov API key is required. Set HEALTHCARE_GOV_API_KEY in your environment variables.\n' +
        'Request an API key at: https://developer.cms.gov/marketplace-api/key-request.html'
      );
    }
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000; // 30 second default timeout
  }

  /**
   * Make an API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(endpoint, BASE_URL);
    url.searchParams.set('apikey', this.apiKey);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: APIError = await response.json().catch(() => ({
          code: 0,
          status: response.status,
          message: response.statusText,
          error: 'Unknown error',
        }));

        throw new Error(
          `Healthcare.gov API Error (${error.status}): ${error.message}`
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Healthcare.gov API request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * PLAN SEARCH & DETAILS
   */

  /**
   * Search for insurance plans
   * @param request - Plan search parameters
   * @returns Array of matching plans with premiums
   */
  async searchPlans(request: PlanSearchRequest): Promise<PlanSearchResponse> {
    return this.request<PlanSearchResponse>('/plans/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get basic plan details without premium calculation
   * @param planId - Plan ID
   * @param year - Plan year (defaults to current)
   */
  async getPlan(planId: string, year?: number): Promise<Plan> {
    const endpoint = `/plans/${planId}${year ? `?year=${year}` : ''}`;
    return this.request<Plan>(endpoint);
  }

  /**
   * Get plan details with household-specific premiums
   * @param planId - Plan ID
   * @param place - Geographic location
   * @param household - Optional household data for premium calculation
   */
  async getPlanWithPremium(
    planId: string,
    place: Place,
    household?: Household
  ): Promise<Plan> {
    return this.request<Plan>(`/plans/${planId}`, {
      method: 'POST',
      body: JSON.stringify({
        place,
        market: 'Individual',
        household,
      }),
    });
  }

  /**
   * Get multiple plans for comparison
   * @param planIds - Array of plan IDs
   * @param place - Geographic location
   */
  async getPlans(planIds: string[], place: Place): Promise<{ plans: Plan[] }> {
    return this.request<{ plans: Plan[] }>('/plans', {
      method: 'POST',
      body: JSON.stringify({
        plan_ids: planIds,
        place,
        market: 'Individual',
      }),
    });
  }

  /**
   * HOUSEHOLD & ELIGIBILITY
   */

  /**
   * Calculate APTC and CSR eligibility
   * @param request - Household eligibility data
   */
  async getEligibilityEstimates(
    request: EligibilityRequest
  ): Promise<EligibilityResponse> {
    return this.request<EligibilityResponse>('/households/eligibility/estimates', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get Second Lowest Cost Silver Plan
   */
  async getSLCSP(place: Place, household: Household): Promise<Plan> {
    return this.request<Plan>('/households/slcsp', {
      method: 'POST',
      body: JSON.stringify({
        place,
        market: 'Individual',
        household,
      }),
    });
  }

  /**
   * Get Lowest Cost Silver Plan
   */
  async getLCSP(place: Place, household: Household): Promise<Plan> {
    return this.request<Plan>('/households/lcsp', {
      method: 'POST',
      body: JSON.stringify({
        place,
        market: 'Individual',
        household,
      }),
    });
  }

  /**
   * Get Lowest Cost Bronze Plan
   */
  async getLCBP(place: Place, household: Household): Promise<Plan> {
    return this.request<Plan>('/households/lcbp', {
      method: 'POST',
      body: JSON.stringify({
        place,
        market: 'Individual',
        household,
      }),
    });
  }

  /**
   * Calculate percentage of Federal Poverty Level
   * @param state - State code
   * @param size - Household size
   * @param income - Annual household income
   */
  async getFPLPercentage(
    state: string,
    size: number,
    income: number
  ): Promise<{ percent: number }> {
    return this.request<{ percent: number }>(
      `/households/pcfpl?state=${state}&size=${size}&income=${income}`
    );
  }

  /**
   * GEOGRAPHIC & REFERENCE DATA
   */

  /**
   * Find counties by ZIP code
   * @param zipcode - 5-digit ZIP code
   */
  async getCountiesByZip(zipcode: string): Promise<CountyResponse> {
    return this.request<CountyResponse>(`/counties/by/zip/${zipcode}`);
  }

  /**
   * Get county details by FIPS code
   * @param fips - 5-digit county FIPS code
   */
  async getCounty(fips: string): Promise<County> {
    return this.request<County>(`/counties/${fips}`);
  }

  /**
   * List all U.S. states
   */
  async getStates(): Promise<StateResponse> {
    return this.request<StateResponse>('/states');
  }

  /**
   * Get specific state details
   * @param state - State abbreviation (2 letters)
   */
  async getState(state: string): Promise<State> {
    return this.request<State>(`/states/${state}`);
  }

  /**
   * Get state Medicaid eligibility data
   * @param state - State abbreviation
   * @param quarter - Optional quarter (1-4)
   */
  async getStateMedicaid(
    state: string,
    quarter?: number
  ): Promise<MedicaidEligibility> {
    const endpoint = `/states/${state}/medicaid${quarter ? `?quarter=${quarter}` : ''}`;
    return this.request<MedicaidEligibility>(endpoint);
  }

  /**
   * Get federal poverty guidelines
   * @param state - State abbreviation
   * @param year - Year
   */
  async getPovertyGuidelines(
    state: string,
    year: number
  ): Promise<PovertyGuideline> {
    return this.request<PovertyGuideline>(
      `/states/${state}/poverty-guidelines?year=${year}`
    );
  }

  /**
   * Determine rate area
   * @param state - State code
   * @param fips - County FIPS
   * @param zipcode - ZIP code
   */
  async getRateArea(
    state: string,
    fips: string,
    zipcode: string
  ): Promise<RateArea> {
    return this.request<RateArea>(
      `/rate-areas?state=${state}&fips=${fips}&zipcode=${zipcode}`
    );
  }

  /**
   * DRUG COVERAGE
   */

  /**
   * Autocomplete drug search
   * @param query - Drug name (minimum 3 characters)
   */
  async autocompleteDrug(query: string): Promise<{ drugs: Array<{ rxcui: string; name: string }> }> {
    if (query.length < 3) {
      throw new Error('Drug query must be at least 3 characters');
    }
    return this.request<{ drugs: Array<{ rxcui: string; name: string }> }>(
      `/drugs/autocomplete?q=${encodeURIComponent(query)}`
    );
  }

  /**
   * Search drugs
   * @param query - Drug name
   * @param limit - Results limit
   * @param offset - Results offset
   */
  async searchDrugs(
    query: string,
    limit = 10,
    offset = 0
  ): Promise<{ drugs: Array<{ rxcui: string; name: string }> }> {
    return this.request<{ drugs: Array<{ rxcui: string; name: string }> }>(
      `/drugs/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Check drug coverage by plan
   * @param drugs - Array of RxCUI identifiers
   * @param planIds - Array of plan IDs
   */
  async getDrugCoverage(drugs: string[], planIds: string[]): Promise<DrugCoverage[]> {
    const drugsParam = drugs.map(d => `drugs=${d}`).join('&');
    const plansParam = planIds.map(p => `planids=${p}`).join('&');
    return this.request<DrugCoverage[]>(`/drugs/covered?${drugsParam}&${plansParam}`);
  }

  /**
   * PROVIDER COVERAGE
   */

  /**
   * Search providers by location
   * @param query - Provider name
   * @param zipcode - ZIP code
   * @param type - Provider type (Individual/Facility)
   */
  async searchProviders(
    query: string,
    zipcode: string,
    type: 'Individual' | 'Facility' = 'Individual'
  ): Promise<{ providers: ProviderSearchResult[] }> {
    return this.request<{ providers: ProviderSearchResult[] }>(
      `/providers/search?q=${encodeURIComponent(query)}&zipcode=${zipcode}&type=${type}`
    );
  }

  /**
   * Autocomplete provider search
   * @param query - Provider name (minimum 3 characters)
   */
  async autocompleteProvider(query: string): Promise<{ providers: ProviderSearchResult[] }> {
    if (query.length < 3) {
      throw new Error('Provider query must be at least 3 characters');
    }
    return this.request<{ providers: ProviderSearchResult[] }>(
      `/providers/autocomplete?q=${encodeURIComponent(query)}`
    );
  }

  /**
   * Check provider coverage
   * @param providerIds - Array of NPI identifiers
   * @param planIds - Array of plan IDs
   */
  async getProviderCoverage(
    providerIds: string[],
    planIds: string[]
  ): Promise<ProviderCoverage[]> {
    const providersParam = providerIds.map(p => `providerids=${p}`).join('&');
    const plansParam = planIds.map(p => `planids=${p}`).join('&');
    return this.request<ProviderCoverage[]>(
      `/providers/covered?${providersParam}&${plansParam}`
    );
  }

  /**
   * QUALITY RATINGS
   */

  /**
   * Get plan quality ratings
   * @param planId - Plan ID
   * @param year - Year
   */
  async getQualityRatings(
    planId: string,
    year: number
  ): Promise<{ quality_rating: QualityRating }> {
    return this.request<{ quality_rating: QualityRating }>(
      `/plans/${planId}/quality-ratings?year=${year}`
    );
  }

  /**
   * ISSUERS
   */

  /**
   * List insurance issuers
   * @param state - Optional state filter
   * @param limit - Results limit
   * @param offset - Results offset
   */
  async getIssuers(
    state?: string,
    limit = 50,
    offset = 0
  ): Promise<{ issuers: Array<{ id: string; name: string; state: string }> }> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (state) params.set('state', state);
    return this.request<{ issuers: Array<{ id: string; name: string; state: string }> }>(`/issuers?${params.toString()}`);
  }

  /**
   * Get specific issuer details
   * @param issuerId - Issuer ID
   */
  async getIssuer(issuerId: string): Promise<{ id: string; name: string; state: string; url?: string; toll_free?: string }> {
    return this.request<{ id: string; name: string; state: string; url?: string; toll_free?: string }>(`/issuers/${issuerId}`);
  }
}

/**
 * Create a Healthcare.gov API client instance
 */
export function createHealthcareGovClient(apiKey?: string): HealthcareGovClient {
  const key = apiKey || process.env.HEALTHCARE_GOV_API_KEY;

  if (!key) {
    throw new Error(
      'Healthcare.gov API key not provided. ' +
      'Pass as parameter or set HEALTHCARE_GOV_API_KEY environment variable.\n' +
      'Request an API key at: https://developer.cms.gov/marketplace-api/key-request.html'
    );
  }

  return new HealthcareGovClient({ apiKey: key });
}
