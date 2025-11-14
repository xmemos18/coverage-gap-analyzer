/**
 * ZIP Code validation and location lookup using Zippopotam.us API
 * Free, unlimited, no API key required
 */

import { logger } from './logger';

const API_TIMEOUT_MS = 5000; // 5 second timeout for ZIP lookups
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

// Simple cache for ZIP code lookups (expires after 24 hours)
const zipCache = new Map<string, { data: ZipCodeLocation; timestamp: number }>();
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clean up expired entries from the cache to prevent memory leaks
 */
function cleanupExpiredCacheEntries() {
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, value] of zipCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION_MS) {
      expiredKeys.push(key);
    }
  }

  expiredKeys.forEach(key => zipCache.delete(key));

  if (expiredKeys.length > 0) {
    logger.debug(`Cleaned up ${expiredKeys.length} expired ZIP code cache entries`);
  }
}

// Run cleanup every hour to prevent memory leaks
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredCacheEntries, 60 * 60 * 1000); // Every hour
}

export interface ZipCodeLocation {
  zip: string;
  city: string;
  state: string;
  stateAbbr: string;
  latitude: string;
  longitude: string;
  country: string;
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

      // Don't retry on 404 errors (ZIP not found)
      if (lastError.message.includes('404')) {
        throw lastError;
      }

      // Wait before retrying
      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('API call failed after retries');
}

/**
 * Validate Zippopotam API response structure
 */
function validateZipResponse(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const response = data as {
    places?: unknown;
    country?: unknown;
  };

  if (!Array.isArray(response.places) || response.places.length === 0) {
    return false;
  }

  const place = response.places[0];
  if (!place || typeof place !== 'object') {
    return false;
  }

  const p = place as {
    'place name'?: unknown;
    state?: unknown;
    'state abbreviation'?: unknown;
    latitude?: unknown;
    longitude?: unknown;
  };

  return (
    typeof p['place name'] === 'string' &&
    typeof p.state === 'string' &&
    typeof p['state abbreviation'] === 'string' &&
    typeof p.latitude === 'string' &&
    typeof p.longitude === 'string'
  );
}

/**
 * Validate a US ZIP code and get location data
 * @param zip - 5-digit ZIP code
 * @returns Location data or null if invalid
 */
export async function validateZipCode(zip: string): Promise<ZipCodeLocation | null> {
  // Basic validation
  if (!zip || !/^\d{5}$/.test(zip)) {
    return null;
  }

  // Check cache first
  const cached = zipCache.get(zip);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }

  try {
    const response = await fetchWithRetry(async () => {
      const res = await fetchWithTimeout(`https://api.zippopotam.us/us/${zip}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        // ZIP code not found
        if (res.status === 404) {
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
    if (!validateZipResponse(data)) {
      logger.error('Invalid ZIP code API response structure', { zip });
      return null;
    }

    const apiData = data as {
      places: Array<{
        'place name': string;
        state: string;
        'state abbreviation': string;
        latitude: string;
        longitude: string;
      }>;
      country: string;
    };

    const place = apiData.places[0];

    const location: ZipCodeLocation = {
      zip,
      city: place['place name'],
      state: place.state,
      stateAbbr: place['state abbreviation'],
      latitude: place.latitude,
      longitude: place.longitude,
      country: apiData.country,
    };

    // Cache the result
    zipCache.set(zip, { data: location, timestamp: Date.now() });

    return location;
  } catch (error) {
    logger.error('ZIP code validation error', { zip, error });
    return null;
  }
}

/**
 * Validate multiple ZIP codes at once
 * @param zips - Array of ZIP codes
 * @returns Array of location data (null for invalid ZIPs)
 */
export async function validateZipCodes(zips: string[]): Promise<(ZipCodeLocation | null)[]> {
  if (!Array.isArray(zips)) {
    logger.warn('validateZipCodes called with non-array', { zips });
    return [];
  }

  const promises = zips.map(zip => validateZipCode(zip));
  return Promise.all(promises);
}

/**
 * Check if ZIP code is valid (boolean only, no data)
 * @param zip - 5-digit ZIP code
 * @returns true if valid, false if invalid
 */
export async function isValidZipCode(zip: string): Promise<boolean> {
  const result = await validateZipCode(zip);
  return result !== null;
}

/**
 * Get city name from ZIP code
 * @param zip - 5-digit ZIP code
 * @returns City name or null
 */
export async function getCityFromZip(zip: string): Promise<string | null> {
  const result = await validateZipCode(zip);
  return result?.city || null;
}

/**
 * Get state abbreviation from ZIP code
 * @param zip - 5-digit ZIP code
 * @returns State abbreviation (e.g., "CA") or null
 */
export async function getStateFromZip(zip: string): Promise<string | null> {
  const result = await validateZipCode(zip);
  return result?.stateAbbr || null;
}

/**
 * Calculate distance between two ZIP codes using Haversine formula
 * @param zip1 - First ZIP code
 * @param zip2 - Second ZIP code
 * @returns Distance in miles or null if either ZIP is invalid
 */
export async function getDistanceBetweenZips(zip1: string, zip2: string): Promise<number | null> {
  // Handle identical ZIP codes
  if (zip1 === zip2) {
    return 0;
  }

  const [loc1, loc2] = await Promise.all([
    validateZipCode(zip1),
    validateZipCode(zip2),
  ]);

  if (!loc1 || !loc2) {
    logger.warn('Cannot calculate distance for invalid ZIP codes', { zip1, zip2 });
    return null;
  }

  // Validate coordinates are parseable
  const lat1 = parseFloat(loc1.latitude);
  const lon1 = parseFloat(loc1.longitude);
  const lat2 = parseFloat(loc2.latitude);
  const lon2 = parseFloat(loc2.longitude);

  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    logger.error('Invalid coordinates for distance calculation', {
      zip1,
      zip2,
      lat1,
      lon1,
      lat2,
      lon2,
    });
    return null;
  }

  // Haversine formula
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
