/**
 * Environment Variables Configuration
 *
 * This module provides type-safe access to environment variables.
 * All NEXT_PUBLIC_ variables are available on both client and server.
 * Non-prefixed variables are server-side only.
 */

/**
 * Get an environment variable with type safety and validation
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];

  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    // Only throw in production if required env var is missing
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }

    return '';
  }

  return value;
}

/**
 * Get a boolean environment variable
 */
function getBooleanEnvVar(key: string, defaultValue = false): boolean {
  const value = process.env[key];

  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get a number environment variable
 */
function getNumberEnvVar(key: string, defaultValue: number): number {
  const value = process.env[key];

  if (value === undefined) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    console.warn(`Invalid number for ${key}: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }

  return parsed;
}

/**
 * Application Configuration
 */
export const env = {
  // Application Info
  appName: getEnvVar('NEXT_PUBLIC_APP_NAME', 'Key Insurance Matters'),
  appVersion: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Feature Flags
  enableAnalytics: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', false),
  enableDebug: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_DEBUG', false),

  // Analytics
  analyticsId: getEnvVar('NEXT_PUBLIC_ANALYTICS_ID', ''),

  // Application Limits
  maxResidences: getNumberEnvVar('NEXT_PUBLIC_MAX_RESIDENCES', 5),
  maxAdults: getNumberEnvVar('NEXT_PUBLIC_MAX_ADULTS', 10),
  maxChildren: getNumberEnvVar('NEXT_PUBLIC_MAX_CHILDREN', 10),

  // Session
  sessionTimeoutHours: getNumberEnvVar('NEXT_PUBLIC_SESSION_TIMEOUT_HOURS', 24),

  // API Configuration
  apiBaseUrl: getEnvVar('NEXT_PUBLIC_API_BASE_URL', '/api'),

  // External API Keys (optional)
  healthcareGovApiKey: getEnvVar('NEXT_PUBLIC_HEALTHCARE_GOV_API_KEY', ''),
} as const;

/**
 * Validate all required environment variables on startup
 * This runs once when the module is imported
 */
export function validateEnv(): void {
  const requiredVars: string[] = [
    'NODE_ENV',
    // Add more required variables as needed:
    // 'HEALTHCARE_GOV_API_KEY', // Uncomment when API key is required for production
  ];

  const missing = requiredVars.filter(key => !process.env[key]);

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required environment variables:\n${missing.map(key => `  - ${key}`).join('\n')}`
    );
  }
}

// Validate on module load (only in production)
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}

/**
 * Type-safe environment variable access
 * Usage: import { env } from '@/lib/env';
 */
export default env;
