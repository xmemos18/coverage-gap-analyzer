'use client';

/**
 * Calculator Error Boundary
 *
 * Specialized error handling for the calculator page to preserve user progress
 * and provide recovery options specific to the calculator workflow.
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export default function CalculatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[Calculator Error] Calculator page error', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    // Report to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white dark:bg-dark-800 rounded-xl shadow-xl p-8 text-center border border-gray-200 dark:border-dark-600">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Calculator Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We encountered an issue with the calculator. Your previous progress may be preserved.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors"
          >
            Resume Calculator
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Using <a> intentionally in error boundary since router may be broken */}
          <a
            href="/calculator"
            className="block w-full px-6 py-3 border-2 border-gray-300 dark:border-dark-500 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            Start Over
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Using <a> intentionally in error boundary since router may be broken */}
          <a
            href="/"
            className="block w-full px-6 py-3 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}
