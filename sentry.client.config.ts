/**
 * Sentry Client Configuration
 *
 * This file configures the initialization of Sentry on the client.
 * The config you add here will be used whenever a users loads a page in their browser.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Disable Sentry in development
  enabled: process.env.NODE_ENV === 'production',

  // Performance monitoring
  // Adjust sample rate in production - 1.0 captures 100% of transactions
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay for debugging user issues
  // This sets the sample rate for replays
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Set environment for filtering
  environment: process.env.NODE_ENV,

  // Ignore common non-actionable errors
  ignoreErrors: [
    // Random plugins/extensions
    'top.GLOBALS',
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Safari/Firefox private browsing
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network errors - user's connection issues
    'Failed to fetch',
    'NetworkError',
    'Load failed',
    // User aborted requests
    'AbortError',
    // Navigation interrupted
    'The operation was aborted',
  ],

  // Add context to help with debugging
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }

    // Add custom context
    event.contexts = {
      ...event.contexts,
      app: {
        name: 'Key Insurance Matters',
        version: process.env.npm_package_version || '1.0.0',
      },
    };

    return event;
  },
});
