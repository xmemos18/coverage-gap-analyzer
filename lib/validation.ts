import { VALIDATION } from './constants';

/**
 * Input validation and sanitization utilities
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitize text input to prevent XSS attacks
 * Removes potentially dangerous characters while preserving valid input
 */
export function sanitizeTextInput(input: string): string {
  if (!input) return '';

  // Remove control characters and potentially dangerous patterns
  return input
    .replace(/[<>]/g, '') // Remove angle brackets to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove inline event handlers
    .trim()
    .slice(0, 200); // Limit length to prevent DoS
}

/**
 * Validate and sanitize ZIP code
 * Must be exactly 5 digits
 */
export function validateZipCode(zip: string): { isValid: boolean; sanitized: string } {
  const sanitized = zip.replace(/\D/g, '').slice(0, VALIDATION.ZIP_CODE_LENGTH);
  const isValid = sanitized.length === VALIDATION.ZIP_CODE_LENGTH;

  return { isValid, sanitized };
}

/**
 * Validate age is within bounds
 */
export function validateAge(age: number, min: number, max: number): boolean {
  return Number.isInteger(age) && age >= min && age <= max;
}

/**
 * Sanitize and validate numeric input
 * Returns sanitized number or null if invalid
 */
export function sanitizeNumericInput(input: string | number, min = 0, max = Number.MAX_SAFE_INTEGER): number | null {
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  // Clamp to range
  const clamped = Math.max(min, Math.min(max, num));

  // Round to 2 decimal places for currency
  return Math.round(clamped * 100) / 100;
}

/**
 * Validate adult age (18-120)
 */
export function validateAdultAge(age: number): boolean {
  return validateAge(age, VALIDATION.MIN_ADULT_AGE, VALIDATION.MAX_ADULT_AGE);
}

/**
 * Validate child age (0-17)
 */
export function validateChildAge(age: number): boolean {
  return validateAge(age, VALIDATION.MIN_CHILD_AGE, VALIDATION.MAX_CHILD_AGE);
}

/**
 * Sanitize coverage notes (prevent XSS in textarea)
 */
export function sanitizeCoverageNotes(notes: string): string {
  if (!notes) return '';

  return notes
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 1000); // Limit to 1000 characters
}

/**
 * Validate insurance carrier name
 */
export function validateCarrierName(name: string): { isValid: boolean; sanitized: string } {
  const sanitized = sanitizeTextInput(name);
  const isValid = sanitized.length >= 2 && sanitized.length <= 100;

  return { isValid, sanitized };
}

/**
 * Validate monetary amount (must be non-negative)
 */
export function validateMonetaryAmount(amount: number): boolean {
  return typeof amount === 'number' &&
         isFinite(amount) &&
         amount >= 0 &&
         amount <= 1000000; // Max $1M to prevent unrealistic values
}
