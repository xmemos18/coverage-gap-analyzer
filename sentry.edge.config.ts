/**
 * Sentry Edge Configuration
 *
 * This file configures the initialization of Sentry on the Edge runtime.
 * Used for middleware and edge API routes.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Disable Sentry in development
  enabled: process.env.NODE_ENV === 'production',

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set environment for filtering
  environment: process.env.NODE_ENV,
});
