/**
 * ZIP Code validation and location lookup using Zippopotam.us API
 * Free, unlimited, no API key required
 */

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
 * Validate a US ZIP code and get location data
 * @param zip - 5-digit ZIP code
 * @returns Location data or null if invalid
 */
export async function validateZipCode(zip: string): Promise<ZipCodeLocation | null> {
  // Basic validation
  if (!zip || !/^\d{5}$/.test(zip)) {
    return null;
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // ZIP code not found
      return null;
    }

    const data = await response.json();

    // Zippopotam returns places array
    if (!data.places || data.places.length === 0) {
      return null;
    }

    const place = data.places[0];

    return {
      zip,
      city: place['place name'],
      state: place.state,
      stateAbbr: place['state abbreviation'],
      latitude: place.latitude,
      longitude: place.longitude,
      country: data.country,
    };
  } catch (error) {
    console.error('ZIP code validation error:', error);
    return null;
  }
}

/**
 * Validate multiple ZIP codes at once
 * @param zips - Array of ZIP codes
 * @returns Array of location data (null for invalid ZIPs)
 */
export async function validateZipCodes(zips: string[]): Promise<(ZipCodeLocation | null)[]> {
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
  const [loc1, loc2] = await Promise.all([
    validateZipCode(zip1),
    validateZipCode(zip2),
  ]);

  if (!loc1 || !loc2) {
    return null;
  }

  // Haversine formula
  const lat1 = parseFloat(loc1.latitude);
  const lon1 = parseFloat(loc1.longitude);
  const lat2 = parseFloat(loc2.latitude);
  const lon2 = parseFloat(loc2.longitude);

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
