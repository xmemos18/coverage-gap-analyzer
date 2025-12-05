import { VALIDATION } from './constants';
import DOMPurify from 'dompurify';
import { VALIDATION_ERRORS } from './errorMessages';

/**
 * Input validation and sanitization utilities
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitize text input to prevent XSS attacks
 * Uses DOMPurify to remove all potentially dangerous content while preserving text
 *
 * @param input - Raw text input from user
 * @param maxLength - Maximum length (default: 200 characters)
 * @returns Sanitized text safe for display and storage
 *
 * @example
 * ```typescript
 * sanitizeTextInput('<script>alert("xss")</script>Hello'); // 'Hello'
 * sanitizeTextInput('javascript:alert(1)'); // ''
 * sanitizeTextInput('<img src=x onerror=alert(1)>'); // ''
 * ```
 */
export function sanitizeTextInput(input: string, maxLength: number = 200): string {
  if (!input) return '';

  // Use DOMPurify to sanitize - strips all HTML tags and dangerous content
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Remove all HTML tags
    ALLOWED_ATTR: [], // Remove all attributes
    KEEP_CONTENT: true, // Keep text content
  }).trim();

  // Limit length to prevent DoS
  return sanitized.slice(0, maxLength);
}

/**
 * Validate and sanitize ZIP code
 * Must be exactly 5 digits and not be obviously invalid (like 00000)
 */
export function validateZipCode(zip: string): { isValid: boolean; sanitized: string; error?: string } {
  const sanitized = zip.replace(/\D/g, '').slice(0, VALIDATION.ZIP_CODE_LENGTH);

  // Check length
  if (sanitized.length !== VALIDATION.ZIP_CODE_LENGTH) {
    return { isValid: false, sanitized, error: VALIDATION_ERRORS.ZIP_INVALID_FORMAT };
  }

  // Reject obviously invalid ZIP codes
  if (sanitized === '00000') {
    return { isValid: false, sanitized, error: VALIDATION_ERRORS.ZIP_INVALID };
  }

  // Reject ZIP codes with all same digits, except known valid ones
  // Valid repeating-digit ZIP codes (verified with USPS):
  // - 11111: Floral Park, NY (also serves parts of Massapequa)
  // - 22222: Arlington, VA
  // - 33333: Fort Lauderdale, FL (unique ZIP for Westfield Broward mall)
  // - 44444: Newton Falls, OH
  // - 55555: Young America, MN (famous for rebate processing)
  const VALID_REPEATING_ZIPS = ['11111', '22222', '33333', '44444', '55555'];
  if (/^(\d)\1{4}$/.test(sanitized) && !VALID_REPEATING_ZIPS.includes(sanitized)) {
    return { isValid: false, sanitized, error: VALIDATION_ERRORS.ZIP_INVALID };
  }

  // First digit should be 0-9 (all US ZIP codes start with these)
  const firstChar = sanitized[0];
  if (!firstChar) {
    return { isValid: false, sanitized, error: VALIDATION_ERRORS.ZIP_INVALID };
  }
  const firstDigit = parseInt(firstChar);
  if (firstDigit < 0 || firstDigit > 9) {
    return { isValid: false, sanitized, error: VALIDATION_ERRORS.ZIP_INVALID };
  }

  return { isValid: true, sanitized };
}

/**
 * Validate age is within bounds
 */
export function validateAge(age: number, min: number, max: number): boolean {
  return Number.isInteger(age) && age >= min && age <= max;
}

/**
 * Sanitize and validate numeric input
 * Returns sanitized number (clamped to range) or null if invalid
 */
export function sanitizeNumericInput(input: string | number, min = 0, max = Number.MAX_SAFE_INTEGER): number | null {
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  // Clamp to min/max range
  const clamped = Math.min(Math.max(num, min), max);

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
 * Uses DOMPurify to remove all potentially dangerous content
 */
export function sanitizeCoverageNotes(notes: string): string {
  if (!notes) return '';

  // Use DOMPurify to sanitize - strips all HTML tags and dangerous content
  const sanitized = DOMPurify.sanitize(notes, {
    ALLOWED_TAGS: [], // Remove all HTML tags
    ALLOWED_ATTR: [], // Remove all attributes
    KEEP_CONTENT: true, // Keep text content
  }).trim();

  // Limit to 1000 characters
  return sanitized.slice(0, 1000);
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

/**
 * Validate residence time distribution
 * Ensures total months per year doesn't exceed 12
 */
export function validateResidenceTimeDistribution(residences: Array<{ monthsPerYear: number }>): {
  isValid: boolean;
  totalMonths: number;
  error?: string;
} {
  const totalMonths = residences.reduce((sum, residence) => {
    const months = residence.monthsPerYear || 0;
    return sum + months;
  }, 0);

  if (totalMonths > 12) {
    return {
      isValid: false,
      totalMonths,
      error: `${VALIDATION_ERRORS.RESIDENCE_TIME_INVALID} (${totalMonths} months specified)`,
    };
  }

  if (totalMonths < 0) {
    return {
      isValid: false,
      totalMonths,
      error: VALIDATION_ERRORS.RESIDENCE_TIME_NEGATIVE,
    };
  }

  return { isValid: true, totalMonths };
}

/**
 * Validate income range is selected
 * @deprecated Use validateAnnualIncome instead - kept for backward compatibility
 */
export function validateIncomeRange(incomeRange: string | undefined): {
  isValid: boolean;
  error?: string;
} {
  const validRanges = ['under-30k', '30k-50k', '50k-75k', '75k-100k', '100k-150k', '150k-plus', 'prefer-not-say'];

  if (!incomeRange) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INCOME_REQUIRED,
    };
  }

  if (!validRanges.includes(incomeRange)) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INCOME_INVALID,
    };
  }

  return { isValid: true };
}

/**
 * Validate annual income (optional field)
 * Supports values from $0 to $10 billion
 */
export function validateAnnualIncome(income: number | null | undefined): {
  isValid: boolean;
  sanitized: number | null;
  error?: string;
} {
  // null/undefined is valid (prefer not to say)
  if (income === null || income === undefined) {
    return { isValid: true, sanitized: null };
  }

  if (typeof income !== 'number' || isNaN(income) || !isFinite(income)) {
    return { isValid: false, sanitized: null, error: 'Please enter a valid income amount' };
  }

  if (income < 0) {
    return { isValid: false, sanitized: null, error: 'Income cannot be negative' };
  }

  if (income > 10_000_000_000) {
    return { isValid: false, sanitized: null, error: 'Income value exceeds maximum supported ($10 billion)' };
  }

  // Round to cents
  return { isValid: true, sanitized: Math.round(income * 100) / 100 };
}

/**
 * Validate net worth (optional field, can be negative for debt)
 * Supports values from -$10 billion to $1 trillion
 */
export function validateNetWorth(netWorth: number | null | undefined): {
  isValid: boolean;
  sanitized: number | null;
  error?: string;
} {
  // null/undefined is valid (prefer not to say)
  if (netWorth === null || netWorth === undefined) {
    return { isValid: true, sanitized: null };
  }

  if (typeof netWorth !== 'number' || isNaN(netWorth) || !isFinite(netWorth)) {
    return { isValid: false, sanitized: null, error: 'Please enter a valid net worth amount' };
  }

  if (netWorth < -10_000_000_000) {
    return { isValid: false, sanitized: null, error: 'Net worth value is below minimum supported (-$10 billion)' };
  }

  if (netWorth > 1_000_000_000_000) {
    return { isValid: false, sanitized: null, error: 'Net worth value exceeds maximum supported ($1 trillion)' };
  }

  // Round to cents
  return { isValid: true, sanitized: Math.round(netWorth * 100) / 100 };
}

/**
 * Parse currency input string to number
 * Supports formats: 75000, 75,000, $75,000, 75k, 1.5M, 1.5m, 2B, 2b
 */
export function parseCurrencyInput(input: string): number | null {
  if (!input || input.trim() === '') {
    return null;
  }

  // Strip $ and commas, trim whitespace
  const cleaned = input.replace(/[$,\s]/g, '').toLowerCase();

  if (cleaned === '') {
    return null;
  }

  // Handle shorthand: b/B for billions, m/M for millions, k/K for thousands
  let multiplier = 1;
  let numStr = cleaned;

  if (cleaned.endsWith('b')) {
    multiplier = 1_000_000_000;
    numStr = cleaned.slice(0, -1);
  } else if (cleaned.endsWith('m')) {
    multiplier = 1_000_000;
    numStr = cleaned.slice(0, -1);
  } else if (cleaned.endsWith('k')) {
    multiplier = 1_000;
    numStr = cleaned.slice(0, -1);
  }

  const num = parseFloat(numStr);
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  return num * multiplier;
}

/**
 * Format number as currency string for display
 * Under $1M: $75,000 (with commas)
 * $1M+: $1.5M
 * $1B+: $1.5B
 */
export function formatCurrencyDisplay(value: number | null): string {
  if (value === null) {
    return '';
  }

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    const billions = absValue / 1_000_000_000;
    return `${sign}$${billions.toFixed(billions % 1 === 0 ? 0 : 1)}B`;
  }

  if (absValue >= 1_000_000) {
    const millions = absValue / 1_000_000;
    return `${sign}$${millions.toFixed(millions % 1 === 0 ? 0 : 1)}M`;
  }

  return `${sign}$${absValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}
