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
 * Environment variable categories
 */
interface EnvValidationConfig {
  /** Critical variables required in all environments */
  critical: string[];
  /** Variables recommended for production */
  recommended: string[];
  /** Optional variables that enhance functionality */
  optional: string[];
}

/**
 * Define environment variable requirements
 */
const ENV_CONFIG: EnvValidationConfig = {
  // Critical: Required in all environments for core functionality
  critical: [
    'DATABASE_URL',
  ],
  // Recommended: Should be set in production
  recommended: [
    'HEALTHCARE_GOV_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ],
  // Optional: Enhance functionality but not required
  optional: [
    'MEDICARE_GOV_API_KEY',
    'NEXT_PUBLIC_SENTRY_DSN',
    'ALLOWED_ORIGINS',
  ],
};

/**
 * Validation result
 */
export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

/**
 * Validate all required environment variables
 * This runs once when the module is imported (server-side only)
 *
 * @returns Validation result with errors, warnings, and info
 */
export function validateEnv(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  // Only run validation on the server side
  if (typeof window !== 'undefined') {
    return result;
  }

  // Check critical variables (required in all environments)
  const missingCritical = ENV_CONFIG.critical.filter(key => !process.env[key]);

  if (missingCritical.length > 0) {
    result.isValid = false;
    result.errors.push(
      'Missing critical environment variables:',
      ...missingCritical.map(key => `  ❌ ${key} (REQUIRED)`)
    );

    // In development, provide helpful setup instructions
    if (process.env.NODE_ENV === 'development') {
      result.errors.push(
        '\n📝 Setup Instructions:',
        '1. Copy .env.example to .env.local',
        '2. Fill in the required values',
        '3. Restart the development server'
      );
    }
  }

  // Check recommended variables (warn in production)
  if (process.env.NODE_ENV === 'production') {
    const missingRecommended = ENV_CONFIG.recommended.filter(key => !process.env[key]);

    if (missingRecommended.length > 0) {
      result.warnings.push(
        'Missing recommended environment variables for production:',
        ...missingRecommended.map(key => `  ⚠️  ${key} (RECOMMENDED)`)
      );
    }
  }

  // Info about optional variables
  const missingOptional = ENV_CONFIG.optional.filter(key => !process.env[key]);

  if (missingOptional.length > 0 && process.env.NODE_ENV === 'development') {
    result.info.push(
      'Optional environment variables not set:',
      ...missingOptional.map(key => `  ℹ️  ${key} (OPTIONAL)`)
    );
  }

  return result;
}

/**
 * Log validation results
 */
function logValidationResults(result: EnvValidationResult): void {
  if (result.errors.length > 0) {
    console.error('\n❌ Environment Variable Errors:');
    result.errors.forEach(msg => console.error(msg));
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:');
    result.warnings.forEach(msg => console.warn(msg));
  }

  if (result.info.length > 0 && process.env.NODE_ENV === 'development') {
    console.info('\nℹ️  Environment Variable Info:');
    result.info.forEach(msg => console.info(msg));
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ Environment variables validated successfully');
  }
}

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  const validationResult = validateEnv();
  logValidationResults(validationResult);

  // Throw error if critical variables are missing
  if (!validationResult.isValid) {
    throw new Error(
      'Critical environment variables are missing. Please check the console output above.'
    );
  }
}

/**
 * Type-safe environment variable access
 * Usage: import { env } from '@/lib/env';
 */
export default env;
