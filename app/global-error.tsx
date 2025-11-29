'use client';

/**
 * Global Error Boundary
 *
 * This component catches errors that occur in the root layout itself.
 * It must define its own <html> and <body> tags since it replaces the root layout.
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    logger.error('[Global Error] Application error', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    // Report to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                We encountered an unexpected error. Our team has been notified.
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mb-4">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors"
              >
                Try Again
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Using <a> intentionally in error boundary since router may be broken */}
              <a
                href="/"
                className="block w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
