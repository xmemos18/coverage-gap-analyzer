/**
 * Healthcare Provider Services Module
 *
 * Exports provider lookup and search functionality.
 */

export {
  searchProviders,
  getProviderByNPI,
  searchProvidersByName,
  searchOrganizations,
  searchProvidersBySpecialty,
  validateNPIChecksum,
  getTaxonomyDescription,
  COMMON_TAXONOMIES,
  type Provider,
  type ProviderSearchParams,
  type NPPESProviderResult,
  type NPPESSearchResponse,
} from './nppes';
