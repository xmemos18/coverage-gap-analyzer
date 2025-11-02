/**
 * Custom hook for form validation
 * Extracts validation logic from large form components
 */

import { useState, useCallback } from 'react';
import { FormErrors } from '@/types';

interface UseFormValidationProps {
  /**
   * Validation function that returns errors object
   */
  validateFn: () => FormErrors;

  /**
   * Optional callback when validation succeeds
   */
  onValidationSuccess?: () => void;

  /**
   * Optional callback when validation fails
   */
  onValidationError?: (errors: FormErrors) => void;
}

export function useFormValidation({
  validateFn,
  onValidationSuccess,
  onValidationError,
}: UseFormValidationProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Run validation and return whether form is valid
   */
  const validate = useCallback((): boolean => {
    setIsValidating(true);
    const newErrors = validateFn();
    setErrors(newErrors);
    setIsValidating(false);

    const isValid = Object.keys(newErrors).length === 0;

    if (isValid && onValidationSuccess) {
      onValidationSuccess();
    } else if (!isValid && onValidationError) {
      onValidationError(newErrors);
    }

    return isValid;
  }, [validateFn, onValidationSuccess, onValidationError]);

  /**
   * Clear all validation errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Clear a specific field error
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Set a specific field error
   */
  const setFieldError = useCallback((fieldName: string, errorMessage: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage,
    }));
  }, []);

  /**
   * Check if there are any errors
   */
  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    isValidating,
    hasErrors,
    validate,
    clearErrors,
    clearFieldError,
    setFieldError,
  };
}
