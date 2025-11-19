/**
 * API Route: Get County by ZIP Code
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

// Simple in-memory cache for county lookups (expires after 1 hour)
const countyCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 1000; // Prevent unbounded memory growth
const CACHE_CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // Clean up every 15 minutes

// Lock mechanism to prevent race conditions
const pendingRequests = new Map<string, Promise<Response>>();

/**
 * Clean up expired cache entries to prevent memory leaks
 */
function cleanupExpiredCache() {
  const now = Date.now();
  let removedCount = 0;

  for (const [key, entry] of countyCache.entries()) {
    if (now - entry.timestamp >= CACHE_DURATION_MS) {
      countyCache.delete(key);
      removedCount++;
    }
  }

  if (removedCount > 0) {
    logger.info(`Cleaned up ${removedCount} expired cache entries`, {
      remainingEntries: countyCache.size,
    });
  }
}

/**
 * Evict oldest entries if cache exceeds max size (LRU eviction)
 */
function evictOldestIfNeeded() {
  if (countyCache.size >= MAX_CACHE_SIZE) {
    // Find and remove the oldest entry
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of countyCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      countyCache.delete(oldestKey);
      logger.info('Evicted oldest cache entry (max size reached)', {
        cacheSize: countyCache.size,
        maxSize: MAX_CACHE_SIZE,
      });
    }
  }
}

// Set up periodic cache cleanup to prevent memory leaks
let cleanupInterval: NodeJS.Timeout | null = null;
if (!cleanupInterval) {
  cleanupInterval = setInterval(cleanupExpiredCache, CACHE_CLEANUP_INTERVAL_MS);
  // Ensure interval doesn't prevent process from exiting
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ zipcode: string }> }
) {
  const { zipcode } = await context.params;

  if (!API_KEY) {
    logger.error('Healthcare.gov API key not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  if (!zipcode || !/^\d{5}$/.test(zipcode)) {
    logger.warn('Invalid ZIP code format', { zipcode });
    return NextResponse.json(
      { error: 'Invalid ZIP code format. Must be 5 digits.' },
      { status: 400 }
    );
  }

  // Check cache first
  const cached = countyCache.get(zipcode);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    logger.info('County lookup cache hit', { zipcode });
    return NextResponse.json(cached.data);
  }

  // Check if there's already a pending request for this ZIP code
  const existingRequest = pendingRequests.get(zipcode);
  if (existingRequest) {
    logger.info('Reusing pending county lookup request', { zipcode });
    try {
      const result = await existingRequest;
      return NextResponse.json(await result.json());
    } catch (error) {
      logger.error('Error with pending request', { zipcode, error });
      return NextResponse.json(
        { error: 'Failed to fetch county data' },
        { status: 500 }
      );
    }
  }

  // Create new request and store it in pending requests
  const requestPromise = (async (): Promise<Response> => {
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
            throw new Error('NOT_FOUND');
          }
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        return res;
      });

      return response;
    } finally {
      // Remove from pending requests when done
      pendingRequests.delete(zipcode);
    }
  })();

  // Store the promise
  pendingRequests.set(zipcode, requestPromise);

  try {
    const response = await requestPromise;
    const data = await response.json();

    // Evict oldest entry if cache is full
    evictOldestIfNeeded();

    // Cache the result
    countyCache.set(zipcode, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (error) {
    logger.error('County lookup error', { zipcode, error });

    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'ZIP code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch county data' },
      { status: 500 }
    );
  }
}
