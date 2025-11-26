/**
 * FDA Drug API Tests
 */

import {
  estimateDrugTier,
  DRUG_CATEGORIES,
  COMMON_GENERICS,
  type Drug,
  type FDADrugLabelResult,
} from '../fda';

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

// Sample FDA API responses
const mockDrugLabelResult: FDADrugLabelResult = {
  openfda: {
    brand_name: ['Lipitor'],
    generic_name: ['Atorvastatin Calcium'],
    manufacturer_name: ['Pfizer Inc.'],
    product_ndc: ['0071-0155-23'],
    rxcui: ['83367'],
    pharm_class_epc: ['HMG-CoA Reductase Inhibitor [EPC]'],
    substance_name: ['ATORVASTATIN CALCIUM'],
    product_type: ['HUMAN PRESCRIPTION DRUG'],
    route: ['ORAL'],
  },
  purpose: ['Cholesterol lowering medication'],
  indications_and_usage: ['For the treatment of high cholesterol...'],
  dosage_and_administration: ['10-80mg once daily...'],
  warnings: ['May cause muscle pain...'],
  active_ingredient: ['Atorvastatin Calcium 10mg'],
  drug_interactions: ['Do not take with grapefruit juice...'],
};

const mockOTCDrugResult: FDADrugLabelResult = {
  openfda: {
    brand_name: ['Advil'],
    generic_name: ['Ibuprofen'],
    manufacturer_name: ['Pfizer Consumer Healthcare'],
    product_ndc: ['0573-0165-20'],
    pharm_class_epc: ['Nonsteroidal Anti-inflammatory Drug [EPC]'],
    product_type: ['HUMAN OTC DRUG'],
    route: ['ORAL'],
  },
  purpose: ['Pain reliever/fever reducer'],
};

const _mockSpecialtyDrugResult: FDADrugLabelResult = {
  openfda: {
    brand_name: ['Humira'],
    generic_name: ['Adalimumab'],
    manufacturer_name: ['AbbVie Inc.'],
    product_ndc: ['0074-9374-02'],
    pharm_class_epc: ['Tumor Necrosis Factor Blocker [EPC]', 'Immunosuppressant [EPC]'],
    product_type: ['HUMAN PRESCRIPTION DRUG'],
    route: ['SUBCUTANEOUS'],
  },
  purpose: ['Treatment of rheumatoid arthritis, psoriatic arthritis...'],
};

describe('FDA Drug API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('estimateDrugTier', () => {
    it('should classify generic drugs correctly', () => {
      const genericDrug: Drug = {
        brandNames: [],
        genericNames: ['Metformin'],
        activeIngredients: ['Metformin HCl 500mg'],
        manufacturers: ['Teva Pharmaceuticals'],
        ndcs: ['00093-1234-01'],
        rxcuis: ['12345'],
        drugClasses: ['Antidiabetic'],
        routes: ['ORAL'],
        productTypes: ['HUMAN PRESCRIPTION DRUG'],
      };

      expect(estimateDrugTier(genericDrug)).toBe('generic');
    });

    it('should classify OTC drugs as generic tier', () => {
      const otcDrug: Drug = {
        brandNames: ['Advil'],
        genericNames: ['Ibuprofen'],
        activeIngredients: ['Ibuprofen 200mg'],
        manufacturers: ['Pfizer Consumer Healthcare'],
        ndcs: ['0573-0165-20'],
        rxcuis: [],
        drugClasses: ['Nonsteroidal Anti-inflammatory Drug'],
        routes: ['ORAL'],
        productTypes: ['HUMAN OTC DRUG'],
      };

      expect(estimateDrugTier(otcDrug)).toBe('generic');
    });

    it('should classify specialty drugs correctly', () => {
      const specialtyDrug: Drug = {
        brandNames: ['Humira'],
        genericNames: ['Adalimumab'],
        activeIngredients: ['Adalimumab 40mg'],
        manufacturers: ['AbbVie Inc.'],
        ndcs: ['0074-9374-02'],
        rxcuis: [],
        drugClasses: ['Tumor Necrosis Factor Blocker', 'Immunosuppressant'],
        routes: ['SUBCUTANEOUS'],
        productTypes: ['HUMAN PRESCRIPTION DRUG'],
      };

      expect(estimateDrugTier(specialtyDrug)).toBe('specialty');
    });

    it('should classify injectable drugs as specialty', () => {
      const injectableDrug: Drug = {
        brandNames: ['Enbrel'],
        genericNames: ['Etanercept'],
        activeIngredients: ['Etanercept 50mg'],
        manufacturers: ['Amgen Inc.'],
        ndcs: ['58406-0435-01'],
        rxcuis: [],
        drugClasses: ['Immunomodulator'],
        routes: ['INJECTION'],
        productTypes: ['HUMAN PRESCRIPTION DRUG'],
      };

      expect(estimateDrugTier(injectableDrug)).toBe('specialty');
    });

    it('should classify brand drugs as preferred-brand', () => {
      const brandDrug: Drug = {
        brandNames: ['Lipitor'],
        genericNames: ['Atorvastatin'],
        activeIngredients: ['Atorvastatin Calcium 10mg'],
        manufacturers: ['Pfizer Inc.'],
        ndcs: ['0071-0155-23'],
        rxcuis: [],
        drugClasses: ['HMG-CoA Reductase Inhibitor'],
        routes: ['ORAL'],
        productTypes: ['HUMAN PRESCRIPTION DRUG'],
      };

      expect(estimateDrugTier(brandDrug)).toBe('preferred-brand');
    });

    it('should classify common generics correctly', () => {
      const commonGeneric: Drug = {
        brandNames: [],
        genericNames: ['Lisinopril'],
        activeIngredients: ['Lisinopril 10mg'],
        manufacturers: ['Generic Manufacturer'],
        ndcs: ['12345-6789-01'],
        rxcuis: [],
        drugClasses: ['ACE Inhibitor'],
        routes: ['ORAL'],
        productTypes: ['HUMAN PRESCRIPTION DRUG'],
      };

      expect(estimateDrugTier(commonGeneric)).toBe('generic');
    });
  });

  describe('DRUG_CATEGORIES', () => {
    it('should have common drug categories', () => {
      expect(DRUG_CATEGORIES.bloodPressure).toBe('Antihypertensive');
      expect(DRUG_CATEGORIES.cholesterol).toBe('Antilipemic');
      expect(DRUG_CATEGORIES.diabetesOral).toBe('Antidiabetic');
      expect(DRUG_CATEGORIES.antidepressant).toBe('Antidepressant');
    });
  });

  describe('COMMON_GENERICS', () => {
    it('should have brand name mappings for common generics', () => {
      expect(COMMON_GENERICS.lisinopril).toContain('Prinivil');
      expect(COMMON_GENERICS.atorvastatin).toContain('Lipitor');
      expect(COMMON_GENERICS.metformin).toContain('Glucophage');
      expect(COMMON_GENERICS.sertraline).toContain('Zoloft');
    });
  });

  describe('searchDrugs', () => {
    let searchDrugs: typeof import('../fda').searchDrugs;

    beforeEach(async () => {
      jest.resetModules();
      const fdaModule = await import('../fda');
      searchDrugs = fdaModule.searchDrugs;
    });

    it('should search drugs by name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: {
            disclaimer: 'test',
            terms: 'test',
            license: 'test',
            last_updated: '2024-01-01',
            results: { skip: 0, limit: 20, total: 1 },
          },
          results: [mockDrugLabelResult],
        }),
      });

      const result = await searchDrugs({ name: 'lipitor' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search='),
        expect.any(Object)
      );
      expect(result.drugs).toHaveLength(1);
      expect(result.drugs[0].brandNames).toContain('Lipitor');
    });

    it('should search drugs by brand name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: {
            results: { skip: 0, limit: 20, total: 1 },
          },
          results: [mockDrugLabelResult],
        }),
      });

      await searchDrugs({ brandName: 'Lipitor' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('brand_name'),
        expect.any(Object)
      );
    });

    it('should search drugs by generic name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: {
            results: { skip: 0, limit: 20, total: 1 },
          },
          results: [mockDrugLabelResult],
        }),
      });

      await searchDrugs({ genericName: 'Atorvastatin' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generic_name'),
        expect.any(Object)
      );
    });

    it('should return empty array for 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await searchDrugs({ name: 'nonexistent' });

      expect(result.drugs).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should throw error for other API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchDrugs({ name: 'test' })).rejects.toThrow('FDA API error');
    });

    it('should require at least one search parameter', async () => {
      await expect(searchDrugs({})).rejects.toThrow('At least one search parameter is required');
    });

    it('should normalize drug label data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: { results: { skip: 0, limit: 20, total: 1 } },
          results: [mockDrugLabelResult],
        }),
      });

      const result = await searchDrugs({ name: 'lipitor' });
      const drug = result.drugs[0];

      expect(drug.brandNames).toContain('Lipitor');
      expect(drug.genericNames).toContain('Atorvastatin Calcium');
      expect(drug.manufacturers).toContain('Pfizer Inc.');
      expect(drug.drugClasses).toContain('HMG-CoA Reductase Inhibitor [EPC]');
      expect(drug.routes).toContain('ORAL');
    });

    it('should apply pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: { results: { skip: 20, limit: 10, total: 100 } },
          results: [],
        }),
      });

      await searchDrugs({ name: 'test', limit: 10, skip: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('skip=20'),
        expect.any(Object)
      );
    });
  });

  describe('searchDrugsByName', () => {
    let searchDrugsByName: typeof import('../fda').searchDrugsByName;

    beforeEach(async () => {
      jest.resetModules();
      const fdaModule = await import('../fda');
      searchDrugsByName = fdaModule.searchDrugsByName;
    });

    it('should search by name with simplified interface', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: { results: { skip: 0, limit: 20, total: 1 } },
          results: [mockOTCDrugResult],
        }),
      });

      const result = await searchDrugsByName('Advil');

      expect(result.drugs).toHaveLength(1);
      expect(result.drugs[0].brandNames).toContain('Advil');
    });
  });

  describe('getDrugByNDC', () => {
    let getDrugByNDC: typeof import('../fda').getDrugByNDC;

    beforeEach(async () => {
      jest.resetModules();
      const fdaModule = await import('../fda');
      getDrugByNDC = fdaModule.getDrugByNDC;
    });

    it('should look up drug by NDC code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: { results: { skip: 0, limit: 1, total: 1 } },
          results: [mockDrugLabelResult],
        }),
      });

      const drug = await getDrugByNDC('0071-0155-23');

      expect(drug).not.toBeNull();
      expect(drug?.ndcs).toContain('0071-0155-23');
    });

    it('should normalize NDC format with dashes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: { results: { skip: 0, limit: 1, total: 1 } },
          results: [mockDrugLabelResult],
        }),
      });

      await getDrugByNDC('0071-0155-23');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('007101552'),
        expect.any(Object)
      );
    });

    it('should return null for non-existent NDC', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const drug = await getDrugByNDC('0000-0000-00');

      expect(drug).toBeNull();
    });
  });

  describe('getDrugInteractions', () => {
    let getDrugInteractions: typeof import('../fda').getDrugInteractions;

    beforeEach(async () => {
      jest.resetModules();
      const fdaModule = await import('../fda');
      getDrugInteractions = fdaModule.getDrugInteractions;
    });

    it('should get drug interactions and warnings', async () => {
      // First call for searchDrugs
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: { results: { skip: 0, limit: 1, total: 1 } },
          results: [mockDrugLabelResult],
        }),
      });
      // Second call for detailed label info
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: { results: { skip: 0, limit: 1, total: 1 } },
          results: [mockDrugLabelResult],
        }),
      });

      const result = await getDrugInteractions('Lipitor');

      expect(result.interactions).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });

    it('should return empty arrays for non-existent drug', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await getDrugInteractions('nonexistent');

      expect(result.interactions).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('searchNDCDirectory', () => {
    let searchNDCDirectory: typeof import('../fda').searchNDCDirectory;

    beforeEach(async () => {
      jest.resetModules();
      const fdaModule = await import('../fda');
      searchNDCDirectory = fdaModule.searchNDCDirectory;
    });

    it('should search NDC directory', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: { results: { skip: 0, limit: 20, total: 1 } },
          results: [{
            product_ndc: '0071-0155-23',
            generic_name: 'Atorvastatin Calcium',
            labeler_name: 'Pfizer Inc.',
            brand_name: 'Lipitor',
            active_ingredients: [{ name: 'Atorvastatin Calcium', strength: '10mg' }],
            finished: true,
            packaging: [{ package_ndc: '0071-0155-23', description: '90 tablets' }],
            dosage_form: 'TABLET',
            route: ['ORAL'],
            marketing_category: 'NDA',
          }],
        }),
      });

      const result = await searchNDCDirectory({ name: 'Lipitor' });

      expect(result.drugs).toHaveLength(1);
      expect(result.drugs[0].brandNames).toContain('Lipitor');
    });

    it('should require at least one search parameter', async () => {
      await expect(searchNDCDirectory({})).rejects.toThrow('At least one search parameter is required');
    });
  });

  describe('Drug normalization edge cases', () => {
    let searchDrugs: typeof import('../fda').searchDrugs;

    beforeEach(async () => {
      jest.resetModules();
      const fdaModule = await import('../fda');
      searchDrugs = fdaModule.searchDrugs;
    });

    it('should handle missing openfda fields', async () => {
      const incompleteResult: FDADrugLabelResult = {
        purpose: ['Test purpose'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: { results: { skip: 0, limit: 20, total: 1 } },
          results: [incompleteResult],
        }),
      });

      const result = await searchDrugs({ name: 'test' });
      const drug = result.drugs[0];

      expect(drug.brandNames).toHaveLength(0);
      expect(drug.genericNames).toHaveLength(0);
      expect(drug.manufacturers).toHaveLength(0);
    });

    it('should use indications_and_usage when purpose is missing', async () => {
      const noPurposeResult: FDADrugLabelResult = {
        openfda: {
          brand_name: ['TestDrug'],
        },
        indications_and_usage: ['Used for testing purposes'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: { results: { skip: 0, limit: 20, total: 1 } },
          results: [noPurposeResult],
        }),
      });

      const result = await searchDrugs({ name: 'test' });
      const drug = result.drugs[0];

      expect(drug.purpose).toBe('Used for testing purposes');
    });

    it('should use substance_name when active_ingredient is missing', async () => {
      const noActiveResult: FDADrugLabelResult = {
        openfda: {
          brand_name: ['TestDrug'],
          substance_name: ['Test Substance'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          meta: { results: { skip: 0, limit: 20, total: 1 } },
          results: [noActiveResult],
        }),
      });

      const result = await searchDrugs({ name: 'test' });
      const drug = result.drugs[0];

      expect(drug.activeIngredients).toContain('Test Substance');
    });
  });
});
