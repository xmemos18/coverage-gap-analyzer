import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  async headers() {
    // Content Security Policy directives
    const cspDirectives = [
      "default-src 'self'",
      // IMPORTANT: Next.js requires 'unsafe-eval' for webpack hot module replacement
      // and 'unsafe-inline' for dynamic script injection and hydration. These cannot be removed.
      // Next.js injects inline scripts for hydration, SSR, and dynamic imports even in production.
      // See: https://nextjs.org/docs/advanced-features/security-headers
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://plausible.io`,
      // Styles require 'unsafe-inline' for Next.js styled-jsx and CSS-in-JS
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com https://plausible.io https://api.zippopotam.us https://marketplace.api.healthcare.gov",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "upgrade-insecure-requests",
      // Report CSP violations in production (can be configured with a reporting endpoint)
      // "report-uri /api/csp-report",
    ];

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          // Content Security Policy - prevents XSS attacks
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; '),
          },
          // Strict Transport Security - enforce HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Enable browser XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy (formerly Feature-Policy)
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()',
              'interest-cohort=()', // Disable FLoC
            ].join(', '),
          },
          // Cross-Origin Embedder Policy - provides isolation
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          // Cross-Origin Opener Policy - prevents cross-origin attacks
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          // Cross-Origin Resource Policy - controls resource sharing
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          // X-DNS-Prefetch-Control - control DNS prefetching
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // X-Download-Options - prevent download prompt injection
          {
            key: 'X-Download-Options',
            value: 'noopen',
          },
          // X-Permitted-Cross-Domain-Policies - restrict Adobe Flash/PDF cross-domain
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
