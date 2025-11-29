/**
 * Sentry Server Configuration
 *
 * This file configures the initialization of Sentry on the server.
 * The config you add here will be used whenever the server handles a request.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Disable Sentry in development
  enabled: process.env.NODE_ENV === 'production',

  // Performance monitoring
  // Adjust sample rate in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set environment for filtering
  environment: process.env.NODE_ENV,

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
