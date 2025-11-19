/**
 * Centralized Error Messages
 *
 * All user-facing error messages in one place for:
 * - Consistency across the application
 * - Easier maintenance and updates
 * - Future internationalization (i18n) support
 * - Better UX with clear, actionable messages
 */

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export const VALIDATION_ERRORS = {
  // ZIP Code validation
  ZIP_REQUIRED: 'ZIP code is required',
  ZIP_INVALID_FORMAT: 'ZIP code must be exactly 5 digits',
  ZIP_INVALID: 'Invalid ZIP code',
  ZIP_NOT_FOUND: 'ZIP code not found',

  // State validation
  STATE_REQUIRED: 'State is required',
  STATE_INVALID: 'Invalid state selected',

  // Age validation
  AGE_REQUIRED: 'Age is required',
  AGE_INVALID_ADULT: 'Adult age must be between 18 and 120',
  AGE_INVALID_CHILD: 'Child age must be between 0 and 17',
  AGE_INVALID: 'Invalid age',

  // Household validation
  NUM_ADULTS_REQUIRED: 'At least one adult is required',
  NUM_ADULTS_INVALID: 'Number of adults must be between 1 and 20',
  HOUSEHOLD_SIZE_INVALID: 'Invalid household size',

  // Insurance validation
  CARRIER_REQUIRED: 'Insurance carrier name is required',
  CARRIER_INVALID: 'Carrier name must be between 2 and 100 characters',
  PLAN_TYPE_REQUIRED: 'Plan type is required',
  PLAN_TYPE_INVALID: 'Invalid plan type',
  MONTHLY_COST_REQUIRED: 'Monthly cost is required',
  MONTHLY_COST_INVALID: 'Monthly cost must be a valid amount between $0 and $10,000',

  // Budget validation
  BUDGET_REQUIRED: 'Budget range is required',
  BUDGET_INVALID: 'Invalid budget range selected',

  // Income validation
  INCOME_REQUIRED: 'Please select an income range to calculate subsidy eligibility',
  INCOME_INVALID: 'Invalid income range selected',

  // Residence validation
  RESIDENCE_TIME_INVALID: 'Total time across all residences cannot exceed 12 months per year',
  RESIDENCE_TIME_NEGATIVE: 'Time spent at residences cannot be negative',

  // General validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  INVALID_VALUE: 'Invalid value',
} as const;

// ============================================================================
// API ERRORS
// ============================================================================

export const API_ERRORS = {
  // Generic API errors
  API_ERROR: 'API request failed',
  API_TIMEOUT: 'Request timeout - please try again',
  API_KEY_MISSING: 'API key not configured',
  API_UNAVAILABLE: 'Service temporarily unavailable',

  // Healthcare.gov API
  HEALTHCARE_API_ERROR: 'Failed to fetch healthcare data',
  COUNTY_LOOKUP_FAILED: 'Failed to fetch county data',
  MARKETPLACE_PLANS_FAILED: 'Failed to fetch marketplace plans',
  SUBSIDIES_CALCULATION_FAILED: 'Failed to calculate subsidies',

  // Medicare API
  MEDICARE_PLANS_FAILED: 'Failed to search Medicare plans',
  MEDICARE_ADVANTAGE_UNAVAILABLE: 'Medicare Advantage plan data not available',
  MEDIGAP_PLANS_UNAVAILABLE: 'Medigap plan data not available',
  PART_D_PLANS_UNAVAILABLE: 'Part D plan data not available',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',

  // Specific status codes
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INTERNAL_ERROR: 'Internal server error',
} as const;

// ============================================================================
// DATABASE ERRORS
// ============================================================================

export const DATABASE_ERRORS = {
  CONNECTION_FAILED: 'Database connection failed',
  CONNECTION_UNAVAILABLE: 'Database connection unavailable. Please try again.',
  QUERY_FAILED: 'Database query failed',
  TRANSACTION_FAILED: 'Transaction failed',
  RETRY_EXHAUSTED: 'Database connection failed after multiple attempts',
} as const;

// ============================================================================
// STORAGE ERRORS
// ============================================================================

export const STORAGE_ERRORS = {
  NO_DATA: 'No saved data found',
  LOAD_FAILED: 'Failed to load data',
  SAVE_FAILED: 'Failed to save data',
  CLEAR_FAILED: 'Failed to clear data',
  QUOTA_EXCEEDED: 'Storage quota exceeded - unable to save',
  CORRUPTED_DATA: 'Saved data is corrupted',
  INVALID_DATA: 'Invalid data structure',
  INVALID_JSON: 'Corrupted data (invalid JSON)',
  STORAGE_UNAVAILABLE: 'Browser storage is not available (private mode?)',
} as const;

// ============================================================================
// USER-FACING ERROR MESSAGES
// ============================================================================

export const USER_ERRORS = {
  // Calculator errors
  CALCULATION_FAILED: 'Unable to calculate recommendation. Please check your inputs and try again.',
  INCOMPLETE_DATA: 'Please complete all required fields',

  // Form errors
  FORM_VALIDATION_FAILED: 'Please fix the errors in the form before continuing',
  FORM_SUBMIT_FAILED: 'Failed to submit form. Please try again.',

  // Session errors
  SESSION_EXPIRED: 'Your session has expired. Please start over.',
  SESSION_INVALID: 'Invalid session data',

  // General user errors
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  DATA_SAVED: 'Your progress has been saved',
  DATA_LOADED: 'Progress restored from previous session',
  DATA_CLEARED: 'Form data cleared successfully',
  CALCULATION_COMPLETE: 'Recommendation calculated successfully',
  FORM_SUBMITTED: 'Form submitted successfully',
} as const;

// ============================================================================
// INFO MESSAGES
// ============================================================================

export const INFO_MESSAGES = {
  LOADING: 'Loading...',
  CALCULATING: 'Calculating your recommendation...',
  SAVING: 'Saving your progress...',
  PLEASE_WAIT: 'Please wait...',
  DATA_EXPIRED: 'Saved data is too old and has been cleared',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get error message with context
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return USER_ERRORS.UNEXPECTED_ERROR;
}

/**
 * Format API error with status code
 */
export function formatApiError(status: number, statusText: string): string {
  switch (status) {
    case 400:
      return `${API_ERRORS.API_ERROR}: Bad request`;
    case 401:
      return API_ERRORS.UNAUTHORIZED;
    case 403:
      return API_ERRORS.FORBIDDEN;
    case 404:
      return API_ERRORS.NOT_FOUND;
    case 429:
      return API_ERRORS.RATE_LIMIT_EXCEEDED;
    case 500:
    case 502:
    case 503:
      return API_ERRORS.INTERNAL_ERROR;
    default:
      return `${API_ERRORS.API_ERROR}: ${status} ${statusText}`;
  }
}

/**
 * Get validation error with field context
 */
export function getValidationError(field: string, errorType: keyof typeof VALIDATION_ERRORS): string {
  return `${field}: ${VALIDATION_ERRORS[errorType]}`;
}

/**
 * Check if error is user-facing (vs technical)
 */
export function isUserFacingError(message: string): boolean {
  const userFacingPatterns = [
    /required/i,
    /invalid/i,
    /not found/i,
    /failed/i,
    /unavailable/i,
    /exceeded/i,
  ];

  return userFacingPatterns.some(pattern => pattern.test(message));
}
