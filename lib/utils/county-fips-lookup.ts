/**
 * County FIPS Code Lookup Utility
 *
 * Provides functions to convert between:
 * - County names ↔ FIPS codes
 * - State codes ↔ State names
 * - FIPS codes → State codes
 *
 * Data source: US Census Bureau
 * Format: FIPS code is 5 digits (2-digit state + 3-digit county)
 */

// State code to name mapping
export const STATE_CODES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana',
  'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
  'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan',
  'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana',
  'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota',
  'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania',
  'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota',
  'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'PR': 'Puerto Rico'
};

// State FIPS code to state abbreviation
export const STATE_FIPS_TO_CODE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY', '72': 'PR'
};

/**
 * Get state code from FIPS code
 * @param fips 5-digit FIPS code
 * @returns 2-letter state code
 */
export function getStateCodeFromFIPS(fips: string): string | null {
  const stateFIPS = fips.substring(0, 2);
  return STATE_FIPS_TO_CODE[stateFIPS] || null;
}

/**
 * Get state name from state code
 * @param stateCode 2-letter state abbreviation
 * @returns Full state name
 */
export function getStateName(stateCode: string): string | null {
  return STATE_CODES[stateCode.toUpperCase()] || null;
}

/**
 * Get state FIPS code from state abbreviation
 * @param stateCode 2-letter state abbreviation
 * @returns 2-digit state FIPS code
 */
export function getStateFIPS(stateCode: string): string | null {
  const code = stateCode.toUpperCase();
  const entry = Object.entries(STATE_FIPS_TO_CODE).find(([_, v]) => v === code);
  return entry ? entry[0] : null;
}

/**
 * Validate FIPS code format
 * @param fips FIPS code to validate
 * @returns true if valid 5-digit format
 */
export function isValidFIPS(fips: string): boolean {
  if (!fips || fips.length !== 5) return false;
  if (!/^\d{5}$/.test(fips)) return false;

  const stateFIPS = fips.substring(0, 2);
  return !!STATE_FIPS_TO_CODE[stateFIPS];
}

/**
 * Pad FIPS code to ensure 5 digits
 * @param fips FIPS code (may be missing leading zeros)
 * @returns Padded 5-digit FIPS code
 */
export function padFIPS(fips: string | number): string {
  return String(fips).padStart(5, '0');
}

/**
 * Pad ZIP code to ensure 5 digits
 * @param zip ZIP code (may be missing leading zeros)
 * @returns Padded 5-digit ZIP code
 */
export function padZIP(zip: string | number): string {
  return String(zip).padStart(5, '0');
}

/**
 * Clean county name (remove " County", " Parish", etc.)
 * @param countyName Full county name
 * @returns Cleaned county name
 */
export function cleanCountyName(countyName: string): string {
  return countyName
    .replace(/ County$/i, '')
    .replace(/ Parish$/i, '')
    .replace(/ Borough$/i, '')
    .replace(/ Census Area$/i, '')
    .replace(/ Municipality$/i, '')
    .trim();
}

/**
 * Format county name for display
 * @param countyName County name
 * @param stateCode State code
 * @returns Formatted "County, ST" string
 */
export function formatCountyDisplay(countyName: string, stateCode: string): string {
  return `${cleanCountyName(countyName)}, ${stateCode.toUpperCase()}`;
}

/**
 * County data interface
 */
export interface CountyInfo {
  fips: string;
  name: string;
  stateCode: string;
  stateName: string;
}

/**
 * Get county information from FIPS code
 * @param fips 5-digit FIPS code
 * @returns County information or null
 */
export function getCountyInfo(fips: string): CountyInfo | null {
  if (!isValidFIPS(fips)) return null;

  const stateCode = getStateCodeFromFIPS(fips);
  if (!stateCode) return null;

  const stateName = getStateName(stateCode);
  if (!stateName) return null;

  return {
    fips: padFIPS(fips),
    name: '', // Will be populated from database lookup
    stateCode,
    stateName
  };
}

/**
 * Check if county is likely urban based on common patterns
 * @param countyName County name
 * @param population Population count (optional)
 * @returns 'urban' or 'rural' classification
 */
export function classifyUrbanRural(countyName: string, population?: number): 'urban' | 'rural' {
  // Major metro counties
  const urbanKeywords = [
    'Los Angeles', 'New York', 'Cook', 'Harris', 'Maricopa',
    'San Diego', 'Orange', 'Miami-Dade', 'Dallas', 'Kings',
    'Queens', 'Riverside', 'San Bernardino', 'Clark', 'Tarrant',
    'Bexar', 'Wayne', 'Santa Clara', 'Broward', 'Alameda',
    'Philadelphia', 'Suffolk', 'Middlesex', 'Palm Beach', 'Hillsborough',
    'Oakland', 'Hennepin', 'Franklin', 'Cuyahoga', 'Milwaukee'
  ];

  if (urbanKeywords.some(keyword => countyName.includes(keyword))) {
    return 'urban';
  }

  // Population threshold (if provided)
  if (population !== undefined) {
    return population > 100000 ? 'urban' : 'rural';
  }

  // Default to rural if unknown
  return 'rural';
}

/**
 * Get all state codes
 * @returns Array of all state codes
 */
export function getAllStateCodes(): string[] {
  return Object.keys(STATE_CODES);
}

/**
 * Get all states with names
 * @returns Array of {code, name} objects
 */
export function getAllStates(): Array<{ code: string; name: string }> {
  return Object.entries(STATE_CODES).map(([code, name]) => ({ code, name }));
}

export default {
  STATE_CODES,
  STATE_FIPS_TO_CODE,
  getStateCodeFromFIPS,
  getStateName,
  getStateFIPS,
  isValidFIPS,
  padFIPS,
  padZIP,
  cleanCountyName,
  formatCountyDisplay,
  getCountyInfo,
  classifyUrbanRural,
  getAllStateCodes,
  getAllStates
};
