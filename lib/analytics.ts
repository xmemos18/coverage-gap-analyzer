/**
 * Analytics Integration
 *
 * Privacy-focused analytics tracking for user interactions.
 * Respects user privacy and environment configuration.
 */

import env from './env';

// Analytics event types
export type AnalyticsEvent =
  | 'calculator_started'
  | 'step_completed'
  | 'calculator_completed'
  | 'results_viewed'
  | 'results_printed'
  | 'results_exported'
  | 'results_shared'
  | 'error_occurred'
  | 'resume_data_used'
  | 'mode_toggled';

// Event properties
interface AnalyticsProperties {
  [key: string]: string | number | boolean;
}

/**
 * Track analytics event
 * Only tracks if analytics is enabled in environment
 */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
): void {
  // Skip if analytics disabled
  if (!env.enableAnalytics) {
    if (env.enableDebug) {
      console.log('[Analytics] Event (disabled):', event, properties);
    }
    return;
  }

  // Skip if no analytics ID configured
  if (!env.analyticsId) {
    if (env.enableDebug) {
      console.warn('[Analytics] No analytics ID configured');
    }
    return;
  }

  try {
    // Google Analytics 4 (gtag.js)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as Record<string, unknown>).gtag as (...args: unknown[]) => void;
      gtag('event', event, {
        ...properties,
        app_name: env.appName,
        app_version: env.appVersion,
      });

      if (env.enableDebug) {
        console.log('[Analytics] GA4 Event:', event, properties);
      }
    }
    // Plausible Analytics
    else if (typeof window !== 'undefined' && 'plausible' in window) {
      const plausible = (window as Record<string, unknown>).plausible as (event: string, options: { props: unknown }) => void;
      plausible(event, { props: properties });

      if (env.enableDebug) {
        console.log('[Analytics] Plausible Event:', event, properties);
      }
    }
    else if (env.enableDebug) {
      console.warn('[Analytics] No analytics library loaded');
    }
  } catch (error) {
    // Fail silently in production, log in debug mode
    if (env.enableDebug) {
      console.error('[Analytics] Error tracking event:', error);
    }
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  if (!env.enableAnalytics || !env.analyticsId) return;

  try {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as Record<string, unknown>).gtag as (...args: unknown[]) => void;
      gtag('config', env.analyticsId, {
        page_path: path,
        page_title: title,
      });
    }
    else if (typeof window !== 'undefined' && 'plausible' in window) {
      const plausible = (window as Record<string, unknown>).plausible as (event: string) => void;
      plausible('pageview');
    }
  } catch (error) {
    if (env.enableDebug) {
      console.error('[Analytics] Error tracking page view:', error);
    }
  }
}

/**
 * Track calculator step completion
 */
export function trackStepCompleted(step: number, stepName: string): void {
  trackEvent('step_completed', {
    step_number: step,
    step_name: stepName,
  });
}

/**
 * Track calculator completion
 */
export function trackCalculatorCompleted(
  numResidences: number,
  numAdults: number,
  numChildren: number,
  hasMedicare: boolean
): void {
  trackEvent('calculator_completed', {
    num_residences: numResidences,
    num_adults: numAdults,
    num_children: numChildren,
    has_medicare: hasMedicare,
  });
}

/**
 * Track results actions
 */
export function trackResultsAction(action: 'printed' | 'exported' | 'shared'): void {
  const eventMap = {
    printed: 'results_printed' as const,
    exported: 'results_exported' as const,
    shared: 'results_shared' as const,
  };

  trackEvent(eventMap[action]);
}

/**
 * Track error
 */
export function trackError(
  errorType: string,
  errorMessage?: string,
  errorContext?: string
): void {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage || 'unknown',
    error_context: errorContext || 'unknown',
  });
}

/**
 * Initialize analytics
 * Call this once on app load
 */
export function initializeAnalytics(): void {
  if (!env.enableAnalytics || !env.analyticsId) {
    if (env.enableDebug) {
      console.log('[Analytics] Analytics disabled or no ID configured');
    }
    return;
  }

  if (env.enableDebug) {
    console.log('[Analytics] Initialized with ID:', env.analyticsId);
  }
}
