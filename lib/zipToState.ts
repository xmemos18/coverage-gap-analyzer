/**
 * ZIP Code to State Mapping
 * Maps ZIP code ranges to US state codes for auto-population
 */

interface ZipRange {
  min: number;
  max: number;
  state: string;
}

/**
 * ZIP code ranges mapped to states
 * Based on USPS ZIP code allocation
 */
const ZIP_RANGES: ZipRange[] = [
  // Northeast
  { min: 10001, max: 14999, state: 'NY' },
  { min: 6001, max: 6999, state: 'CT' },
  { min: 7001, max: 8999, state: 'NJ' },
  { min: 15001, max: 19699, state: 'PA' },
  { min: 1001, max: 2799, state: 'MA' },
  { min: 2801, max: 2999, state: 'RI' },
  { min: 3001, max: 3899, state: 'NH' },
  { min: 4001, max: 4999, state: 'ME' },
  { min: 5001, max: 5999, state: 'VT' },

  // Mid-Atlantic
  { min: 19701, max: 19999, state: 'DE' },
  { min: 20001, max: 20599, state: 'DC' },
  { min: 20600, max: 21999, state: 'MD' },
  { min: 22001, max: 24699, state: 'VA' },
  { min: 24700, max: 26999, state: 'WV' },

  // Southeast
  { min: 27001, max: 28999, state: 'NC' },
  { min: 29001, max: 29999, state: 'SC' },
  { min: 30001, max: 31999, state: 'GA' },
  { min: 32001, max: 34999, state: 'FL' },
  { min: 35001, max: 36999, state: 'AL' },
  { min: 37001, max: 38599, state: 'TN' },
  { min: 38601, max: 39999, state: 'MS' },
  { min: 40001, max: 42799, state: 'KY' },

  // Midwest
  { min: 43001, max: 45999, state: 'OH' },
  { min: 46001, max: 47999, state: 'IN' },
  { min: 48001, max: 49999, state: 'MI' },
  { min: 50001, max: 52999, state: 'IA' },
  { min: 53001, max: 54999, state: 'WI' },
  { min: 55001, max: 56799, state: 'MN' },
  { min: 57001, max: 57999, state: 'SD' },
  { min: 58001, max: 58999, state: 'ND' },
  { min: 59001, max: 59999, state: 'MT' },
  { min: 60001, max: 62999, state: 'IL' },
  { min: 63001, max: 65999, state: 'MO' },
  { min: 66001, max: 67999, state: 'KS' },
  { min: 68001, max: 69999, state: 'NE' },

  // South
  { min: 70001, max: 71599, state: 'LA' },
  { min: 71601, max: 72999, state: 'AR' },
  { min: 73001, max: 74999, state: 'OK' },
  { min: 75001, max: 79999, state: 'TX' },
  { min: 88501, max: 88599, state: 'TX' },

  // Mountain
  { min: 80001, max: 81699, state: 'CO' },
  { min: 82001, max: 83199, state: 'WY' },
  { min: 83200, max: 83999, state: 'ID' },
  { min: 84001, max: 84999, state: 'UT' },
  { min: 85001, max: 86599, state: 'AZ' },
  { min: 87001, max: 88499, state: 'NM' },
  { min: 89001, max: 89899, state: 'NV' },

  // Pacific
  { min: 90001, max: 96199, state: 'CA' },
  { min: 96701, max: 96899, state: 'HI' },
  { min: 97001, max: 97999, state: 'OR' },
  { min: 98001, max: 99499, state: 'WA' },
  { min: 99501, max: 99999, state: 'AK' },
];

/**
 * Get state code from ZIP code
 * @param zipCode - 5-digit ZIP code as string
 * @returns State code (e.g., 'NY') or null if not found
 */
export function getStateFromZip(zipCode: string): string | null {
  // Validate ZIP code format
  if (!zipCode || zipCode.length !== 5) {
    return null;
  }

  const zipNum = parseInt(zipCode, 10);

  // Invalid ZIP
  if (isNaN(zipNum) || zipNum < 1 || zipNum > 99999) {
    return null;
  }

  // Find matching range
  for (const range of ZIP_RANGES) {
    if (zipNum >= range.min && zipNum <= range.max) {
      return range.state;
    }
  }

  return null;
}

/**
 * Check if ZIP code is valid (exists in our mapping)
 * @param zipCode - 5-digit ZIP code as string
 * @returns true if ZIP code maps to a state
 */
export function isValidZipCode(zipCode: string): boolean {
  return getStateFromZip(zipCode) !== null;
}
