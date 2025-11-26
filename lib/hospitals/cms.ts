/**
 * CMS Hospital Compare API Integration
 *
 * Provides hospital quality ratings and information using CMS data.
 * API Documentation: https://data.cms.gov/provider-data/
 */

import { logger } from '@/lib/logger';

// CMS Data API Base URL
const CMS_DATA_API = 'https://data.cms.gov/provider-data/api/1';

// Dataset identifiers for Hospital Compare
const DATASETS = {
  hospitalGeneralInfo: 'xubh-q36u', // Hospital General Information
  patientSurvey: 'dgck-syfz', // Patient Survey (HCAHPS)
  timely: 'yv7e-xc69', // Timely and Effective Care
  complications: 'ynj2-r877', // Complications and Deaths
  readmissions: '9n3s-kdb3', // Unplanned Hospital Visits
  paymentValue: 'fi9v-xdn2', // Payment and Value of Care
};

// Types for CMS Hospital Data
export interface CMSHospitalResult {
  facility_id: string;
  facility_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county_name: string;
  phone_number: string;
  hospital_type: string;
  hospital_ownership: string;
  emergency_services: string;
  meets_criteria_for_promoting_interoperability_of_ehrs: string;
  hospital_overall_rating: string;
  hospital_overall_rating_footnote?: string;
  mortality_national_comparison?: string;
  safety_of_care_national_comparison?: string;
  readmission_national_comparison?: string;
  patient_experience_national_comparison?: string;
  effectiveness_of_care_national_comparison?: string;
  timeliness_of_care_national_comparison?: string;
  efficient_use_of_medical_imaging_national_comparison?: string;
}

export interface CMSSearchResponse {
  results: CMSHospitalResult[];
  offset: number;
  limit: number;
  total: number;
}

// Normalized Hospital type for application use
export interface Hospital {
  /** CMS Provider ID */
  providerId: string;
  /** Hospital name */
  name: string;
  /** Full address */
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    county: string;
  };
  /** Phone number */
  phone: string;
  /** Hospital type (e.g., Acute Care, Critical Access) */
  type: string;
  /** Ownership type (Government, Proprietary, Voluntary non-profit) */
  ownership: string;
  /** Has emergency services */
  hasEmergencyServices: boolean;
  /** Overall star rating (1-5, or null if not rated) */
  overallRating: number | null;
  /** Quality ratings by category */
  ratings: {
    mortality: ComparisonRating;
    safetyOfCare: ComparisonRating;
    readmission: ComparisonRating;
    patientExperience: ComparisonRating;
    effectivenessOfCare: ComparisonRating;
    timelinessOfCare: ComparisonRating;
    efficientUseOfImaging: ComparisonRating;
  };
  /** EHR interoperability */
  meetsEHRCriteria: boolean;
}

export type ComparisonRating = 'above' | 'same' | 'below' | 'not_available';

export interface HospitalSearchParams {
  /** Hospital name or partial name */
  name?: string;
  /** City name */
  city?: string;
  /** State code (2-letter) */
  state?: string;
  /** ZIP code */
  zipCode?: string;
  /** Hospital type filter */
  type?: string;
  /** Minimum star rating */
  minRating?: number;
  /** Maximum results */
  limit?: number;
  /** Results offset */
  offset?: number;
}

/**
 * Search for hospitals using CMS Hospital Compare data
 */
export async function searchHospitals(
  params: HospitalSearchParams
): Promise<{ hospitals: Hospital[]; totalCount: number }> {
  try {
    // Build query filters
    const filters: string[] = [];

    if (params.name) {
      filters.push(`facility_name LIKE '%${escapeSODA(params.name.toUpperCase())}%'`);
    }
    if (params.city) {
      filters.push(`city = '${escapeSODA(params.city.toUpperCase())}'`);
    }
    if (params.state) {
      filters.push(`state = '${escapeSODA(params.state.toUpperCase())}'`);
    }
    if (params.zipCode) {
      filters.push(`zip_code LIKE '${escapeSODA(params.zipCode.substring(0, 5))}%'`);
    }
    if (params.type) {
      filters.push(`hospital_type = '${escapeSODA(params.type)}'`);
    }
    if (params.minRating && params.minRating > 0) {
      filters.push(`hospital_overall_rating >= '${params.minRating}'`);
    }

    // Build the SODA query URL
    const limit = Math.min(params.limit || 20, 100);
    const offset = params.offset || 0;

    let url = `${CMS_DATA_API}/${DATASETS.hospitalGeneralInfo}/data.json?$limit=${limit}&$offset=${offset}`;

    if (filters.length > 0) {
      const whereClause = filters.join(' AND ');
      url += `&$where=${encodeURIComponent(whereClause)}`;
    }

    url += '&$order=hospital_overall_rating DESC,facility_name ASC';

    logger.info('[CMS Hospital] Searching hospitals', { params, url });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CMS API error: ${response.status} ${response.statusText}`);
    }

    const data: CMSHospitalResult[] = await response.json();

    // Normalize results
    const hospitals = data.map(normalizeHospital);

    // Get total count (make separate query)
    let totalCount = hospitals.length;
    if (filters.length > 0) {
      try {
        const countUrl = `${CMS_DATA_API}/${DATASETS.hospitalGeneralInfo}/data.json?$select=count(*)&$where=${encodeURIComponent(filters.join(' AND '))}`;
        const countResponse = await fetch(countUrl);
        if (countResponse.ok) {
          const countData = await countResponse.json();
          totalCount = parseInt(countData[0]?.count || '0', 10);
        }
      } catch {
        // Fallback to results length if count fails
        totalCount = hospitals.length >= limit ? limit + offset + 1 : hospitals.length + offset;
      }
    }

    return {
      hospitals,
      totalCount,
    };
  } catch (error) {
    logger.error('[CMS Hospital] Search error', {
      error: error instanceof Error ? error.message : String(error),
      params,
    });
    throw error;
  }
}

/**
 * Get a single hospital by CMS Provider ID
 */
export async function getHospitalById(providerId: string): Promise<Hospital | null> {
  try {
    const url = `${CMS_DATA_API}/${DATASETS.hospitalGeneralInfo}/data.json?facility_id=${encodeURIComponent(providerId)}`;

    logger.info('[CMS Hospital] Looking up hospital', { providerId });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`CMS API error: ${response.status} ${response.statusText}`);
    }

    const data: CMSHospitalResult[] = await response.json();
    const hospital = data[0];

    if (!hospital) {
      return null;
    }

    return normalizeHospital(hospital);
  } catch (error) {
    logger.error('[CMS Hospital] Lookup error', {
      error: error instanceof Error ? error.message : String(error),
      providerId,
    });
    throw error;
  }
}

/**
 * Search hospitals by location (city and state)
 */
export async function searchHospitalsByLocation(
  city: string,
  state: string,
  limit: number = 20
): Promise<{ hospitals: Hospital[]; totalCount: number }> {
  return searchHospitals({ city, state, limit });
}

/**
 * Search hospitals by ZIP code
 */
export async function searchHospitalsByZip(
  zipCode: string,
  limit: number = 20
): Promise<{ hospitals: Hospital[]; totalCount: number }> {
  return searchHospitals({ zipCode, limit });
}

/**
 * Get top-rated hospitals in a state
 */
export async function getTopRatedHospitals(
  state: string,
  minRating: number = 4,
  limit: number = 10
): Promise<{ hospitals: Hospital[]; totalCount: number }> {
  return searchHospitals({
    state,
    minRating,
    limit,
  });
}

/**
 * Normalize CMS Hospital data to our Hospital type
 */
function normalizeHospital(result: CMSHospitalResult): Hospital {
  return {
    providerId: result.facility_id,
    name: result.facility_name,
    address: {
      street: result.address,
      city: result.city,
      state: result.state,
      zip: result.zip_code,
      county: result.county_name,
    },
    phone: formatPhoneNumber(result.phone_number),
    type: result.hospital_type,
    ownership: result.hospital_ownership,
    hasEmergencyServices: result.emergency_services?.toUpperCase() === 'YES',
    overallRating: parseStarRating(result.hospital_overall_rating),
    ratings: {
      mortality: parseComparisonRating(result.mortality_national_comparison),
      safetyOfCare: parseComparisonRating(result.safety_of_care_national_comparison),
      readmission: parseComparisonRating(result.readmission_national_comparison),
      patientExperience: parseComparisonRating(result.patient_experience_national_comparison),
      effectivenessOfCare: parseComparisonRating(result.effectiveness_of_care_national_comparison),
      timelinessOfCare: parseComparisonRating(result.timeliness_of_care_national_comparison),
      efficientUseOfImaging: parseComparisonRating(result.efficient_use_of_medical_imaging_national_comparison),
    },
    meetsEHRCriteria: result.meets_criteria_for_promoting_interoperability_of_ehrs === 'Y',
  };
}

/**
 * Parse star rating from string
 */
function parseStarRating(rating: string | undefined): number | null {
  if (!rating || rating === 'Not Available') {
    return null;
  }
  const parsed = parseInt(rating, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse comparison rating from CMS format
 */
function parseComparisonRating(comparison: string | undefined): ComparisonRating {
  if (!comparison) {
    return 'not_available';
  }

  const lower = comparison.toLowerCase();
  if (lower.includes('above') || lower.includes('better')) {
    return 'above';
  }
  if (lower.includes('below') || lower.includes('worse')) {
    return 'below';
  }
  if (lower.includes('same') || lower.includes('no different')) {
    return 'same';
  }
  return 'not_available';
}

/**
 * Format phone number
 */
function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) return '';
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Escape special characters for SODA query
 */
function escapeSODA(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Hospital types available in CMS data
 */
export const HOSPITAL_TYPES = {
  acuteCare: 'Acute Care Hospitals',
  criticalAccess: 'Critical Access Hospitals',
  childrens: "Children's",
  psychiatric: 'Psychiatric',
  acuteCareVA: 'Acute Care - Department of Defense',
};

/**
 * Hospital ownership types
 */
export const OWNERSHIP_TYPES = {
  governmentFederal: 'Government - Federal',
  governmentState: 'Government - State',
  governmentLocal: 'Government - Local',
  governmentHospitalDistrict: 'Government - Hospital District or Authority',
  proprietary: 'Proprietary',
  voluntaryChurch: 'Voluntary non-profit - Church',
  voluntaryOther: 'Voluntary non-profit - Other',
  voluntaryPrivate: 'Voluntary non-profit - Private',
  tribal: 'Tribal',
};

/**
 * Calculate quality score from ratings (0-100 scale)
 */
export function calculateQualityScore(hospital: Hospital): number {
  let totalScore = 0;
  let maxScore = 0;

  // Overall rating (weighted at 50% of total)
  if (hospital.overallRating !== null) {
    totalScore += hospital.overallRating * 10; // 10 points per star (max 50)
    maxScore += 50;
  }

  // Individual category ratings (each worth ~7% for remaining 50%)
  const categories: (keyof Hospital['ratings'])[] = [
    'mortality',
    'safetyOfCare',
    'readmission',
    'patientExperience',
    'effectivenessOfCare',
    'timelinessOfCare',
    'efficientUseOfImaging',
  ];

  for (const category of categories) {
    const rating = hospital.ratings[category];
    if (rating !== 'not_available') {
      switch (rating) {
        case 'above':
          totalScore += 7;
          break;
        case 'same':
          totalScore += 4;
          break;
        case 'below':
          totalScore += 0;
          break;
      }
      maxScore += 7;
    }
  }

  // Calculate percentage
  if (maxScore === 0) return 0;
  return Math.min(100, Math.round((totalScore / maxScore) * 100));
}

/**
 * Get rating description
 */
export function getRatingDescription(rating: number | null): string {
  if (rating === null) return 'Not rated';
  if (rating === 5) return 'Excellent (5 stars)';
  if (rating === 4) return 'Very Good (4 stars)';
  if (rating === 3) return 'Average (3 stars)';
  if (rating === 2) return 'Below Average (2 stars)';
  if (rating === 1) return 'Poor (1 star)';
  return 'Not rated';
}
