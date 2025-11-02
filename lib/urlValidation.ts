/**
 * URL Parameter Validation
 *
 * Validates URL parameters for the results page to ensure data integrity
 * and provide helpful error messages when data is missing or invalid.
 */

import { US_STATES } from './states';
import { VALIDATION } from './constants';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface URLValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate ZIP code format
 */
function validateZipCode(zip: string, label: string): ValidationError | null {
  if (!zip) {
    return {
      field: 'zip',
      message: `${label} ZIP code is missing`,
      severity: 'error',
    };
  }

  const digitsOnly = zip.replace(/\D/g, '');

  if (digitsOnly.length !== VALIDATION.ZIP_CODE_LENGTH) {
    return {
      field: 'zip',
      message: `${label} ZIP code must be exactly ${VALIDATION.ZIP_CODE_LENGTH} digits (got: ${zip})`,
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validate state code
 */
function validateState(state: string, label: string): ValidationError | null {
  if (!state) {
    return {
      field: 'state',
      message: `${label} state is missing`,
      severity: 'error',
    };
  }

  const isValidState = US_STATES.some(s => s.code === state);

  if (!isValidState) {
    return {
      field: 'state',
      message: `${label} has invalid state code: ${state}`,
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validate age
 */
function validateAge(age: number, label: string, min: number, max: number): ValidationError | null {
  if (isNaN(age)) {
    return {
      field: 'age',
      message: `${label} age is invalid`,
      severity: 'error',
    };
  }

  if (age < min || age > max) {
    return {
      field: 'age',
      message: `${label} age (${age}) must be between ${min} and ${max}`,
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validate budget format
 */
function validateBudget(budget: string): ValidationError | null {
  if (!budget) {
    return {
      field: 'budget',
      message: 'Budget preference is missing',
      severity: 'warning', // Warning, not error - can still provide recommendations
    };
  }

  const validBudgets = [
    'under-500',
    '500-1000',
    '1000-2000',
    '2000-3000',
    'over-3000',
    'flexible',
  ];

  if (!validBudgets.includes(budget)) {
    return {
      field: 'budget',
      message: `Invalid budget format: ${budget}`,
      severity: 'warning',
    };
  }

  return null;
}

/**
 * Validate all URL parameters for the results page
 */
export function validateURLParameters(params: {
  residenceZips: string[];
  residenceStates: string[];
  numAdults: number;
  adultAges: number[];
  numChildren: number;
  childAges: number[];
  hasMedicareEligible: boolean;
  hasCurrentInsurance: boolean;
  budget: string;
}): URLValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate minimum residences (need at least 2)
  if (params.residenceZips.length < VALIDATION.MIN_RESIDENCES) {
    errors.push({
      field: 'residences',
      message: `At least ${VALIDATION.MIN_RESIDENCES} residences are required (got: ${params.residenceZips.length})`,
      severity: 'error',
    });
  }

  // Validate residences match
  if (params.residenceZips.length !== params.residenceStates.length) {
    errors.push({
      field: 'residences',
      message: `Mismatch between residence ZIP codes (${params.residenceZips.length}) and states (${params.residenceStates.length})`,
      severity: 'error',
    });
  }

  // Validate each residence
  params.residenceZips.forEach((zip, index) => {
    const label = index === 0 ? 'Primary residence' : index === 1 ? 'Secondary residence' : `Residence ${index + 1}`;

    const zipError = validateZipCode(zip, label);
    if (zipError) errors.push(zipError);

    if (params.residenceStates[index]) {
      const stateError = validateState(params.residenceStates[index], label);
      if (stateError) errors.push(stateError);
    }
  });

  // Validate adults
  if (params.numAdults < VALIDATION.MIN_ADULTS) {
    errors.push({
      field: 'adults',
      message: `At least ${VALIDATION.MIN_ADULTS} adult is required`,
      severity: 'error',
    });
  }

  if (params.numAdults > VALIDATION.MAX_ADULTS) {
    errors.push({
      field: 'adults',
      message: `Too many adults (${params.numAdults}, maximum: ${VALIDATION.MAX_ADULTS})`,
      severity: 'error',
    });
  }

  // Validate adult ages match count
  if (params.adultAges.length !== params.numAdults) {
    errors.push({
      field: 'adults',
      message: `Number of adult ages (${params.adultAges.length}) doesn't match number of adults (${params.numAdults})`,
      severity: 'error',
    });
  }

  // Validate each adult age
  params.adultAges.forEach((age, index) => {
    const ageError = validateAge(
      age,
      `Adult ${index + 1}`,
      VALIDATION.MIN_ADULT_AGE,
      VALIDATION.MAX_ADULT_AGE
    );
    if (ageError) errors.push(ageError);
  });

  // Validate children (optional)
  if (params.numChildren > 0) {
    if (params.numChildren > VALIDATION.MAX_CHILDREN) {
      errors.push({
        field: 'children',
        message: `Too many children (${params.numChildren}, maximum: ${VALIDATION.MAX_CHILDREN})`,
        severity: 'error',
      });
    }

    if (params.childAges.length !== params.numChildren) {
      errors.push({
        field: 'children',
        message: `Number of child ages (${params.childAges.length}) doesn't match number of children (${params.numChildren})`,
        severity: 'error',
      });
    }

    params.childAges.forEach((age, index) => {
      const ageError = validateAge(
        age,
        `Child ${index + 1}`,
        VALIDATION.MIN_CHILD_AGE,
        VALIDATION.MAX_CHILD_AGE
      );
      if (ageError) errors.push(ageError);
    });
  }

  // Validate budget
  const budgetError = validateBudget(params.budget);
  if (budgetError) {
    if (budgetError.severity === 'error') {
      errors.push(budgetError);
    } else {
      warnings.push(budgetError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format validation errors into user-friendly messages
 */
export function formatValidationErrors(result: URLValidationResult): string[] {
  const messages: string[] = [];

  if (result.errors.length > 0) {
    messages.push('The following issues were found with the URL parameters:');
    result.errors.forEach(error => {
      messages.push(`• ${error.message}`);
    });
  }

  if (result.warnings.length > 0) {
    messages.push('');
    messages.push('Warnings:');
    result.warnings.forEach(warning => {
      messages.push(`• ${warning.message}`);
    });
  }

  return messages;
}

/**
 * Get a short summary of validation errors for logging
 */
export function getValidationSummary(result: URLValidationResult): string {
  if (result.isValid) {
    return 'All URL parameters are valid';
  }

  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;

  const parts: string[] = [];

  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount === 1 ? '' : 's'}`);
  }

  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount === 1 ? '' : 's'}`);
  }

  return `Validation failed: ${parts.join(', ')}`;
}
