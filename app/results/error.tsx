'use client';

/**
 * Results Error Boundary
 *
 * Specialized error handling for the results page with options to
 * return to calculator or view saved results.
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[Results Error] Results page error', {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-orange-600 dark:text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Load Results
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We had trouble displaying your analysis results. This might be due to missing data or a temporary issue.
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
            Try Loading Again
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Using <a> intentionally in error boundary since router may be broken */}
          <a
            href="/calculator"
            className="block w-full px-6 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Run New Analysis
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
