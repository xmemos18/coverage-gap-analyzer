'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import env from '@/lib/env';
import { initializeAnalytics, trackPageView } from '@/lib/analytics';

/**
 * Analytics component for Google Analytics 4
 * Only loads if analytics is enabled in environment
 */
export function GoogleAnalytics() {
  const pathname = usePathname();

  // Track page views on route change
  useEffect(() => {
    if (env.enableAnalytics && env.analyticsId) {
      trackPageView(pathname);
    }
  }, [pathname]);

  // Initialize analytics on mount
  useEffect(() => {
    initializeAnalytics();
  }, []);

  // Don't render anything if analytics is disabled
  if (!env.enableAnalytics || !env.analyticsId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${env.analyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${env.analyticsId}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>
    </>
  );
}

/**
 * Plausible Analytics component
 * Privacy-focused alternative to Google Analytics
 */
export function PlausibleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (env.enableAnalytics && env.analyticsId) {
      trackPageView(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    initializeAnalytics();
  }, []);

  if (!env.enableAnalytics || !env.analyticsId) {
    return null;
  }

  return (
    <Script
      defer
      data-domain={env.analyticsId}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}

/**
 * Main Analytics component
 * Detects and loads appropriate analytics provider based on ID format
 */
export default function Analytics() {
  // Detect analytics provider by ID format
  const isGoogleAnalytics = env.analyticsId?.startsWith('G-') || env.analyticsId?.startsWith('UA-');
  const isPlausible = env.analyticsId && !isGoogleAnalytics;

  if (!env.enableAnalytics || !env.analyticsId) {
    return null;
  }

  if (isGoogleAnalytics) {
    return <GoogleAnalytics />;
  }

  if (isPlausible) {
    return <PlausibleAnalytics />;
  }

  return null;
}
