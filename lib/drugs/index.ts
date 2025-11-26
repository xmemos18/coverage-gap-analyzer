/**
 * Drug Services Module
 *
 * Exports drug lookup and search functionality using FDA data.
 */

export {
  searchDrugs,
  searchDrugsByName,
  getDrugByNDC,
  searchNDCDirectory,
  getDrugInteractions,
  estimateDrugTier,
  DRUG_CATEGORIES,
  COMMON_GENERICS,
  type Drug,
  type DrugSearchParams,
  type FDADrugLabelResult,
  type FDADrugSearchResponse,
} from './fda';
