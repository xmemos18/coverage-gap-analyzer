/**
 * CMS Hospital Compare Tests
 */

import {
  calculateQualityScore,
  getRatingDescription,
  HOSPITAL_TYPES,
  OWNERSHIP_TYPES,
  type Hospital,
  type CMSHospitalResult,
} from '../cms';

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

// Sample CMS Hospital result
const mockHospitalResult: CMSHospitalResult = {
  facility_id: '010001',
  facility_name: 'SOUTHEAST ALABAMA MEDICAL CENTER',
  address: '1108 ROSS CLARK CIRCLE',
  city: 'DOTHAN',
  state: 'AL',
  zip_code: '36301',
  county_name: 'HOUSTON',
  phone_number: '3347938701',
  hospital_type: 'Acute Care Hospitals',
  hospital_ownership: 'Government - Hospital District or Authority',
  emergency_services: 'Yes',
  meets_criteria_for_promoting_interoperability_of_ehrs: 'Y',
  hospital_overall_rating: '4',
  mortality_national_comparison: 'Same as the national average',
  safety_of_care_national_comparison: 'Above the national average',
  readmission_national_comparison: 'Same as the national average',
  patient_experience_national_comparison: 'Above the national average',
  effectiveness_of_care_national_comparison: 'Same as the national average',
  timeliness_of_care_national_comparison: 'Below the national average',
  efficient_use_of_medical_imaging_national_comparison: 'Same as the national average',
};

const mockLowRatedHospital: CMSHospitalResult = {
  facility_id: '010002',
  facility_name: 'LOW RATED HOSPITAL',
  address: '123 MAIN ST',
  city: 'ANYTOWN',
  state: 'AL',
  zip_code: '36302',
  county_name: 'HOUSTON',
  phone_number: '3345551234',
  hospital_type: 'Acute Care Hospitals',
  hospital_ownership: 'Proprietary',
  emergency_services: 'No',
  meets_criteria_for_promoting_interoperability_of_ehrs: 'N',
  hospital_overall_rating: '1',
  mortality_national_comparison: 'Below the national average',
  safety_of_care_national_comparison: 'Below the national average',
  readmission_national_comparison: 'Below the national average',
  patient_experience_national_comparison: 'Not Available',
  effectiveness_of_care_national_comparison: 'Below the national average',
  timeliness_of_care_national_comparison: 'Below the national average',
  efficient_use_of_medical_imaging_national_comparison: 'Not Available',
};

const mockUnratedHospital: CMSHospitalResult = {
  facility_id: '010003',
  facility_name: 'UNRATED HOSPITAL',
  address: '456 OAK AVE',
  city: 'SOMEWHERE',
  state: 'AL',
  zip_code: '36303',
  county_name: 'HOUSTON',
  phone_number: '3345559999',
  hospital_type: 'Critical Access Hospitals',
  hospital_ownership: 'Voluntary non-profit - Church',
  emergency_services: 'Yes',
  meets_criteria_for_promoting_interoperability_of_ehrs: 'Y',
  hospital_overall_rating: 'Not Available',
};

// Sample normalized hospital
const mockHospital: Hospital = {
  providerId: '010001',
  name: 'SOUTHEAST ALABAMA MEDICAL CENTER',
  address: {
    street: '1108 ROSS CLARK CIRCLE',
    city: 'DOTHAN',
    state: 'AL',
    zip: '36301',
    county: 'HOUSTON',
  },
  phone: '(334) 793-8701',
  type: 'Acute Care Hospitals',
  ownership: 'Government - Hospital District or Authority',
  hasEmergencyServices: true,
  overallRating: 4,
  ratings: {
    mortality: 'same',
    safetyOfCare: 'above',
    readmission: 'same',
    patientExperience: 'above',
    effectivenessOfCare: 'same',
    timelinessOfCare: 'below',
    efficientUseOfImaging: 'same',
  },
  meetsEHRCriteria: true,
};

describe('CMS Hospital Compare', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('calculateQualityScore', () => {
    it('should calculate quality score for well-rated hospital', () => {
      const score = calculateQualityScore(mockHospital);
      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return higher score for better ratings', () => {
      const excellentHospital: Hospital = {
        ...mockHospital,
        overallRating: 5,
        ratings: {
          mortality: 'above',
          safetyOfCare: 'above',
          readmission: 'above',
          patientExperience: 'above',
          effectivenessOfCare: 'above',
          timelinessOfCare: 'above',
          efficientUseOfImaging: 'above',
        },
      };

      const poorHospital: Hospital = {
        ...mockHospital,
        overallRating: 1,
        ratings: {
          mortality: 'below',
          safetyOfCare: 'below',
          readmission: 'below',
          patientExperience: 'below',
          effectivenessOfCare: 'below',
          timelinessOfCare: 'below',
          efficientUseOfImaging: 'below',
        },
      };

      const excellentScore = calculateQualityScore(excellentHospital);
      const poorScore = calculateQualityScore(poorHospital);

      expect(excellentScore).toBeGreaterThan(poorScore);
      expect(excellentScore).toBeGreaterThanOrEqual(80);
      expect(poorScore).toBeLessThan(30);
    });

    it('should handle unrated hospitals', () => {
      const unratedHospital: Hospital = {
        ...mockHospital,
        overallRating: null,
        ratings: {
          mortality: 'not_available',
          safetyOfCare: 'not_available',
          readmission: 'not_available',
          patientExperience: 'not_available',
          effectivenessOfCare: 'not_available',
          timelinessOfCare: 'not_available',
          efficientUseOfImaging: 'not_available',
        },
      };

      const score = calculateQualityScore(unratedHospital);
      expect(score).toBe(0);
    });

    it('should handle partially rated hospitals', () => {
      const partialHospital: Hospital = {
        ...mockHospital,
        overallRating: 3,
        ratings: {
          mortality: 'same',
          safetyOfCare: 'not_available',
          readmission: 'above',
          patientExperience: 'not_available',
          effectivenessOfCare: 'same',
          timelinessOfCare: 'not_available',
          efficientUseOfImaging: 'not_available',
        },
      };

      const score = calculateQualityScore(partialHospital);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getRatingDescription', () => {
    it('should return correct descriptions for star ratings', () => {
      expect(getRatingDescription(5)).toBe('Excellent (5 stars)');
      expect(getRatingDescription(4)).toBe('Very Good (4 stars)');
      expect(getRatingDescription(3)).toBe('Average (3 stars)');
      expect(getRatingDescription(2)).toBe('Below Average (2 stars)');
      expect(getRatingDescription(1)).toBe('Poor (1 star)');
    });

    it('should handle null rating', () => {
      expect(getRatingDescription(null)).toBe('Not rated');
    });

    it('should handle invalid rating', () => {
      expect(getRatingDescription(0)).toBe('Not rated');
      expect(getRatingDescription(6)).toBe('Not rated');
    });
  });

  describe('HOSPITAL_TYPES', () => {
    it('should have common hospital types', () => {
      expect(HOSPITAL_TYPES.acuteCare).toBe('Acute Care Hospitals');
      expect(HOSPITAL_TYPES.criticalAccess).toBe('Critical Access Hospitals');
      expect(HOSPITAL_TYPES.childrens).toBe("Children's");
      expect(HOSPITAL_TYPES.psychiatric).toBe('Psychiatric');
    });
  });

  describe('OWNERSHIP_TYPES', () => {
    it('should have common ownership types', () => {
      expect(OWNERSHIP_TYPES.governmentFederal).toBe('Government - Federal');
      expect(OWNERSHIP_TYPES.proprietary).toBe('Proprietary');
      expect(OWNERSHIP_TYPES.voluntaryChurch).toBe('Voluntary non-profit - Church');
    });
  });

  describe('searchHospitals', () => {
    let searchHospitals: typeof import('../cms').searchHospitals;

    beforeEach(async () => {
      jest.resetModules();
      const cmsModule = await import('../cms');
      searchHospitals = cmsModule.searchHospitals;
    });

    it('should search hospitals by state', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockHospitalResult]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      const result = await searchHospitals({ state: 'AL' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('state'),
        expect.any(Object)
      );
      expect(result.hospitals).toHaveLength(1);
      expect(result.hospitals[0].address.state).toBe('AL');
    });

    it('should search hospitals by city', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockHospitalResult]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      await searchHospitals({ city: 'DOTHAN', state: 'AL' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('city'),
        expect.any(Object)
      );
    });

    it('should search hospitals by ZIP code', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockHospitalResult]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      await searchHospitals({ zipCode: '36301' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('zip_code'),
        expect.any(Object)
      );
    });

    it('should search hospitals by name', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockHospitalResult]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      await searchHospitals({ name: 'SOUTHEAST' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('facility_name'),
        expect.any(Object)
      );
    });

    it('should filter by minimum rating', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockHospitalResult]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      await searchHospitals({ state: 'AL', minRating: 4 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('hospital_overall_rating'),
        expect.any(Object)
      );
    });

    it('should normalize hospital data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockHospitalResult]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      const result = await searchHospitals({ state: 'AL' });
      const hospital = result.hospitals[0];

      expect(hospital.providerId).toBe('010001');
      expect(hospital.name).toBe('SOUTHEAST ALABAMA MEDICAL CENTER');
      expect(hospital.address.city).toBe('DOTHAN');
      expect(hospital.overallRating).toBe(4);
      expect(hospital.hasEmergencyServices).toBe(true);
      expect(hospital.meetsEHRCriteria).toBe(true);
    });

    it('should parse comparison ratings correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockHospitalResult]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      const result = await searchHospitals({ state: 'AL' });
      const hospital = result.hospitals[0];

      expect(hospital.ratings.mortality).toBe('same');
      expect(hospital.ratings.safetyOfCare).toBe('above');
      expect(hospital.ratings.timelinessOfCare).toBe('below');
    });

    it('should format phone number', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockHospitalResult]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      const result = await searchHospitals({ state: 'AL' });
      const hospital = result.hospitals[0];

      expect(hospital.phone).toBe('(334) 793-8701');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchHospitals({ state: 'AL' })).rejects.toThrow('CMS API error');
    });

    it('should apply pagination parameters', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

      await searchHospitals({ state: 'AL', limit: 10, offset: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('$limit=10'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('$offset=20'),
        expect.any(Object)
      );
    });
  });

  describe('getHospitalById', () => {
    let getHospitalById: typeof import('../cms').getHospitalById;

    beforeEach(async () => {
      jest.resetModules();
      const cmsModule = await import('../cms');
      getHospitalById = cmsModule.getHospitalById;
    });

    it('should get hospital by provider ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockHospitalResult]),
      });

      const hospital = await getHospitalById('010001');

      expect(hospital).not.toBeNull();
      expect(hospital?.providerId).toBe('010001');
    });

    it('should return null for non-existent hospital', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const hospital = await getHospitalById('999999');

      expect(hospital).toBeNull();
    });

    it('should return null for 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const hospital = await getHospitalById('999999');

      expect(hospital).toBeNull();
    });
  });

  describe('searchHospitalsByLocation', () => {
    let searchHospitalsByLocation: typeof import('../cms').searchHospitalsByLocation;

    beforeEach(async () => {
      jest.resetModules();
      const cmsModule = await import('../cms');
      searchHospitalsByLocation = cmsModule.searchHospitalsByLocation;
    });

    it('should search by city and state', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockHospitalResult]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      const result = await searchHospitalsByLocation('DOTHAN', 'AL');

      expect(result.hospitals).toHaveLength(1);
    });
  });

  describe('searchHospitalsByZip', () => {
    let searchHospitalsByZip: typeof import('../cms').searchHospitalsByZip;

    beforeEach(async () => {
      jest.resetModules();
      const cmsModule = await import('../cms');
      searchHospitalsByZip = cmsModule.searchHospitalsByZip;
    });

    it('should search by ZIP code', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockHospitalResult]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      const result = await searchHospitalsByZip('36301');

      expect(result.hospitals).toHaveLength(1);
    });
  });

  describe('getTopRatedHospitals', () => {
    let getTopRatedHospitals: typeof import('../cms').getTopRatedHospitals;

    beforeEach(async () => {
      jest.resetModules();
      const cmsModule = await import('../cms');
      getTopRatedHospitals = cmsModule.getTopRatedHospitals;
    });

    it('should get top-rated hospitals in a state', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockHospitalResult]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      await getTopRatedHospitals('AL', 4);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('hospital_overall_rating'),
        expect.any(Object)
      );
    });
  });

  describe('Hospital normalization edge cases', () => {
    let searchHospitals: typeof import('../cms').searchHospitals;

    beforeEach(async () => {
      jest.resetModules();
      const cmsModule = await import('../cms');
      searchHospitals = cmsModule.searchHospitals;
    });

    it('should handle unrated hospitals', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockUnratedHospital]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      const result = await searchHospitals({ state: 'AL' });
      const hospital = result.hospitals[0];

      expect(hospital.overallRating).toBeNull();
    });

    it('should handle low-rated hospitals', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockLowRatedHospital]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      const result = await searchHospitals({ state: 'AL' });
      const hospital = result.hospitals[0];

      expect(hospital.overallRating).toBe(1);
      expect(hospital.hasEmergencyServices).toBe(false);
      expect(hospital.meetsEHRCriteria).toBe(false);
      expect(hospital.ratings.mortality).toBe('below');
    });

    it('should handle not available ratings', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockLowRatedHospital]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ count: '1' }]),
        });

      const result = await searchHospitals({ state: 'AL' });
      const hospital = result.hospitals[0];

      expect(hospital.ratings.patientExperience).toBe('not_available');
    });
  });
});
