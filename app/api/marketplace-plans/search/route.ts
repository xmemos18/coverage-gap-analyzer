/**
 * API Route: Search Marketplace Plans
 * Server-side proxy for Healthcare.gov API to protect API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { API_CONFIG } from '@/lib/constants';
import { CacheManager, RateLimiter, generateCacheKey } from '@/lib/cache/redis';
import { MarketplacePlanSearchRequestSchema, parseRequestBody } from '@/lib/validation/api-schemas';

const API_BASE_URL = 'https://marketplace.api.healthcare.gov/api/v1';
const API_KEY = process.env.HEALTHCARE_GOV_API_KEY; // Server-side only
const API_TIMEOUT_MS = API_CONFIG.HEALTHCARE_GOV_TIMEOUT_MS;
const MAX_RETRIES = API_CONFIG.HEALTHCARE_GOV_MAX_RETRIES;
const RETRY_DELAY_MS = API_CONFIG.HEALTHCARE_GOV_RETRY_DELAY_MS;

/**
 * States with their own state-based marketplace (not using HealthCare.gov)
 * These states operate their own exchanges and are not served by the federal API
 */
const STATE_BASED_MARKETPLACE_STATES = new Set([
  'CA', // Covered California
  'CO', // Connect for Health Colorado
  'CT', // Access Health CT
  'DC', // DC Health Link
  'ID', // Your Health Idaho
  'KY', // kynect
  'MD', // Maryland Health Connection
  'MA', // Massachusetts Health Connector
  'MN', // MNsure
  'NV', // Nevada Health Link
  'NJ', // GetCoveredNJ
  'NY', // NY State of Health
  'PA', // Pennie
  'RI', // HealthSource RI
  'VT', // Vermont Health Connect
  'WA', // Washington Healthplanfinder
]);

/**
 * Distributed cache for API responses
 * Cache TTL: 24 hours (plan data doesn't change frequently)
 */
const cache = new CacheManager('marketplace-plans', 24 * 60 * 60); // 24 hours

/**
 * Distributed rate limiting
 * Limits: 10 requests per minute per IP (reduced from 60 for better protection)
 */
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute
const RATE_LIMIT_WINDOW_SECONDS = 60; // 1 minute

const rateLimiter = new RateLimiter(
  'rate-limit:marketplace-api',
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_SECONDS
);

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

export async function POST(request: NextRequest) {
  // Rate limiting check
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const rateLimit = await rateLimiter.checkLimit(ip);

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    logger.warn('Rate limit exceeded', { ip, retryAfter });
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        }
      }
    );
  }

  if (!API_KEY) {
    logger.error('Healthcare.gov API key not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const rawBody = await request.json();

    // Validate with Zod
    const parsed = parseRequestBody(MarketplacePlanSearchRequestSchema, rawBody);
    if (!parsed.success) {
      logger.warn('[Marketplace Plans API] Validation failed', { error: parsed.error });
      return NextResponse.json(
        { error: parsed.error, details: parsed.details },
        { status: 400 }
      );
    }

    const body = parsed.data;

    // Step 1: Get county for the ZIP code
    const countyCacheKey = generateCacheKey('county', { zipcode: body.zipcode });

    const countyData = await cache.wrap<{ counties?: Array<{ fips: string; state: string; name: string }> }>(
      countyCacheKey,
      async () => {
        const countyResponse = await fetchWithRetry(async () => {
          const res = await fetchWithTimeout(
            `${API_BASE_URL}/counties/by/zip/${body.zipcode}?apikey=${API_KEY}`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          if (!res.ok) {
            if (res.status === 404) {
              throw new Error('ZIP_NOT_FOUND');
            }
            throw new Error(`API error: ${res.status} ${res.statusText}`);
          }

          return res;
        });

        const data = await countyResponse.json() as { counties?: Array<{ fips: string; state: string; name: string }> };
        logger.info('County data fetched and cached', { zipcode: body.zipcode });
        return data;
      },
      24 * 60 * 60 // 24 hours
    );

    if (!countyData.counties || countyData.counties.length === 0) {
      logger.error('No counties found for ZIP code', { zipcode: body.zipcode });
      return NextResponse.json(
        { error: 'No counties found for this ZIP code' },
        { status: 404 }
      );
    }

    const county = countyData.counties[0];

    if (!county?.fips || !county?.state) {
      logger.error('Invalid county data', { county });
      return NextResponse.json(
        { error: 'Invalid county data received' },
        { status: 500 }
      );
    }

    // Check if state uses a state-based marketplace (not HealthCare.gov)
    if (STATE_BASED_MARKETPLACE_STATES.has(county.state)) {
      logger.info('[Marketplace Plans API] State-based marketplace detected', {
        state: county.state,
        zipcode: body.zipcode
      });
      return NextResponse.json({
        state_based_marketplace: true,
        state: county.state,
        message: `${county.state} operates its own health insurance marketplace. Please visit your state's marketplace website to search for plans.`,
        plans: [], // Empty plans array so frontend can handle gracefully
        total: 0,
      }, {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        }
      });
    }

    // Step 2: Build request body for plan search
    interface RequestBody {
      place: {
        countyfips: string;
        state: string;
        zipcode: string;
      };
      market: string;
      year: number;
      household?: unknown;
      filter?: unknown;
      limit?: number;
      offset?: number;
    }

    // Healthcare.gov API typically lags behind - 2025 data may not be available yet
    // Cap year at 2024 to ensure API compatibility
    const currentYear = new Date().getFullYear();
    const apiYear = Math.min(body.year || currentYear, 2024);

    const requestBody: RequestBody = {
      place: {
        countyfips: county.fips,
        state: body.state || county.state,
        zipcode: body.zipcode,
      },
      market: body.market || 'Individual',
      year: apiYear,
    };

    // Add optional fields if provided
    if (body.household) {
      requestBody.household = body.household;
    }

    if (body.filter) {
      requestBody.filter = body.filter;
    }

    if (body.limit) {
      requestBody.limit = Math.min(body.limit, 100);
    }

    if (body.offset) {
      requestBody.offset = body.offset;
    }

    // Step 3: Search for plans
    const plansCacheKey = generateCacheKey('plans', requestBody as unknown as Record<string, unknown>);
    let data = await cache.get<unknown>(plansCacheKey);

    if (!data) {
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

      data = await response.json();
      await cache.set(plansCacheKey, data);
      logger.info('Plan data cached', { zipcode: body.zipcode, year: requestBody.year });
    } else {
      logger.info('Plan data retrieved from cache', { zipcode: body.zipcode, year: requestBody.year });
    }

    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
      }
    });
  } catch (error) {
    logger.error('Plan search error', { error });

    if (error instanceof Error && error.message === 'ZIP_NOT_FOUND') {
      return NextResponse.json(
        { error: 'ZIP code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search for plans' },
      { status: 500 }
    );
  }
}
