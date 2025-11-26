/**
 * CMS NPPES (National Plan and Provider Enumeration System) API Integration
 *
 * Provides healthcare provider lookup by NPI number, name, specialty, and location.
 * API Documentation: https://npiregistry.cms.hhs.gov/api-page
 */

import { logger } from '@/lib/logger';

// NPPES API Base URL
const NPPES_API_BASE = 'https://npiregistry.cms.hhs.gov/api/';
const API_VERSION = '2.1';

// Types
export interface NPPESProviderAddress {
  country_code: string;
  country_name: string;
  address_purpose: string;
  address_type: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postal_code: string;
  telephone_number?: string;
  fax_number?: string;
}

export interface NPPESProviderTaxonomy {
  code: string;
  taxonomy_group?: string;
  desc: string;
  state?: string;
  license?: string;
  primary: boolean;
}

export interface NPPESProviderBasic {
  // Individual provider fields
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  credential?: string;
  sole_proprietor?: string;
  gender?: string;
  // Organization fields
  organization_name?: string;
  organizational_subpart?: string;
  // Common fields
  enumeration_date: string;
  last_updated: string;
  status: string;
  name_prefix?: string;
  name_suffix?: string;
}

export interface NPPESProviderResult {
  created_epoch: number;
  enumeration_type: 'NPI-1' | 'NPI-2'; // 1 = Individual, 2 = Organization
  last_updated_epoch: number;
  number: string; // NPI number
  addresses: NPPESProviderAddress[];
  taxonomies: NPPESProviderTaxonomy[];
  basic: NPPESProviderBasic;
  practiceLocations?: NPPESProviderAddress[];
  other_names?: Array<{
    type: string;
    code: string;
    first_name?: string;
    last_name?: string;
    organization_name?: string;
  }>;
  identifiers?: Array<{
    code: string;
    desc: string;
    identifier: string;
    state: string;
    issuer?: string;
  }>;
  endpoints?: Array<{
    endpointType: string;
    endpointTypeDescription: string;
    endpoint: string;
    affiliation: string;
    use: string;
    useDescription: string;
    contentType: string;
    contentTypeDescription: string;
    country_code: string;
    country_name: string;
    address_type: string;
    address_1: string;
    city: string;
    state: string;
    postal_code: string;
  }>;
}

export interface NPPESSearchResponse {
  result_count: number;
  results: NPPESProviderResult[];
}

export interface ProviderSearchParams {
  npi?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  taxonomyDescription?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  limit?: number;
  skip?: number;
  pretty?: boolean;
}

// Normalized provider type for application use
export interface Provider {
  npi: string;
  type: 'individual' | 'organization';
  name: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  credential?: string;
  organizationName?: string;
  gender?: string;
  primarySpecialty: string;
  specialties: Array<{
    code: string;
    description: string;
    isPrimary: boolean;
    license?: string;
    state?: string;
  }>;
  addresses: Array<{
    type: 'mailing' | 'practice';
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
    fax?: string;
  }>;
  enumerationDate: string;
  lastUpdated: string;
  status: string;
}

/**
 * Search for providers using the NPPES API
 */
export async function searchProviders(
  params: ProviderSearchParams
): Promise<{ providers: Provider[]; totalCount: number }> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('version', API_VERSION);

    if (params.npi) {
      queryParams.set('number', params.npi);
    }
    if (params.firstName) {
      queryParams.set('first_name', params.firstName);
    }
    if (params.lastName) {
      queryParams.set('last_name', params.lastName);
    }
    if (params.organizationName) {
      queryParams.set('organization_name', params.organizationName);
    }
    if (params.taxonomyDescription) {
      queryParams.set('taxonomy_description', params.taxonomyDescription);
    }
    if (params.city) {
      queryParams.set('city', params.city);
    }
    if (params.state) {
      queryParams.set('state', params.state);
    }
    if (params.postalCode) {
      // NPPES uses first 5 digits of postal code
      queryParams.set('postal_code', params.postalCode.substring(0, 5));
    }
    if (params.countryCode) {
      queryParams.set('country_code', params.countryCode);
    }
    if (params.limit) {
      queryParams.set('limit', Math.min(params.limit, 200).toString());
    }
    if (params.skip) {
      queryParams.set('skip', params.skip.toString());
    }

    const url = `${NPPES_API_BASE}?${queryParams.toString()}`;

    logger.info('[NPPES] Searching providers', { params });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NPPES API error: ${response.status} ${response.statusText}`);
    }

    const data: NPPESSearchResponse = await response.json();

    // Normalize results
    const providers = data.results.map(normalizeProvider);

    return {
      providers,
      totalCount: data.result_count,
    };
  } catch (error) {
    logger.error('[NPPES] Search error', {
      error: error instanceof Error ? error.message : String(error),
      params,
    });
    throw error;
  }
}

/**
 * Look up a single provider by NPI number
 */
export async function getProviderByNPI(npi: string): Promise<Provider | null> {
  // Validate NPI format (10 digits)
  if (!/^\d{10}$/.test(npi)) {
    throw new Error('Invalid NPI format. NPI must be exactly 10 digits.');
  }

  const result = await searchProviders({ npi, limit: 1 });
  return result.providers[0] || null;
}

/**
 * Search for providers by name
 */
export async function searchProvidersByName(
  firstName?: string,
  lastName?: string,
  state?: string,
  limit: number = 20
): Promise<{ providers: Provider[]; totalCount: number }> {
  return searchProviders({
    firstName,
    lastName,
    state,
    limit,
  });
}

/**
 * Search for organizations by name
 */
export async function searchOrganizations(
  organizationName: string,
  state?: string,
  limit: number = 20
): Promise<{ providers: Provider[]; totalCount: number }> {
  return searchProviders({
    organizationName,
    state,
    limit,
  });
}

/**
 * Search for providers by specialty
 */
export async function searchProvidersBySpecialty(
  specialty: string,
  state?: string,
  city?: string,
  limit: number = 20
): Promise<{ providers: Provider[]; totalCount: number }> {
  return searchProviders({
    taxonomyDescription: specialty,
    state,
    city,
    limit,
  });
}

/**
 * Normalize NPPES API response to our Provider type
 */
function normalizeProvider(result: NPPESProviderResult): Provider {
  const isIndividual = result.enumeration_type === 'NPI-1';

  // Get name
  let name: string;
  if (isIndividual) {
    const parts = [
      result.basic.name_prefix,
      result.basic.first_name,
      result.basic.middle_name,
      result.basic.last_name,
      result.basic.credential,
    ].filter(Boolean);
    name = parts.join(' ');
  } else {
    name = result.basic.organization_name || 'Unknown Organization';
  }

  // Get primary specialty
  const primaryTaxonomy = result.taxonomies.find(t => t.primary) || result.taxonomies[0];
  const primarySpecialty = primaryTaxonomy?.desc || 'Unknown';

  // Normalize specialties
  const specialties = result.taxonomies.map(t => ({
    code: t.code,
    description: t.desc,
    isPrimary: t.primary,
    license: t.license,
    state: t.state,
  }));

  // Normalize addresses
  const addresses = result.addresses.map(addr => ({
    type: addr.address_purpose === 'MAILING' ? 'mailing' as const : 'practice' as const,
    line1: addr.address_1,
    line2: addr.address_2,
    city: addr.city,
    state: addr.state,
    zip: addr.postal_code,
    phone: addr.telephone_number,
    fax: addr.fax_number,
  }));

  return {
    npi: result.number,
    type: isIndividual ? 'individual' : 'organization',
    name,
    firstName: result.basic.first_name,
    lastName: result.basic.last_name,
    middleName: result.basic.middle_name,
    credential: result.basic.credential,
    organizationName: result.basic.organization_name,
    gender: result.basic.gender,
    primarySpecialty,
    specialties,
    addresses,
    enumerationDate: result.basic.enumeration_date,
    lastUpdated: result.basic.last_updated,
    status: result.basic.status,
  };
}

/**
 * Validate NPI checksum using Luhn algorithm
 */
export function validateNPIChecksum(npi: string): boolean {
  if (!/^\d{10}$/.test(npi)) {
    return false;
  }

  // NPI uses Luhn algorithm with prefix 80840
  const fullNumber = '80840' + npi;
  let sum = 0;
  let isEven = false;

  for (let i = fullNumber.length - 1; i >= 0; i--) {
    const char = fullNumber.charAt(i);
    let digit = parseInt(char, 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Common taxonomy codes for healthcare providers
 */
export const COMMON_TAXONOMIES = {
  // Primary Care
  familyMedicine: '207Q00000X',
  internalMedicine: '207R00000X',
  generalPractice: '208D00000X',
  pediatrics: '208000000X',

  // Specialists
  cardiology: '207RC0000X',
  dermatology: '207N00000X',
  endocrinology: '207RE0101X',
  gastroenterology: '207RG0100X',
  neurology: '2084N0400X',
  obstetricsGynecology: '207V00000X',
  oncology: '207RX0202X',
  ophthalmology: '207W00000X',
  orthopedics: '207X00000X',
  psychiatry: '2084P0800X',
  pulmonology: '207RP1001X',
  rheumatology: '207RR0500X',
  urology: '208800000X',

  // Mental Health
  psychology: '103T00000X',
  clinicalSocialWorker: '1041C0700X',
  mentalHealthCounselor: '101YM0800X',

  // Allied Health
  physicalTherapist: '225100000X',
  occupationalTherapist: '225X00000X',
  speechLanguagePathologist: '235Z00000X',

  // Nursing
  nursePractitioner: '363L00000X',
  physicianAssistant: '363A00000X',
  registerNurse: '163W00000X',

  // Dental
  dentistGeneral: '1223G0001X',
  oral_surgery: '1223S0112X',

  // Vision
  optometrist: '152W00000X',

  // Facilities
  hospital: '282N00000X',
  clinic: '261QM0850X',
  pharmacy: '333600000X',
};

/**
 * Get taxonomy code description from code
 */
export function getTaxonomyDescription(code: string): string {
  const descriptions: Record<string, string> = {
    '207Q00000X': 'Family Medicine',
    '207R00000X': 'Internal Medicine',
    '208D00000X': 'General Practice',
    '208000000X': 'Pediatrics',
    '207RC0000X': 'Cardiovascular Disease',
    '207N00000X': 'Dermatology',
    '207RE0101X': 'Endocrinology, Diabetes & Metabolism',
    '207RG0100X': 'Gastroenterology',
    '2084N0400X': 'Neurology',
    '207V00000X': 'Obstetrics & Gynecology',
    '207RX0202X': 'Medical Oncology',
    '207W00000X': 'Ophthalmology',
    '207X00000X': 'Orthopaedic Surgery',
    '2084P0800X': 'Psychiatry',
    '207RP1001X': 'Pulmonary Disease',
    '207RR0500X': 'Rheumatology',
    '208800000X': 'Urology',
    '103T00000X': 'Psychologist',
    '1041C0700X': 'Clinical Social Worker',
    '101YM0800X': 'Mental Health Counselor',
    '225100000X': 'Physical Therapist',
    '225X00000X': 'Occupational Therapist',
    '235Z00000X': 'Speech-Language Pathologist',
    '363L00000X': 'Nurse Practitioner',
    '363A00000X': 'Physician Assistant',
    '163W00000X': 'Registered Nurse',
    '1223G0001X': 'General Practice Dentistry',
    '1223S0112X': 'Oral & Maxillofacial Surgery',
    '152W00000X': 'Optometrist',
    '282N00000X': 'General Acute Care Hospital',
    '261QM0850X': 'Adult Mental Health Clinic',
    '333600000X': 'Pharmacy',
  };

  return descriptions[code] || code;
}
