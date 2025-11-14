/**
 * API Route: Calculate Subsidy Estimates
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

    if (!body.household) {
      return NextResponse.json(
        { error: 'Household information is required' },
        { status: 400 }
      );
    }

    // Step 1: Get county for the ZIP code
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

    const countyData = await countyResponse.json() as { counties?: Array<{ fips: string; state: string; name: string }> };

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

    // Step 2: Calculate subsidy estimates
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
              zipcode: body.zipcode,
            },
            household: body.household,
            market: 'Individual',
            year: body.year || new Date().getFullYear(),
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res;
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Subsidy calculation error', { error });

    if (error instanceof Error && error.message === 'ZIP_NOT_FOUND') {
      return NextResponse.json(
        { error: 'ZIP code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to calculate subsidy estimates' },
      { status: 500 }
    );
  }
}
