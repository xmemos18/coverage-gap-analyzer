/**
 * Form field wrapper component
 * Combines label, input, error, hint, and success indicator
 */

import React from 'react';
import ErrorMessage from './ErrorMessage';
import FieldHint from './FieldHint';
import SuccessIndicator from './SuccessIndicator';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  showSuccess?: boolean;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({
  label,
  htmlFor,
  error,
  hint,
  showSuccess = false,
  required = false,
  children,
  className = '',
}: FormFieldProps) {
  const hasError = !!error;

  return (
    <div className={`${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>

      <div className="relative">
        {children}

        {/* Success indicator in input (absolute positioned) */}
        {showSuccess && !hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && <ErrorMessage error={error} />}

      {/* Hint (only show if no error) */}
      {!hasError && hint && <FieldHint hint={hint} />}

      {/* Success message (only show if explicitly requested and no error) */}
      {!hasError && showSuccess && (
        <SuccessIndicator show={true} message="Looks good!" />
      )}
    </div>
  );
}
