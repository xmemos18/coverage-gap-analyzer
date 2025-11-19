/**
 * SLCSP (Second Lowest Cost Silver Plan) Lookup Utility
 *
 * Uses Healthcare.gov API to get real SLCSP benchmark premiums for accurate
 * subsidy calculations. Falls back to estimates if API is unavailable.
 */

import { createHealthcareGovClient } from '@/lib/integrations/healthcare-gov/client';
import type { Place, Household } from '@/lib/integrations/healthcare-gov/types';
import { logger } from '@/lib/logger';

// Cache for SLCSP lookups to avoid hitting rate limits
const slcspCache = new Map<string, { premium: number; timestamp: number; source: 'api' | 'estimate' }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fallback estimate: $500/month per person
const FALLBACK_PREMIUM_PER_PERSON = 500;

/**
 * SLCSP Lookup Result
 */
export interface SLCSPResult {
  /** Monthly premium for the SLCSP */
  monthlyPremium: number;

  /** Whether this is real API data or an estimate */
  isEstimate: boolean;

  /** Data source */
  source: 'api' | 'estimate' | 'cache';

  /** Plan ID (if available) */
  planId?: string;

  /** Plan name (if available) */
  planName?: string;

  /** Issuer name (if available) */
  issuerName?: string;

  /** Rating area */
  ratingArea?: string;

  /** Error message if lookup failed */
  error?: string;
}

/**
 * Create a cache key for SLCSP lookup
 */
function createCacheKey(zipCode: string, householdSize: number, ages: number[]): string {
  const agesSorted = [...ages].sort((a, b) => a - b);
  return `${zipCode}-${householdSize}-${agesSorted.join(',')}`;
}

/**
 * Get estimated SLCSP premium (fallback)
 */
function getEstimatedSLCSP(householdSize: number): SLCSPResult {
  const monthlyPremium = householdSize * FALLBACK_PREMIUM_PER_PERSON;

  return {
    monthlyPremium,
    isEstimate: true,
    source: 'estimate',
  };
}

/**
 * Get real SLCSP from Healthcare.gov API
 *
 * @param zipCode - 5-digit ZIP code
 * @param householdSize - Number of people in household
 * @param ages - Array of ages for each household member
 * @param stateCode - Optional 2-letter state code (auto-detected from ZIP if not provided)
 * @returns SLCSP result with premium and metadata
 */
export async function getSLCSP(
  zipCode: string,
  householdSize: number,
  ages: number[],
  stateCode?: string
): Promise<SLCSPResult> {
  // Validate inputs
  if (!zipCode || zipCode.length !== 5) {
    logger.warn('Invalid ZIP code for SLCSP lookup', { zipCode });
    return getEstimatedSLCSP(householdSize);
  }

  if (householdSize !== ages.length) {
    logger.warn('Household size does not match ages array length', { householdSize, agesLength: ages.length });
    return getEstimatedSLCSP(householdSize);
  }

  // Check cache first
  const cacheKey = createCacheKey(zipCode, householdSize, ages);
  const cached = slcspCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logger.info('Using cached SLCSP data', { zipCode, householdSize });
    return {
      monthlyPremium: cached.premium,
      isEstimate: cached.source === 'estimate',
      source: 'cache',
    };
  }

  // Check if API key is available
  if (!process.env.HEALTHCARE_GOV_API_KEY) {
    logger.warn('Healthcare.gov API key not configured, using estimates');
    const result = getEstimatedSLCSP(householdSize);
    slcspCache.set(cacheKey, {
      premium: result.monthlyPremium,
      timestamp: Date.now(),
      source: 'estimate'
    });
    return result;
  }

  try {
    // Create API client
    const client = createHealthcareGovClient();

    // Build place object
    const place: Place = {
      zipcode: zipCode,
      state: stateCode || '', // Auto-detected if not provided
      countyfips: '', // Will be auto-detected by API
    };

    // Build household object
    const household: Household = {
      income: 50000, // Doesn't affect SLCSP lookup, just premium calculation
      people: ages.map((age, index) => ({
        age,
        aptc_eligible: true,
        gender: 'Male', // Doesn't affect premium in ACA
        uses_tobacco: false,
        ...(index === 0 && { is_parent: true }),
      })),
    };

    // Get SLCSP from API
    logger.info('Fetching SLCSP from Healthcare.gov API', { zipCode, householdSize });
    const slcspPlan = await client.getSLCSP(place, household);

    if (!slcspPlan || !slcspPlan.premium) {
      logger.warn('No SLCSP data returned from API', { zipCode });
      const fallback = getEstimatedSLCSP(householdSize);
      slcspCache.set(cacheKey, {
        premium: fallback.monthlyPremium,
        timestamp: Date.now(),
        source: 'estimate'
      });
      return fallback;
    }

    // Extract premium (API returns monthly premium)
    const monthlyPremium = typeof slcspPlan.premium === 'number'
      ? slcspPlan.premium
      : parseFloat(String(slcspPlan.premium));

    // Cache the result
    slcspCache.set(cacheKey, {
      premium: monthlyPremium,
      timestamp: Date.now(),
      source: 'api'
    });

    logger.info('SLCSP lookup successful', {
      zipCode,
      householdSize,
      monthlyPremium,
      planId: slcspPlan.id
    });

    return {
      monthlyPremium,
      isEstimate: false,
      source: 'api',
      planId: slcspPlan.id,
      planName: slcspPlan.name,
      issuerName: slcspPlan.issuer?.name,
      ratingArea: slcspPlan.service_area_id,
    };

  } catch (error) {
    logger.error('Failed to fetch SLCSP from API', {
      error: error instanceof Error ? error.message : String(error),
      zipCode,
      householdSize
    });

    // Fallback to estimate
    const fallback = getEstimatedSLCSP(householdSize);
    slcspCache.set(cacheKey, {
      premium: fallback.monthlyPremium,
      timestamp: Date.now(),
      source: 'estimate'
    });

    return {
      ...fallback,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get SLCSP for multiple ZIP codes (batch lookup)
 *
 * @param locations - Array of {zipCode, householdSize, ages}
 * @returns Array of SLCSP results
 */
export async function getBatchSLCSP(
  locations: Array<{ zipCode: string; householdSize: number; ages: number[] }>
): Promise<SLCSPResult[]> {
  const results: SLCSPResult[] = [];

  for (const location of locations) {
    // Add small delay between requests to respect rate limits (10 req/min = 6 sec between)
    if (results.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 6500));
    }

    const result = await getSLCSP(
      location.zipCode,
      location.householdSize,
      location.ages
    );

    results.push(result);
  }

  return results;
}

/**
 * Clear SLCSP cache (useful for testing or manual refresh)
 */
export function clearSLCSPCache(): void {
  slcspCache.clear();
  logger.info('SLCSP cache cleared');
}

/**
 * Get cache statistics
 */
export function getSLCSPCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number; source: 'api' | 'estimate' }>;
} {
  const entries = Array.from(slcspCache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    source: value.source,
  }));

  return {
    size: slcspCache.size,
    entries,
  };
}

/**
 * Validate ZIP code format
 */
export function isValidZipCode(zipCode: string): boolean {
  return /^\d{5}$/.test(zipCode);
}

/**
 * Format premium for display
 */
export function formatPremium(premium: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(premium);
}

export default {
  getSLCSP,
  getBatchSLCSP,
  clearSLCSPCache,
  getSLCSPCacheStats,
  isValidZipCode,
  formatPremium,
};
