/**
 * Comprehensive validation error messages
 * User-friendly, specific, and actionable
 */

import { VALIDATION } from './constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  hint?: string;
}

/**
 * ZIP Code validation messages
 */
export const validateZipCodeWithMessage = (zip: string): ValidationResult => {
  if (!zip || zip.trim().length === 0) {
    return {
      isValid: false,
      error: 'ZIP code is required',
      hint: 'Enter a 5-digit ZIP code (e.g., 10001)',
    };
  }

  const digitsOnly = zip.replace(/\D/g, '');

  if (digitsOnly.length < VALIDATION.ZIP_CODE_LENGTH) {
    return {
      isValid: false,
      error: `ZIP code must be ${VALIDATION.ZIP_CODE_LENGTH} digits`,
      hint: `You entered ${digitsOnly.length} digit${digitsOnly.length === 1 ? '' : 's'}. Need ${VALIDATION.ZIP_CODE_LENGTH - digitsOnly.length} more.`,
    };
  }

  if (digitsOnly.length > VALIDATION.ZIP_CODE_LENGTH) {
    return {
      isValid: false,
      error: `ZIP code is too long`,
      hint: `ZIP codes are ${VALIDATION.ZIP_CODE_LENGTH} digits. Remove the extra digits.`,
    };
  }

  return { isValid: true };
};

/**
 * Adult age validation messages
 */
export const validateAdultAgeWithMessage = (age: number | null | undefined): ValidationResult => {
  if (age === null || age === undefined || isNaN(age)) {
    return {
      isValid: false,
      error: 'Age is required',
      hint: 'Enter the person\'s current age',
    };
  }

  if (age < VALIDATION.MIN_ADULT_AGE) {
    return {
      isValid: false,
      error: `Age must be at least ${VALIDATION.MIN_ADULT_AGE}`,
      hint: `If under ${VALIDATION.MIN_ADULT_AGE}, please add as a child instead`,
    };
  }

  if (age > VALIDATION.MAX_ADULT_AGE) {
    return {
      isValid: false,
      error: `Age must be ${VALIDATION.MAX_ADULT_AGE} or less`,
      hint: `Please enter a valid age between ${VALIDATION.MIN_ADULT_AGE} and ${VALIDATION.MAX_ADULT_AGE}`,
    };
  }

  return { isValid: true };
};

/**
 * Child age validation messages
 */
export const validateChildAgeWithMessage = (age: number | null | undefined): ValidationResult => {
  if (age === null || age === undefined || isNaN(age)) {
    return {
      isValid: false,
      error: 'Age is required',
      hint: 'Enter the child\'s current age (0-17)',
    };
  }

  if (age < VALIDATION.MIN_CHILD_AGE) {
    return {
      isValid: false,
      error: `Age cannot be negative`,
      hint: 'Enter the child\'s current age (0 for infants)',
    };
  }

  if (age > VALIDATION.MAX_CHILD_AGE) {
    return {
      isValid: false,
      error: `Age must be ${VALIDATION.MAX_CHILD_AGE} or less for children`,
      hint: `If ${VALIDATION.MIN_ADULT_AGE} or older, please add as an adult instead`,
    };
  }

  return { isValid: true };
};

/**
 * State selection validation messages
 */
export const validateStateWithMessage = (state: string): ValidationResult => {
  if (!state || state.trim().length === 0) {
    return {
      isValid: false,
      error: 'State is required',
      hint: 'Select the state where this residence is located',
    };
  }

  return { isValid: true };
};

/**
 * Insurance carrier validation messages
 */
export const validateCarrierWithMessage = (carrier: string): ValidationResult => {
  if (!carrier || carrier.trim().length === 0) {
    return {
      isValid: false,
      error: 'Insurance carrier name is required',
      hint: 'Enter the name of your insurance company (e.g., Blue Cross, Aetna)',
    };
  }

  if (carrier.trim().length < 2) {
    return {
      isValid: false,
      error: 'Carrier name is too short',
      hint: 'Enter at least 2 characters',
    };
  }

  if (carrier.trim().length > 100) {
    return {
      isValid: false,
      error: 'Carrier name is too long',
      hint: `Maximum 100 characters. Currently ${carrier.trim().length} characters.`,
    };
  }

  return { isValid: true };
};

/**
 * Plan type validation messages
 */
export const validatePlanTypeWithMessage = (planType: string): ValidationResult => {
  if (!planType || planType.trim().length === 0) {
    return {
      isValid: false,
      error: 'Plan type is required',
      hint: 'Select your current insurance plan type',
    };
  }

  return { isValid: true };
};

/**
 * Monthly cost validation messages
 */
export const validateMonthlyCostWithMessage = (cost: number | null | undefined): ValidationResult => {
  if (cost === null || cost === undefined || isNaN(cost)) {
    return {
      isValid: false,
      error: 'Monthly cost is required',
      hint: 'Enter your monthly premium amount',
    };
  }

  if (cost < 0) {
    return {
      isValid: false,
      error: 'Cost cannot be negative',
      hint: 'Enter a positive dollar amount',
    };
  }

  if (cost === 0) {
    return {
      isValid: false,
      error: 'Cost must be greater than $0',
      hint: 'Enter your monthly premium (most plans cost $50-$2,000/month)',
    };
  }

  if (cost > 10000) {
    return {
      isValid: false,
      error: 'Cost seems unusually high',
      hint: 'Most premiums are under $10,000/month. Please verify.',
    };
  }

  return { isValid: true };
};

/**
 * Budget selection validation messages
 */
export const validateBudgetWithMessage = (budget: string): ValidationResult => {
  if (!budget || budget.trim().length === 0) {
    return {
      isValid: false,
      error: 'Budget range is required',
      hint: 'Select your preferred monthly budget for health insurance',
    };
  }

  return { isValid: true };
};

/**
 * Number of adults validation messages
 */
export const validateNumAdultsWithMessage = (numAdults: number): ValidationResult => {
  if (numAdults === 0) {
    return {
      isValid: false,
      error: 'At least one adult is required',
      hint: 'Select how many adults need coverage',
    };
  }

  if (numAdults > 10) {
    return {
      isValid: false,
      error: 'Maximum 10 adults allowed',
      hint: 'For larger groups, please contact us directly',
    };
  }

  return { isValid: true };
};

/**
 * Deductible validation messages
 */
export const validateDeductibleWithMessage = (deductible: number | null | undefined): ValidationResult => {
  if (deductible === null || deductible === undefined || isNaN(deductible)) {
    return { isValid: true }; // Optional field
  }

  if (deductible < 0) {
    return {
      isValid: false,
      error: 'Deductible cannot be negative',
      hint: 'Enter a positive dollar amount or leave blank',
    };
  }

  if (deductible > 50000) {
    return {
      isValid: false,
      error: 'Deductible seems unusually high',
      hint: 'Most deductibles are under $50,000. Please verify.',
    };
  }

  return { isValid: true };
};

/**
 * Out-of-pocket max validation messages
 */
export const validateOutOfPocketMaxWithMessage = (amount: number | null | undefined): ValidationResult => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return { isValid: true }; // Optional field
  }

  if (amount < 0) {
    return {
      isValid: false,
      error: 'Out-of-pocket maximum cannot be negative',
      hint: 'Enter a positive dollar amount or leave blank',
    };
  }

  if (amount > 100000) {
    return {
      isValid: false,
      error: 'Out-of-pocket maximum seems unusually high',
      hint: 'Most out-of-pocket maximums are under $100,000. Please verify.',
    };
  }

  return { isValid: true };
};
