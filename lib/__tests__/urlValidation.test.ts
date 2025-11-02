import {
  validateURLParameters,
  formatValidationErrors,
  getValidationSummary,
} from '../urlValidation';

describe('URL Validation', () => {
  describe('validateURLParameters', () => {
    it('should validate complete valid parameters', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL', 'NY'],
        numAdults: 2,
        adultAges: [45, 43],
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate with children', () => {
      const result = validateURLParameters({
        residenceZips: ['98101', '97201'],
        residenceStates: ['WA', 'OR'],
        numAdults: 2,
        adultAges: [35, 33],
        numChildren: 2,
        childAges: [5, 8],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate with 3 residences', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001', '85001'],
        residenceStates: ['FL', 'NY', 'AZ'],
        numAdults: 2,
        adultAges: [45, 43],
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: 'flexible',
      });

      expect(result.isValid).toBe(true);
    });

    it('should fail with fewer than 1 residence', () => {
      const result = validateURLParameters({
        residenceZips: [],
        residenceStates: [],
        numAdults: 2,
        adultAges: [45, 43],
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'residences',
          message: expect.stringContaining('At least 1 residence'),
        })
      );
    });

    it('should fail with mismatched residence counts', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL'], // Missing NY
        numAdults: 2,
        adultAges: [45, 43],
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'residences',
          message: expect.stringContaining('Mismatch'),
        })
      );
    });

    it('should fail with invalid ZIP code', () => {
      const result = validateURLParameters({
        residenceZips: ['123', '10001'], // Invalid ZIP
        residenceStates: ['FL', 'NY'],
        numAdults: 2,
        adultAges: [45, 43],
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'zip',
          message: expect.stringContaining('Primary residence ZIP code must be exactly 5 digits'),
        })
      );
    });

    it('should fail with invalid state code', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['ZZ', 'NY'], // Invalid state
        numAdults: 2,
        adultAges: [45, 43],
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'state',
          message: expect.stringContaining('invalid state code'),
        })
      );
    });

    it('should fail with zero adults', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL', 'NY'],
        numAdults: 0,
        adultAges: [],
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'adults',
          message: expect.stringContaining('At least 1 adult is required'),
        })
      );
    });

    it('should fail with too many adults', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL', 'NY'],
        numAdults: 15, // Exceeds max
        adultAges: Array(15).fill(45),
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'adults',
          message: expect.stringContaining('Too many adults'),
        })
      );
    });

    it('should fail with mismatched adult ages', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL', 'NY'],
        numAdults: 2,
        adultAges: [45], // Missing one age
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'adults',
          message: expect.stringContaining('doesn\'t match number of adults'),
        })
      );
    });

    it('should fail with invalid adult age (too young)', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL', 'NY'],
        numAdults: 2,
        adultAges: [15, 43], // 15 is too young for adult
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'age',
          message: expect.stringContaining('Adult 1 age (15) must be between 18 and 120'),
        })
      );
    });

    it('should fail with invalid adult age (too old)', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL', 'NY'],
        numAdults: 2,
        adultAges: [45, 150], // 150 exceeds max
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'age',
          message: expect.stringContaining('must be between 18 and 120'),
        })
      );
    });

    it('should fail with too many children', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL', 'NY'],
        numAdults: 2,
        adultAges: [45, 43],
        numChildren: 15, // Exceeds max
        childAges: Array(15).fill(10),
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'children',
          message: expect.stringContaining('Too many children'),
        })
      );
    });

    it('should fail with mismatched child ages', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL', 'NY'],
        numAdults: 2,
        adultAges: [45, 43],
        numChildren: 2,
        childAges: [5], // Missing one age
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'children',
          message: expect.stringContaining('doesn\'t match number of children'),
        })
      );
    });

    it('should fail with invalid child age', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL', 'NY'],
        numAdults: 2,
        adultAges: [45, 43],
        numChildren: 2,
        childAges: [5, 20], // 20 is too old for child
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '1000-2000',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'age',
          message: expect.stringContaining('Child 2 age (20) must be between 0 and 17'),
        })
      );
    });

    it('should warn with invalid budget but not fail', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL', 'NY'],
        numAdults: 2,
        adultAges: [45, 43],
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: 'invalid-budget',
      });

      expect(result.isValid).toBe(true); // Valid - budget warnings don't fail validation
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'budget',
          severity: 'warning',
        })
      );
    });

    it('should warn with missing budget but not fail', () => {
      const result = validateURLParameters({
        residenceZips: ['33101', '10001'],
        residenceStates: ['FL', 'NY'],
        numAdults: 2,
        adultAges: [45, 43],
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: false,
        hasCurrentInsurance: false,
        budget: '',
      });

      expect(result.isValid).toBe(true); // Valid - budget is optional
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'budget',
          severity: 'warning',
        })
      );
    });
  });

  describe('formatValidationErrors', () => {
    it('should format errors into user-friendly messages', () => {
      const result = {
        isValid: false,
        errors: [
          { field: 'zip', message: 'Primary residence ZIP code is invalid', severity: 'error' as const },
          { field: 'adults', message: 'At least 1 adult is required', severity: 'error' as const },
        ],
        warnings: [
          { field: 'budget', message: 'Budget preference is missing', severity: 'warning' as const },
        ],
      };

      const messages = formatValidationErrors(result);

      expect(messages).toContain('The following issues were found with the URL parameters:');
      expect(messages).toContain('• Primary residence ZIP code is invalid');
      expect(messages).toContain('• At least 1 adult is required');
      expect(messages).toContain('Warnings:');
      expect(messages).toContain('• Budget preference is missing');
    });

    it('should handle no errors', () => {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      const messages = formatValidationErrors(result);
      expect(messages).toHaveLength(0);
    });
  });

  describe('getValidationSummary', () => {
    it('should return success message for valid parameters', () => {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      const summary = getValidationSummary(result);
      expect(summary).toBe('All URL parameters are valid');
    });

    it('should return error count summary', () => {
      const result = {
        isValid: false,
        errors: [
          { field: 'zip', message: 'Invalid ZIP', severity: 'error' as const },
          { field: 'age', message: 'Invalid age', severity: 'error' as const },
        ],
        warnings: [],
      };

      const summary = getValidationSummary(result);
      expect(summary).toBe('Validation failed: 2 errors');
    });

    it('should return warning count summary', () => {
      const result = {
        isValid: false,
        errors: [],
        warnings: [
          { field: 'budget', message: 'Budget missing', severity: 'warning' as const },
        ],
      };

      const summary = getValidationSummary(result);
      expect(summary).toBe('Validation failed: 1 warning');
    });

    it('should return combined summary', () => {
      const result = {
        isValid: false,
        errors: [
          { field: 'zip', message: 'Invalid ZIP', severity: 'error' as const },
        ],
        warnings: [
          { field: 'budget', message: 'Budget missing', severity: 'warning' as const },
        ],
      };

      const summary = getValidationSummary(result);
      expect(summary).toBe('Validation failed: 1 error, 1 warning');
    });
  });
});
