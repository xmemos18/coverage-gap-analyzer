import {
  sanitizeTextInput,
  validateZipCode,
  validateAdultAge,
  validateChildAge,
  sanitizeNumericInput,
  validateMonetaryAmount,
} from '../validation';

describe('Validation Utilities', () => {
  describe('sanitizeTextInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeTextInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeTextInput('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should remove inline event handlers', () => {
      expect(sanitizeTextInput('test onclick=alert(1)')).toBe('test alert(1)');
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
  });

  describe('validateAdultAge', () => {
    it('should accept valid adult ages', () => {
      expect(validateAdultAge(18)).toBe(true);
      expect(validateAdultAge(50)).toBe(true);
      expect(validateAdultAge(100)).toBe(true);
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
});
