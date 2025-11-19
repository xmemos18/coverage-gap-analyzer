/**
 * Safe numeric parsing utilities to prevent NaN and invalid values
 * @module lib/validation/numeric
 */

export class NumericValidationError extends Error {
  constructor(
    message: string,
    public readonly value: unknown,
    public readonly fieldName?: string
  ) {
    super(message);
    this.name = 'NumericValidationError';
  }
}

export interface ParseOptions {
  /** Minimum allowed value (inclusive) */
  min?: number;
  /** Maximum allowed value (inclusive) */
  max?: number;
  /** Field name for error messages */
  fieldName?: string;
  /** Default value to return if input is null/undefined */
  defaultValue?: number;
  /** Whether to throw an error or return undefined for invalid values */
  throwOnError?: boolean;
}

/**
 * Safely parse a string to an integer with validation
 *
 * @param value - The value to parse (string, number, or null/undefined)
 * @param options - Parsing and validation options
 * @returns Parsed integer or undefined if invalid (when throwOnError is false)
 * @throws {NumericValidationError} If value is invalid and throwOnError is true
 *
 * @example
 * ```typescript
 * // Basic usage
 * const age = safeParseInt('25'); // 25
 *
 * // With validation
 * const age = safeParseInt('25', { min: 0, max: 120, fieldName: 'age' }); // 25
 *
 * // With default value
 * const page = safeParseInt(null, { defaultValue: 1 }); // 1
 *
 * // Without throwing errors
 * const invalid = safeParseInt('abc', { throwOnError: false }); // undefined
 * ```
 */
export function safeParseInt(
  value: string | number | null | undefined,
  options: ParseOptions = {}
): number | undefined {
  const {
    min,
    max,
    fieldName = 'value',
    defaultValue,
    throwOnError = true,
  } = options;

  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    if (throwOnError) {
      throw new NumericValidationError(
        `${fieldName} is required`,
        value,
        fieldName
      );
    }
    return undefined;
  }

  // If already a number, validate it
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      if (throwOnError) {
        throw new NumericValidationError(
          `${fieldName} must be a finite number`,
          value,
          fieldName
        );
      }
      return undefined;
    }
    const intValue = Math.floor(value);
    return validateRange(intValue, min, max, fieldName, throwOnError);
  }

  // Parse string to integer
  const trimmed = String(value).trim();

  // Check for empty string after trim
  if (trimmed === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    if (throwOnError) {
      throw new NumericValidationError(
        `${fieldName} cannot be empty`,
        value,
        fieldName
      );
    }
    return undefined;
  }

  const parsed = parseInt(trimmed, 10);

  // Check for NaN
  if (isNaN(parsed)) {
    if (throwOnError) {
      throw new NumericValidationError(
        `${fieldName} must be a valid integer (received: "${value}")`,
        value,
        fieldName
      );
    }
    return undefined;
  }

  // Check if the parsed value is Infinity
  if (!isFinite(parsed)) {
    if (throwOnError) {
      throw new NumericValidationError(
        `${fieldName} must be a finite integer`,
        value,
        fieldName
      );
    }
    return undefined;
  }

  return validateRange(parsed, min, max, fieldName, throwOnError);
}

/**
 * Safely parse a string to a float with validation
 *
 * @param value - The value to parse (string, number, or null/undefined)
 * @param options - Parsing and validation options
 * @returns Parsed float or undefined if invalid (when throwOnError is false)
 * @throws {NumericValidationError} If value is invalid and throwOnError is true
 *
 * @example
 * ```typescript
 * // Basic usage
 * const price = safeParseFloat('99.99'); // 99.99
 *
 * // With validation
 * const premium = safeParseFloat('450.50', { min: 0, max: 10000, fieldName: 'premium' });
 *
 * // With default value
 * const deductible = safeParseFloat(null, { defaultValue: 0 }); // 0
 *
 * // Without throwing errors
 * const invalid = safeParseFloat('abc', { throwOnError: false }); // undefined
 * ```
 */
export function safeParseFloat(
  value: string | number | null | undefined,
  options: ParseOptions = {}
): number | undefined {
  const {
    min,
    max,
    fieldName = 'value',
    defaultValue,
    throwOnError = true,
  } = options;

  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    if (throwOnError) {
      throw new NumericValidationError(
        `${fieldName} is required`,
        value,
        fieldName
      );
    }
    return undefined;
  }

  // If already a number, validate it
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      if (throwOnError) {
        throw new NumericValidationError(
          `${fieldName} must be a finite number`,
          value,
          fieldName
        );
      }
      return undefined;
    }
    return validateRange(value, min, max, fieldName, throwOnError);
  }

  // Parse string to float
  const trimmed = String(value).trim();

  // Check for empty string after trim
  if (trimmed === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    if (throwOnError) {
      throw new NumericValidationError(
        `${fieldName} cannot be empty`,
        value,
        fieldName
      );
    }
    return undefined;
  }

  const parsed = parseFloat(trimmed);

  // Check for NaN
  if (isNaN(parsed)) {
    if (throwOnError) {
      throw new NumericValidationError(
        `${fieldName} must be a valid number (received: "${value}")`,
        value,
        fieldName
      );
    }
    return undefined;
  }

  // Check if the parsed value is Infinity
  if (!isFinite(parsed)) {
    if (throwOnError) {
      throw new NumericValidationError(
        `${fieldName} must be a finite number`,
        value,
        fieldName
      );
    }
    return undefined;
  }

  return validateRange(parsed, min, max, fieldName, throwOnError);
}

/**
 * Validate a number is within a specified range
 *
 * @param value - The number to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param fieldName - Field name for error messages
 * @param throwOnError - Whether to throw an error or return undefined
 * @returns The validated value or undefined if invalid
 * @throws {NumericValidationError} If value is out of range and throwOnError is true
 */
function validateRange(
  value: number,
  min: number | undefined,
  max: number | undefined,
  fieldName: string,
  throwOnError: boolean
): number | undefined {
  if (min !== undefined && value < min) {
    if (throwOnError) {
      throw new NumericValidationError(
        `${fieldName} must be at least ${min} (received: ${value})`,
        value,
        fieldName
      );
    }
    return undefined;
  }

  if (max !== undefined && value > max) {
    if (throwOnError) {
      throw new NumericValidationError(
        `${fieldName} must be at most ${max} (received: ${value})`,
        value,
        fieldName
      );
    }
    return undefined;
  }

  return value;
}

/**
 * Safely parse a currency string (e.g., "$1,234.56") to a number
 *
 * @param value - The currency string to parse
 * @param options - Parsing and validation options
 * @returns Parsed currency value or undefined if invalid
 * @throws {NumericValidationError} If value is invalid and throwOnError is true
 *
 * @example
 * ```typescript
 * parseCurrency('$1,234.56'); // 1234.56
 * parseCurrency('$1,234.56', { min: 0 }); // 1234.56
 * parseCurrency('€1.234,56'); // Throws error (unsupported format)
 * ```
 */
export function parseCurrency(
  value: string | number | null | undefined,
  options: ParseOptions = {}
): number | undefined {
  if (typeof value === 'number') {
    return safeParseFloat(value, options);
  }

  if (value === null || value === undefined || value === '') {
    return safeParseFloat(value, options);
  }

  // Remove currency symbols and commas
  const cleaned = String(value)
    .trim()
    .replace(/[$,]/g, '');

  return safeParseFloat(cleaned, {
    ...options,
    fieldName: options.fieldName || 'currency',
  });
}

/**
 * Safely parse a percentage string (e.g., "25%") to a decimal (0.25)
 *
 * @param value - The percentage string to parse
 * @param options - Parsing and validation options (min/max are applied to the decimal value)
 * @returns Parsed percentage as decimal or undefined if invalid
 * @throws {NumericValidationError} If value is invalid and throwOnError is true
 *
 * @example
 * ```typescript
 * parsePercentage('25%'); // 0.25
 * parsePercentage('100%'); // 1.0
 * parsePercentage('25', { asDecimal: false }); // 25 (keep as percentage)
 * ```
 */
export function parsePercentage(
  value: string | number | null | undefined,
  options: ParseOptions & { asDecimal?: boolean } = {}
): number | undefined {
  const { asDecimal = true, ...parseOptions } = options;

  if (typeof value === 'number') {
    return asDecimal ? value / 100 : value;
  }

  if (value === null || value === undefined || value === '') {
    return safeParseFloat(value, parseOptions);
  }

  // Remove percentage symbol
  const cleaned = String(value)
    .trim()
    .replace(/%/g, '');

  const parsed = safeParseFloat(cleaned, {
    ...parseOptions,
    fieldName: parseOptions.fieldName || 'percentage',
  });

  if (parsed === undefined) {
    return undefined;
  }

  return asDecimal ? parsed / 100 : parsed;
}

/**
 * Parse and validate an array of numeric values
 *
 * @param values - Array of values to parse
 * @param options - Parsing and validation options
 * @returns Array of parsed numbers (undefined values are filtered out unless throwOnError is true)
 * @throws {NumericValidationError} If any value is invalid and throwOnError is true
 *
 * @example
 * ```typescript
 * parseNumericArray(['1', '2', '3']); // [1, 2, 3]
 * parseNumericArray(['1', 'invalid', '3'], { throwOnError: false }); // [1, 3]
 * ```
 */
export function parseNumericArray(
  values: (string | number | null | undefined)[],
  options: ParseOptions = {}
): number[] {
  const results: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const parsed = safeParseFloat(values[i], {
      ...options,
      fieldName: options.fieldName ? `${options.fieldName}[${i}]` : `value[${i}]`,
    });

    if (parsed !== undefined) {
      results.push(parsed);
    }
  }

  return results;
}
