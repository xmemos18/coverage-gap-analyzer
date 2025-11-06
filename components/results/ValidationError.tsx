/**
 * Validation Error Component
 *
 * Displays validation errors when URL parameters are invalid on the results page.
 */

import Link from 'next/link';
import { ValidationError as ValidationErrorType } from '@/lib/urlValidation';

interface ValidationErrorProps {
  errors: ValidationErrorType[];
  warnings: ValidationErrorType[];
}

export default function ValidationError({ errors, warnings }: ValidationErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-red-500 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-12 w-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Invalid URL Parameters
                </h1>
                <p className="text-red-100 mt-1">
                  The results page URL contains invalid or missing data
                </p>
              </div>
            </div>
          </div>

          {/* Error Details */}
          <div className="p-8">
            {/* Errors */}
            {errors.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="h-6 w-6 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Errors Found ({errors.length})
                </h2>
                <div className="space-y-3">
                  {errors.map((error, index) => (
                    <div
                      key={index}
                      className="bg-red-50 border-l-4 border-red-500 p-4 rounded"
                    >
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800 font-medium">
                            {error.message}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Field: <span className="font-mono">{error.field}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="h-6 w-6 text-yellow-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Warnings ({warnings.length})
                </h2>
                <div className="space-y-3">
                  {warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"
                    >
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-yellow-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800 font-medium">
                            {warning.message}
                          </p>
                          <p className="text-xs text-yellow-600 mt-1">
                            Field: <span className="font-mono">{warning.field}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                What does this mean?
              </h3>
              <p className="text-blue-800 mb-4">
                The URL you used to access this results page contains data that doesn&apos;t meet
                the requirements. This usually happens when:
              </p>
              <ul className="list-disc list-inside text-blue-800 space-y-1 mb-4">
                <li>The URL was manually edited or corrupted</li>
                <li>Required parameters are missing</li>
                <li>Values are outside acceptable ranges</li>
                <li>The link was shared incorrectly</li>
              </ul>
              <p className="text-blue-800">
                To get personalized insurance recommendations, please complete the calculator
                with your correct information.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/calculator"
                className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-500 shadow-lg transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Start Calculator
                </span>
              </Link>
              <Link
                href="/"
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-lg font-semibold text-center hover:bg-gray-200 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Go to Homepage
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-900 text-gray-100 rounded-lg p-6 font-mono text-sm overflow-auto">
            <h4 className="font-bold mb-2 text-gray-400">Debug Information:</h4>
            <div className="space-y-2">
              <div>
                <span className="text-red-400">Errors ({errors.length}):</span>
                <pre className="ml-4 text-xs overflow-x-auto">
                  {JSON.stringify(errors, null, 2)}
                </pre>
              </div>
              {warnings.length > 0 && (
                <div>
                  <span className="text-yellow-400">Warnings ({warnings.length}):</span>
                  <pre className="ml-4 text-xs overflow-x-auto">
                    {JSON.stringify(warnings, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
