/**
 * API Route: Get Plan Details
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

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    logger.error('Healthcare.gov API key not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const planId = searchParams.get('planId');
  const year = searchParams.get('year');

  if (!planId) {
    return NextResponse.json(
      { error: 'Plan ID is required' },
      { status: 400 }
    );
  }

  try {
    const yearParam = year || new Date().getFullYear().toString();

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
          throw new Error('PLAN_NOT_FOUND');
        }
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res;
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Plan details error', { planId, year, error });

    if (error instanceof Error && error.message === 'PLAN_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch plan details' },
      { status: 500 }
    );
  }
}
