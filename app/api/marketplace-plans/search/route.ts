/**
 * API Route: Search Marketplace Plans
 * Server-side proxy for Healthcare.gov API to protect API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { API_CONFIG } from '@/lib/constants';

const API_BASE_URL = 'https://marketplace.api.healthcare.gov/api/v1';
const API_KEY = process.env.HEALTHCARE_GOV_API_KEY; // Server-side only
const API_TIMEOUT_MS = API_CONFIG.HEALTHCARE_GOV_TIMEOUT_MS;
const MAX_RETRIES = API_CONFIG.HEALTHCARE_GOV_MAX_RETRIES;
const RETRY_DELAY_MS = API_CONFIG.HEALTHCARE_GOV_RETRY_DELAY_MS;

/**
 * Simple in-memory cache for API responses
 * Cache TTL: 24 hours (plan data doesn't change frequently)
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000; // Prevent unlimited growth

/**
 * Rate limiting configuration
 * Limits: 60 requests per minute per IP
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    // New window or expired window
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  // Increment counter
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetTime: entry.resetTime };
}

function getCacheKey(type: string, params: Record<string, unknown>): string {
  return `${type}:${JSON.stringify(params)}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setInCache<T>(key: string, data: T): void {
  // Prevent cache from growing too large
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }

  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
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

export async function POST(request: NextRequest) {
  // Rate limiting check
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const rateLimit = checkRateLimit(ip);

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
    const body = await request.json();

    // Validate required fields
    if (!body.zipcode) {
      return NextResponse.json(
        { error: 'ZIP code is required' },
        { status: 400 }
      );
    }

    // Step 1: Get county for the ZIP code
    const countyCacheKey = getCacheKey('county', { zipcode: body.zipcode });
    let countyData = getFromCache<{ counties?: Array<{ fips: string; state: string; name: string }> }>(countyCacheKey);

    if (!countyData) {
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

      countyData = await countyResponse.json() as { counties?: Array<{ fips: string; state: string; name: string }> };
      setInCache(countyCacheKey, countyData);
      logger.info('County data cached', { zipcode: body.zipcode });
    } else {
      logger.info('County data retrieved from cache', { zipcode: body.zipcode });
    }

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

    const requestBody: RequestBody = {
      place: {
        countyfips: county.fips,
        state: body.state || county.state,
        zipcode: body.zipcode,
      },
      market: body.market || 'Individual',
      year: body.year || new Date().getFullYear(),
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
    const plansCacheKey = getCacheKey('plans', requestBody as unknown as Record<string, unknown>);
    let data = getFromCache<unknown>(plansCacheKey);

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
      setInCache(plansCacheKey, data);
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
