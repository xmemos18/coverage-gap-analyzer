/**
 * Hospital Services Module
 *
 * Exports hospital lookup and quality rating functionality.
 */

export {
  searchHospitals,
  getHospitalById,
  searchHospitalsByLocation,
  searchHospitalsByZip,
  getTopRatedHospitals,
  calculateQualityScore,
  getRatingDescription,
  HOSPITAL_TYPES,
  OWNERSHIP_TYPES,
  type Hospital,
  type HospitalSearchParams,
  type ComparisonRating,
  type CMSHospitalResult,
} from './cms';
