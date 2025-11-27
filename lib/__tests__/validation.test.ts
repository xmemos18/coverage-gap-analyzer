import {
  sanitizeTextInput,
  validateZipCode,
  validateAdultAge,
  validateChildAge,
  sanitizeNumericInput,
  validateMonetaryAmount,
  validateResidenceTimeDistribution,
  validateIncomeRange,
} from '../validation';

describe('Validation Utilities', () => {
  describe('sanitizeTextInput', () => {
    it('should remove HTML tags', () => {
      // DOMPurify strips HTML tags but keeps text content
      expect(sanitizeTextInput('<script>alert("xss")</script>')).toBe('');
    });

    it('should handle javascript: protocol in plain text', () => {
      // For plain text (not HTML), DOMPurify keeps the content as-is
      expect(sanitizeTextInput('javascript:alert(1)')).toBe('javascript:alert(1)');
    });

    it('should handle inline event handlers in plain text', () => {
      // For plain text (not HTML), DOMPurify keeps the content as-is
      expect(sanitizeTextInput('test onclick=alert(1)')).toBe('test onclick=alert(1)');
    });

    it('should trim whitespace', () => {
      expect(sanitizeTextInput('  hello world  ')).toBe('hello world');
    });

    it('should limit length to 200 characters', () => {
      const longString = 'a'.repeat(300);
      expect(sanitizeTextInput(longString)).toHaveLength(200);
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeTextInput('')).toBe('');
    });
  });

  describe('validateZipCode', () => {
    it('should validate correct 5-digit ZIP', () => {
      const result = validateZipCode('12345');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('12345');
    });

    it('should sanitize non-numeric characters', () => {
      const result = validateZipCode('123-45');
      expect(result.sanitized).toBe('12345');
      expect(result.isValid).toBe(true);
    });

    it('should reject short ZIPs', () => {
      const result = validateZipCode('123');
      expect(result.isValid).toBe(false);
    });

    it('should truncate to 5 digits', () => {
      const result = validateZipCode('123456789');
      expect(result.sanitized).toBe('12345');
    });

    it('should reject obviously invalid ZIP 00000', () => {
      const result = validateZipCode('00000');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid ZIP code');
    });

    it('should reject invalid repeating-digit ZIP codes', () => {
      // 66666, 77777, 88888, 99999 are not valid US ZIP codes
      const result66666 = validateZipCode('66666');
      expect(result66666.isValid).toBe(false);
      expect(result66666.error).toBe('Invalid ZIP code');

      const result77777 = validateZipCode('77777');
      expect(result77777.isValid).toBe(false);
      expect(result77777.error).toBe('Invalid ZIP code');
    });

    it('should accept valid repeating-digit ZIP codes', () => {
      // These are all real USPS ZIP codes:
      // 11111 - Floral Park, NY
      // 22222 - Arlington, VA
      // 33333 - Fort Lauderdale, FL
      // 44444 - Newton Falls, OH
      // 55555 - Young America, MN
      const validRepeatingZips = ['11111', '22222', '33333', '44444', '55555'];

      for (const zip of validRepeatingZips) {
        const result = validateZipCode(zip);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(zip);
      }
    });
  });

  describe('validateAdultAge', () => {
    it('should accept valid adult ages', () => {
      expect(validateAdultAge(18)).toBe(true);
      expect(validateAdultAge(50)).toBe(true);
      expect(validateAdultAge(100)).toBe(true);
      expect(validateAdultAge(120)).toBe(true);
    });

    it('should reject ages below 18', () => {
      expect(validateAdultAge(17)).toBe(false);
      expect(validateAdultAge(0)).toBe(false);
    });

    it('should reject ages above 120', () => {
      expect(validateAdultAge(121)).toBe(false);
    });

    it('should reject non-integer ages', () => {
      expect(validateAdultAge(25.5)).toBe(false);
    });
  });

  describe('validateChildAge', () => {
    it('should accept valid child ages', () => {
      expect(validateChildAge(0)).toBe(true);
      expect(validateChildAge(10)).toBe(true);
      expect(validateChildAge(17)).toBe(true);
    });

    it('should reject ages below 0', () => {
      expect(validateChildAge(-1)).toBe(false);
    });

    it('should reject ages above 17', () => {
      expect(validateChildAge(18)).toBe(false);
    });
  });

  describe('sanitizeNumericInput', () => {
    it('should sanitize valid numbers', () => {
      expect(sanitizeNumericInput(123.45)).toBe(123.45);
      expect(sanitizeNumericInput('123.45')).toBe(123.45);
    });

    it('should clamp to min/max range', () => {
      expect(sanitizeNumericInput(5, 10, 20)).toBe(10);
      expect(sanitizeNumericInput(25, 10, 20)).toBe(20);
      expect(sanitizeNumericInput(15, 10, 20)).toBe(15);
    });

    it('should round to 2 decimal places', () => {
      expect(sanitizeNumericInput(123.456)).toBe(123.46);
    });

    it('should return null for invalid input', () => {
      expect(sanitizeNumericInput('invalid')).toBe(null);
      expect(sanitizeNumericInput(NaN)).toBe(null);
      expect(sanitizeNumericInput(Infinity)).toBe(null);
    });
  });

  describe('validateMonetaryAmount', () => {
    it('should accept valid amounts', () => {
      expect(validateMonetaryAmount(0)).toBe(true);
      expect(validateMonetaryAmount(500.50)).toBe(true);
      expect(validateMonetaryAmount(1000000)).toBe(true);
    });

    it('should reject negative amounts', () => {
      expect(validateMonetaryAmount(-1)).toBe(false);
    });

    it('should reject amounts over $1M', () => {
      expect(validateMonetaryAmount(1000001)).toBe(false);
    });

    it('should reject non-finite numbers', () => {
      expect(validateMonetaryAmount(Infinity)).toBe(false);
      expect(validateMonetaryAmount(NaN)).toBe(false);
    });
  });

  describe('validateResidenceTimeDistribution', () => {
    it('should accept valid time distribution (12 months total)', () => {
      const residences = [
        { monthsPerYear: 6 },
        { monthsPerYear: 6 },
      ];
      const result = validateResidenceTimeDistribution(residences);
      expect(result.isValid).toBe(true);
      expect(result.totalMonths).toBe(12);
    });

    it('should accept time distribution less than 12 months', () => {
      const residences = [
        { monthsPerYear: 5 },
        { monthsPerYear: 4 },
      ];
      const result = validateResidenceTimeDistribution(residences);
      expect(result.isValid).toBe(true);
      expect(result.totalMonths).toBe(9);
    });

    it('should reject time distribution exceeding 12 months', () => {
      const residences = [
        { monthsPerYear: 8 },
        { monthsPerYear: 6 },
      ];
      const result = validateResidenceTimeDistribution(residences);
      expect(result.isValid).toBe(false);
      expect(result.totalMonths).toBe(14);
      expect(result.error).toContain('cannot exceed 12 months');
    });

    it('should handle residences with 0 months', () => {
      const residences = [
        { monthsPerYear: 12 },
        { monthsPerYear: 0 },
      ];
      const result = validateResidenceTimeDistribution(residences);
      expect(result.isValid).toBe(true);
      expect(result.totalMonths).toBe(12);
    });

    it('should reject negative months', () => {
      const residences = [
        { monthsPerYear: -1 },
      ];
      const result = validateResidenceTimeDistribution(residences);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be negative');
    });
  });

  describe('validateIncomeRange', () => {
    it('should accept valid income ranges', () => {
      expect(validateIncomeRange('under-30k').isValid).toBe(true);
      expect(validateIncomeRange('30k-50k').isValid).toBe(true);
      expect(validateIncomeRange('50k-75k').isValid).toBe(true);
      expect(validateIncomeRange('75k-100k').isValid).toBe(true);
      expect(validateIncomeRange('100k-150k').isValid).toBe(true);
      expect(validateIncomeRange('150k-plus').isValid).toBe(true);
      expect(validateIncomeRange('prefer-not-say').isValid).toBe(true);
    });

    it('should reject undefined income range', () => {
      const result = validateIncomeRange(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('select an income range');
    });

    it('should reject invalid income range', () => {
      const result = validateIncomeRange('invalid-range');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid income range');
    });

    it('should reject empty string', () => {
      const result = validateIncomeRange('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('select an income range');
    });
  });
});
