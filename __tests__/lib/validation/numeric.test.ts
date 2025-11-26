import {
  safeParseInt,
  safeParseFloat,
  parseCurrency,
  parsePercentage,
  parseNumericArray,
  NumericValidationError,
} from '@/lib/validation/numeric';

describe('safeParseInt', () => {
  describe('valid inputs', () => {
    it('parses valid integer strings', () => {
      expect(safeParseInt('42')).toBe(42);
      expect(safeParseInt('0')).toBe(0);
      expect(safeParseInt('-10')).toBe(-10);
      expect(safeParseInt('1000')).toBe(1000);
    });

    it('parses valid integers with whitespace', () => {
      expect(safeParseInt('  42  ')).toBe(42);
      expect(safeParseInt('\t100\n')).toBe(100);
    });

    it('accepts number inputs', () => {
      expect(safeParseInt(42)).toBe(42);
      expect(safeParseInt(0)).toBe(0);
      expect(safeParseInt(-10)).toBe(-10);
    });

    it('floors float numbers', () => {
      expect(safeParseInt(42.9)).toBe(42);
      expect(safeParseInt(42.1)).toBe(42);
      expect(safeParseInt(-10.9)).toBe(-10);
    });

    it('returns default value for null/undefined', () => {
      expect(safeParseInt(null, { defaultValue: 10 })).toBe(10);
      expect(safeParseInt(undefined, { defaultValue: 20 })).toBe(20);
      expect(safeParseInt('', { defaultValue: 30 })).toBe(30);
    });
  });

  describe('invalid inputs', () => {
    it('throws for invalid strings', () => {
      expect(() => safeParseInt('abc')).toThrow(NumericValidationError);
      expect(() => safeParseInt('12abc')).toThrow(NumericValidationError);
      expect(() => safeParseInt('not a number')).toThrow(NumericValidationError);
    });

    it('throws for NaN', () => {
      expect(() => safeParseInt(NaN)).toThrow(NumericValidationError);
    });

    it('throws for Infinity', () => {
      expect(() => safeParseInt(Infinity)).toThrow(NumericValidationError);
      expect(() => safeParseInt(-Infinity)).toThrow(NumericValidationError);
      expect(() => safeParseInt('Infinity')).toThrow(NumericValidationError);
    });

    it('throws for null/undefined without default', () => {
      expect(() => safeParseInt(null)).toThrow(NumericValidationError);
      expect(() => safeParseInt(undefined)).toThrow(NumericValidationError);
      expect(() => safeParseInt('')).toThrow(NumericValidationError);
    });

    it('returns undefined instead of throwing when throwOnError is false', () => {
      expect(safeParseInt('abc', { throwOnError: false })).toBeUndefined();
      expect(safeParseInt(NaN, { throwOnError: false })).toBeUndefined();
      expect(safeParseInt(null, { throwOnError: false })).toBeUndefined();
    });
  });

  describe('range validation', () => {
    it('validates minimum value', () => {
      expect(safeParseInt('10', { min: 0 })).toBe(10);
      expect(safeParseInt('10', { min: 10 })).toBe(10); // Inclusive
      expect(() => safeParseInt('10', { min: 11 })).toThrow(NumericValidationError);
    });

    it('validates maximum value', () => {
      expect(safeParseInt('10', { max: 20 })).toBe(10);
      expect(safeParseInt('10', { max: 10 })).toBe(10); // Inclusive
      expect(() => safeParseInt('10', { max: 9 })).toThrow(NumericValidationError);
    });

    it('validates both min and max', () => {
      expect(safeParseInt('50', { min: 0, max: 100 })).toBe(50);
      expect(() => safeParseInt('-10', { min: 0, max: 100 })).toThrow(NumericValidationError);
      expect(() => safeParseInt('150', { min: 0, max: 100 })).toThrow(NumericValidationError);
    });

    it('includes field name in error messages', () => {
      try {
        safeParseInt('-5', { min: 0, fieldName: 'age' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NumericValidationError);
        expect((error as NumericValidationError).message).toContain('age');
        expect((error as NumericValidationError).message).toContain('at least 0');
      }
    });
  });

  describe('error handling', () => {
    it('throws NumericValidationError with correct properties', () => {
      try {
        safeParseInt('invalid', { fieldName: 'testField' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NumericValidationError);
        expect((error as NumericValidationError).name).toBe('NumericValidationError');
        expect((error as NumericValidationError).value).toBe('invalid');
        expect((error as NumericValidationError).fieldName).toBe('testField');
      }
    });
  });
});

describe('safeParseFloat', () => {
  describe('valid inputs', () => {
    it('parses valid float strings', () => {
      expect(safeParseFloat('42.5')).toBe(42.5);
      expect(safeParseFloat('0.0')).toBe(0);
      expect(safeParseFloat('-10.25')).toBe(-10.25);
      expect(safeParseFloat('1000.999')).toBe(1000.999);
    });

    it('parses integers as floats', () => {
      expect(safeParseFloat('42')).toBe(42);
      expect(safeParseFloat('0')).toBe(0);
    });

    it('parses valid floats with whitespace', () => {
      expect(safeParseFloat('  42.5  ')).toBe(42.5);
      expect(safeParseFloat('\t100.1\n')).toBe(100.1);
    });

    it('accepts number inputs', () => {
      expect(safeParseFloat(42.5)).toBe(42.5);
      expect(safeParseFloat(0)).toBe(0);
      expect(safeParseFloat(-10.25)).toBe(-10.25);
    });

    it('returns default value for null/undefined', () => {
      expect(safeParseFloat(null, { defaultValue: 10.5 })).toBe(10.5);
      expect(safeParseFloat(undefined, { defaultValue: 20.1 })).toBe(20.1);
      expect(safeParseFloat('', { defaultValue: 30.7 })).toBe(30.7);
    });
  });

  describe('invalid inputs', () => {
    it('throws for invalid strings', () => {
      expect(() => safeParseFloat('abc')).toThrow(NumericValidationError);
      expect(() => safeParseFloat('12.5abc')).toThrow(NumericValidationError);
      expect(() => safeParseFloat('not a number')).toThrow(NumericValidationError);
    });

    it('throws for NaN', () => {
      expect(() => safeParseFloat(NaN)).toThrow(NumericValidationError);
    });

    it('throws for Infinity', () => {
      expect(() => safeParseFloat(Infinity)).toThrow(NumericValidationError);
      expect(() => safeParseFloat(-Infinity)).toThrow(NumericValidationError);
    });

    it('throws for null/undefined without default', () => {
      expect(() => safeParseFloat(null)).toThrow(NumericValidationError);
      expect(() => safeParseFloat(undefined)).toThrow(NumericValidationError);
      expect(() => safeParseFloat('')).toThrow(NumericValidationError);
    });

    it('returns undefined instead of throwing when throwOnError is false', () => {
      expect(safeParseFloat('abc', { throwOnError: false })).toBeUndefined();
      expect(safeParseFloat(NaN, { throwOnError: false })).toBeUndefined();
      expect(safeParseFloat(null, { throwOnError: false })).toBeUndefined();
    });
  });

  describe('range validation', () => {
    it('validates minimum value', () => {
      expect(safeParseFloat('10.5', { min: 0 })).toBe(10.5);
      expect(safeParseFloat('10.5', { min: 10.5 })).toBe(10.5);
      expect(() => safeParseFloat('10.5', { min: 11 })).toThrow(NumericValidationError);
    });

    it('validates maximum value', () => {
      expect(safeParseFloat('10.5', { max: 20 })).toBe(10.5);
      expect(safeParseFloat('10.5', { max: 10.5 })).toBe(10.5);
      expect(() => safeParseFloat('10.5', { max: 10 })).toThrow(NumericValidationError);
    });

    it('validates both min and max', () => {
      expect(safeParseFloat('50.5', { min: 0, max: 100 })).toBe(50.5);
      expect(() => safeParseFloat('-10.5', { min: 0, max: 100 })).toThrow(NumericValidationError);
      expect(() => safeParseFloat('150.5', { min: 0, max: 100 })).toThrow(NumericValidationError);
    });
  });

  describe('precision', () => {
    it('preserves decimal precision', () => {
      expect(safeParseFloat('3.14159')).toBe(3.14159);
      expect(safeParseFloat('0.0001')).toBe(0.0001);
      expect(safeParseFloat('999.999999')).toBe(999.999999);
    });
  });
});

describe('parseCurrency', () => {
  it('parses currency strings with dollar sign', () => {
    expect(parseCurrency('$100')).toBe(100);
    expect(parseCurrency('$1,234.56')).toBe(1234.56);
    expect(parseCurrency('$0.99')).toBe(0.99);
  });

  it('parses currency strings without dollar sign', () => {
    expect(parseCurrency('100')).toBe(100);
    expect(parseCurrency('1,234.56')).toBe(1234.56);
  });

  it('handles negative currency', () => {
    expect(parseCurrency('-$100')).toBe(-100);
    expect(parseCurrency('$-100')).toBe(-100);
  });

  it('accepts number inputs', () => {
    expect(parseCurrency(100)).toBe(100);
    expect(parseCurrency(1234.56)).toBe(1234.56);
  });

  it('validates range', () => {
    expect(parseCurrency('$100', { min: 0, max: 1000 })).toBe(100);
    expect(() => parseCurrency('$-10', { min: 0 })).toThrow(NumericValidationError);
    expect(() => parseCurrency('$2000', { max: 1000 })).toThrow(NumericValidationError);
  });

  it('uses "currency" as default field name', () => {
    try {
      parseCurrency('invalid');
      fail('Should have thrown');
    } catch (error) {
      expect((error as NumericValidationError).message).toContain('currency');
    }
  });
});

describe('parsePercentage', () => {
  it('parses percentage strings as decimal by default', () => {
    expect(parsePercentage('25%')).toBe(0.25);
    expect(parsePercentage('100%')).toBe(1.0);
    expect(parsePercentage('0%')).toBe(0);
    expect(parsePercentage('50.5%')).toBe(0.505);
  });

  it('parses percentage strings without percent sign', () => {
    expect(parsePercentage('25')).toBe(0.25);
    expect(parsePercentage('100')).toBe(1.0);
  });

  it('keeps as percentage when asDecimal is false', () => {
    expect(parsePercentage('25%', { asDecimal: false })).toBe(25);
    expect(parsePercentage('100%', { asDecimal: false })).toBe(100);
  });

  it('accepts number inputs', () => {
    expect(parsePercentage(25)).toBe(0.25);
    expect(parsePercentage(100)).toBe(1.0);
  });

  it('validates range on decimal value', () => {
    expect(parsePercentage('50%', { min: 0, max: 1 })).toBe(0.5);
    expect(() => parsePercentage('150%', { max: 1 })).toThrow(NumericValidationError);
  });

  it('uses "percentage" as default field name', () => {
    try {
      parsePercentage('invalid');
      fail('Should have thrown');
    } catch (error) {
      expect((error as NumericValidationError).message).toContain('percentage');
    }
  });
});

describe('parseNumericArray', () => {
  it('parses array of valid numbers', () => {
    expect(parseNumericArray(['1', '2', '3'])).toEqual([1, 2, 3]);
    expect(parseNumericArray(['10.5', '20.1', '30.9'])).toEqual([10.5, 20.1, 30.9]);
  });

  it('filters out invalid values when throwOnError is false', () => {
    expect(parseNumericArray(['1', 'invalid', '3'], { throwOnError: false })).toEqual([1, 3]);
    expect(parseNumericArray([null, '2', undefined, '4'], { throwOnError: false })).toEqual([2, 4]);
  });

  it('throws on first invalid value when throwOnError is true', () => {
    expect(() => parseNumericArray(['1', 'invalid', '3'], { throwOnError: true })).toThrow(
      NumericValidationError
    );
  });

  it('includes index in error messages', () => {
    try {
      parseNumericArray(['1', 'invalid', '3'], { fieldName: 'ids', throwOnError: true });
      fail('Should have thrown');
    } catch (error) {
      expect((error as NumericValidationError).message).toContain('ids[1]');
    }
  });

  it('validates range for all values', () => {
    expect(parseNumericArray(['1', '5', '10'], { min: 0, max: 10 })).toEqual([1, 5, 10]);
    expect(() => parseNumericArray(['1', '5', '15'], { min: 0, max: 10 })).toThrow(
      NumericValidationError
    );
  });

  it('handles empty array', () => {
    expect(parseNumericArray([])).toEqual([]);
  });

  it('handles mixed number and string inputs', () => {
    expect(parseNumericArray([1, '2', 3.5, '4.5'])).toEqual([1, 2, 3.5, 4.5]);
  });
});

describe('NumericValidationError', () => {
  it('creates error with correct properties', () => {
    const error = new NumericValidationError('Test error', 'invalid-value', 'testField');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(NumericValidationError);
    expect(error.name).toBe('NumericValidationError');
    expect(error.message).toBe('Test error');
    expect(error.value).toBe('invalid-value');
    expect(error.fieldName).toBe('testField');
  });

  it('works without field name', () => {
    const error = new NumericValidationError('Test error', 123);

    expect(error.fieldName).toBeUndefined();
  });
});

describe('edge cases', () => {
  describe('safeParseInt edge cases', () => {
    it('handles very large numbers', () => {
      expect(safeParseInt('999999999')).toBe(999999999);
      expect(safeParseInt(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('handles leading zeros', () => {
      expect(safeParseInt('007')).toBe(7);
      expect(safeParseInt('0042')).toBe(42);
    });

    it('rejects scientific notation strings', () => {
      // safeParseInt should reject scientific notation as invalid integer format
      expect(() => safeParseInt('1e3')).toThrow(NumericValidationError);
    });
  });

  describe('safeParseFloat edge cases', () => {
    it('handles very small numbers', () => {
      expect(safeParseFloat('0.00001')).toBe(0.00001);
    });

    it('handles scientific notation', () => {
      expect(safeParseFloat('1e3')).toBe(1000);
      expect(safeParseFloat('1.5e2')).toBe(150);
      expect(safeParseFloat('1e-3')).toBe(0.001);
    });

    it('handles leading zeros', () => {
      expect(safeParseFloat('007.5')).toBe(7.5);
      expect(safeParseFloat('0042.1')).toBe(42.1);
    });
  });

  describe('parseCurrency edge cases', () => {
    it('handles multiple commas', () => {
      expect(parseCurrency('$1,234,567.89')).toBe(1234567.89);
    });

    it('handles spaces', () => {
      expect(parseCurrency('$ 100')).toBe(100);
      expect(parseCurrency('  $  1,234.56  ')).toBe(1234.56);
    });
  });

  describe('parsePercentage edge cases', () => {
    it('handles decimal percentages', () => {
      expect(parsePercentage('0.5%')).toBe(0.005);
      expect(parsePercentage('99.99%')).toBeCloseTo(0.9999, 10);
    });

    it('handles over 100%', () => {
      expect(parsePercentage('150%')).toBe(1.5);
      expect(parsePercentage('200%')).toBe(2.0);
    });
  });
});

describe('real-world scenarios', () => {
  it('validates age input', () => {
    const validateAge = (age: string) => safeParseInt(age, { min: 0, max: 120, fieldName: 'age' });

    expect(validateAge('25')).toBe(25);
    expect(validateAge('65')).toBe(65);
    expect(() => validateAge('-1')).toThrow('age must be at least 0');
    expect(() => validateAge('150')).toThrow('age must be at most 120');
    expect(() => validateAge('abc')).toThrow('age must be a valid integer');
  });

  it('validates premium input', () => {
    const validatePremium = (premium: string) =>
      safeParseFloat(premium, { min: 0, max: 10000, fieldName: 'premium' });

    expect(validatePremium('450.50')).toBe(450.5);
    expect(validatePremium('0')).toBe(0);
    expect(() => validatePremium('-100')).toThrow('premium must be at least 0');
    expect(() => validatePremium('15000')).toThrow('premium must be at most 10000');
  });

  it('validates deductible with default', () => {
    const validateDeductible = (deductible: string | null) =>
      safeParseFloat(deductible, { min: 0, defaultValue: 0, fieldName: 'deductible' });

    expect(validateDeductible('1000')).toBe(1000);
    expect(validateDeductible(null)).toBe(0);
    expect(validateDeductible('')).toBe(0);
  });

  it('validates ZIP code', () => {
    const validateZipCode = (zip: string) =>
      safeParseInt(zip, { min: 501, max: 99950, fieldName: 'zipCode' });

    expect(validateZipCode('10001')).toBe(10001);
    expect(validateZipCode('90210')).toBe(90210);
    expect(() => validateZipCode('123')).toThrow('zipCode must be at least 501');
    expect(() => validateZipCode('123456')).toThrow('zipCode must be at most 99950');
  });
});
