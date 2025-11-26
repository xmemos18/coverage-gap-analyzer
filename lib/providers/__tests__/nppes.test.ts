/**
 * NPPES Provider Search Tests
 */

import {
  validateNPIChecksum,
  getTaxonomyDescription,
  COMMON_TAXONOMIES,
  type NPPESProviderResult,
} from '../nppes';

// Mock fetch for API tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Sample NPPES API response
const mockIndividualProvider: NPPESProviderResult = {
  created_epoch: 1230768000,
  enumeration_type: 'NPI-1',
  last_updated_epoch: 1640995200,
  number: '1234567893',
  addresses: [
    {
      country_code: 'US',
      country_name: 'United States',
      address_purpose: 'LOCATION',
      address_type: 'DOM',
      address_1: '123 Main St',
      address_2: 'Suite 100',
      city: 'New York',
      state: 'NY',
      postal_code: '10001-1234',
      telephone_number: '212-555-1234',
    },
    {
      country_code: 'US',
      country_name: 'United States',
      address_purpose: 'MAILING',
      address_type: 'DOM',
      address_1: 'PO Box 123',
      city: 'New York',
      state: 'NY',
      postal_code: '10001',
    },
  ],
  taxonomies: [
    {
      code: '207Q00000X',
      desc: 'Family Medicine',
      primary: true,
      state: 'NY',
      license: 'MD12345',
    },
    {
      code: '207R00000X',
      desc: 'Internal Medicine',
      primary: false,
    },
  ],
  basic: {
    first_name: 'John',
    last_name: 'Smith',
    middle_name: 'A',
    credential: 'MD',
    gender: 'M',
    sole_proprietor: 'NO',
    enumeration_date: '2009-01-01',
    last_updated: '2022-01-01',
    status: 'A',
    name_prefix: 'Dr.',
  },
};

const mockOrganizationProvider: NPPESProviderResult = {
  created_epoch: 1199145600,
  enumeration_type: 'NPI-2',
  last_updated_epoch: 1640995200,
  number: '1234567885',
  addresses: [
    {
      country_code: 'US',
      country_name: 'United States',
      address_purpose: 'LOCATION',
      address_type: 'DOM',
      address_1: '500 Hospital Drive',
      city: 'Los Angeles',
      state: 'CA',
      postal_code: '90001',
      telephone_number: '310-555-5000',
    },
  ],
  taxonomies: [
    {
      code: '282N00000X',
      desc: 'General Acute Care Hospital',
      primary: true,
    },
  ],
  basic: {
    organization_name: 'City General Hospital',
    organizational_subpart: 'NO',
    enumeration_date: '2008-01-01',
    last_updated: '2022-01-01',
    status: 'A',
  },
};

describe('NPPES Provider Search', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('validateNPIChecksum', () => {
    it('should return true for valid NPI with correct checksum', () => {
      // Valid NPIs (Luhn check with 80840 prefix)
      expect(validateNPIChecksum('1234567893')).toBe(true);
      expect(validateNPIChecksum('1234567885')).toBe(true);
    });

    it('should return false for invalid NPI checksum', () => {
      expect(validateNPIChecksum('1234567890')).toBe(false);
      expect(validateNPIChecksum('1234567891')).toBe(false);
      expect(validateNPIChecksum('1234567892')).toBe(false);
    });

    it('should return false for invalid NPI format', () => {
      expect(validateNPIChecksum('123456789')).toBe(false); // Too short
      expect(validateNPIChecksum('12345678901')).toBe(false); // Too long
      expect(validateNPIChecksum('123456789a')).toBe(false); // Non-numeric
      expect(validateNPIChecksum('')).toBe(false); // Empty
    });
  });

  describe('getTaxonomyDescription', () => {
    it('should return description for known taxonomy codes', () => {
      expect(getTaxonomyDescription('207Q00000X')).toBe('Family Medicine');
      expect(getTaxonomyDescription('207R00000X')).toBe('Internal Medicine');
      expect(getTaxonomyDescription('282N00000X')).toBe('General Acute Care Hospital');
    });

    it('should return the code itself for unknown taxonomy codes', () => {
      expect(getTaxonomyDescription('UNKNOWN123')).toBe('UNKNOWN123');
    });
  });

  describe('COMMON_TAXONOMIES', () => {
    it('should have common provider taxonomies', () => {
      expect(COMMON_TAXONOMIES.familyMedicine).toBe('207Q00000X');
      expect(COMMON_TAXONOMIES.internalMedicine).toBe('207R00000X');
      expect(COMMON_TAXONOMIES.cardiology).toBe('207RC0000X');
      expect(COMMON_TAXONOMIES.hospital).toBe('282N00000X');
    });
  });

  describe('searchProviders', () => {
    // Import functions after mocking
    let searchProviders: typeof import('../nppes').searchProviders;

    beforeEach(async () => {
      jest.resetModules();
      const nppesModule = await import('../nppes');
      searchProviders = nppesModule.searchProviders;
    });

    it('should search for providers by name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 1,
          results: [mockIndividualProvider],
        }),
      });

      const result = await searchProviders({
        firstName: 'John',
        lastName: 'Smith',
        state: 'NY',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('first_name=John'),
        expect.any(Object)
      );
      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].firstName).toBe('John');
      expect(result.providers[0].lastName).toBe('Smith');
    });

    it('should search for organizations by name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 1,
          results: [mockOrganizationProvider],
        }),
      });

      const result = await searchProviders({
        organizationName: 'City General Hospital',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('organization_name=City'),
        expect.any(Object)
      );
      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].type).toBe('organization');
      expect(result.providers[0].organizationName).toBe('City General Hospital');
    });

    it('should normalize individual provider data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 1,
          results: [mockIndividualProvider],
        }),
      });

      const result = await searchProviders({ npi: '1234567893' });
      const provider = result.providers[0];

      expect(provider.npi).toBe('1234567893');
      expect(provider.type).toBe('individual');
      expect(provider.name).toBe('Dr. John A Smith MD');
      expect(provider.primarySpecialty).toBe('Family Medicine');
      expect(provider.specialties).toHaveLength(2);
      expect(provider.addresses).toHaveLength(2);
    });

    it('should normalize organization provider data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 1,
          results: [mockOrganizationProvider],
        }),
      });

      const result = await searchProviders({ npi: '1234567885' });
      const provider = result.providers[0];

      expect(provider.npi).toBe('1234567885');
      expect(provider.type).toBe('organization');
      expect(provider.name).toBe('City General Hospital');
      expect(provider.primarySpecialty).toBe('General Acute Care Hospital');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchProviders({ state: 'NY' })).rejects.toThrow('NPPES API error');
    });

    it('should apply pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 100,
          results: [],
        }),
      });

      await searchProviders({
        state: 'NY',
        limit: 50,
        skip: 25,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('skip=25'),
        expect.any(Object)
      );
    });

    it('should truncate postal code to 5 digits', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 0,
          results: [],
        }),
      });

      await searchProviders({
        postalCode: '10001-1234',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('postal_code=10001'),
        expect.any(Object)
      );
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('postal_code=10001-1234'),
        expect.any(Object)
      );
    });
  });

  describe('getProviderByNPI', () => {
    let getProviderByNPI: typeof import('../nppes').getProviderByNPI;

    beforeEach(async () => {
      jest.resetModules();
      const nppesModule = await import('../nppes');
      getProviderByNPI = nppesModule.getProviderByNPI;
    });

    it('should return provider for valid NPI', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 1,
          results: [mockIndividualProvider],
        }),
      });

      const provider = await getProviderByNPI('1234567893');

      expect(provider).not.toBeNull();
      expect(provider?.npi).toBe('1234567893');
    });

    it('should return null for non-existent NPI', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 0,
          results: [],
        }),
      });

      const provider = await getProviderByNPI('1234567893');

      expect(provider).toBeNull();
    });

    it('should throw error for invalid NPI format', async () => {
      await expect(getProviderByNPI('123456789')).rejects.toThrow('Invalid NPI format');
      await expect(getProviderByNPI('12345678901')).rejects.toThrow('Invalid NPI format');
    });
  });

  describe('searchProvidersBySpecialty', () => {
    let searchProvidersBySpecialty: typeof import('../nppes').searchProvidersBySpecialty;

    beforeEach(async () => {
      jest.resetModules();
      const nppesModule = await import('../nppes');
      searchProvidersBySpecialty = nppesModule.searchProvidersBySpecialty;
    });

    it('should search by specialty name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 5,
          results: [mockIndividualProvider],
        }),
      });

      await searchProvidersBySpecialty('Family Medicine', 'NY');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('taxonomy_description=Family'),
        expect.any(Object)
      );
    });

    it('should include city in search', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 3,
          results: [],
        }),
      });

      await searchProvidersBySpecialty('Cardiology', 'NY', 'New York', 10);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('city=New'),
        expect.any(Object)
      );
    });
  });

  describe('searchOrganizations', () => {
    let searchOrganizations: typeof import('../nppes').searchOrganizations;

    beforeEach(async () => {
      jest.resetModules();
      const nppesModule = await import('../nppes');
      searchOrganizations = nppesModule.searchOrganizations;
    });

    it('should search for organizations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 2,
          results: [mockOrganizationProvider],
        }),
      });

      const result = await searchOrganizations('Hospital', 'CA');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('organization_name=Hospital'),
        expect.any(Object)
      );
      expect(result.providers).toHaveLength(1);
    });
  });

  describe('Provider normalization edge cases', () => {
    let searchProviders: typeof import('../nppes').searchProviders;

    beforeEach(async () => {
      jest.resetModules();
      const nppesModule = await import('../nppes');
      searchProviders = nppesModule.searchProviders;
    });

    it('should handle provider without middle name', async () => {
      const providerNoMiddle = {
        ...mockIndividualProvider,
        basic: {
          ...mockIndividualProvider.basic,
          middle_name: undefined,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 1,
          results: [providerNoMiddle],
        }),
      });

      const result = await searchProviders({ npi: '1234567893' });
      expect(result.providers[0].name).toBe('Dr. John Smith MD');
    });

    it('should handle provider without credential', async () => {
      const providerNoCredential = {
        ...mockIndividualProvider,
        basic: {
          ...mockIndividualProvider.basic,
          credential: undefined,
          name_prefix: undefined,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 1,
          results: [providerNoCredential],
        }),
      });

      const result = await searchProviders({ npi: '1234567893' });
      expect(result.providers[0].name).toBe('John A Smith');
    });

    it('should handle provider with no taxonomies', async () => {
      const providerNoTaxonomies = {
        ...mockIndividualProvider,
        taxonomies: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 1,
          results: [providerNoTaxonomies],
        }),
      });

      const result = await searchProviders({ npi: '1234567893' });
      expect(result.providers[0].primarySpecialty).toBe('Unknown');
      expect(result.providers[0].specialties).toHaveLength(0);
    });

    it('should handle organization without name', async () => {
      const orgNoName = {
        ...mockOrganizationProvider,
        basic: {
          ...mockOrganizationProvider.basic,
          organization_name: undefined,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result_count: 1,
          results: [orgNoName],
        }),
      });

      const result = await searchProviders({ npi: '1234567885' });
      expect(result.providers[0].name).toBe('Unknown Organization');
    });
  });
});
