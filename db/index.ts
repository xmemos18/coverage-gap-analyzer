/**
 * Database Exports
 * Central export point for database client and schema
 */

import { getDb } from './client';
import { logger } from '@/lib/logger';

// Lazy database client - only connects when first accessed
// This prevents connection attempts during build time
let dbInstance: ReturnType<typeof getDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    if (!dbInstance) {
      try {
        dbInstance = getDb();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Database initialization failed in proxy', {
          error: err.message,
          stack: err.stack,
        });

        // Re-throw with user-friendly message
        throw new Error(
          'Database connection unavailable. Please check your configuration and try again.\n' +
          (process.env.NODE_ENV === 'development'
            ? `Details: ${err.message}`
            : 'Please contact support if the problem persists.')
        );
      }
    }
    if (typeof prop === 'symbol') {
      return (dbInstance as unknown as Record<symbol, unknown>)[prop];
    }
    return (dbInstance as unknown as Record<string, unknown>)[prop];
  }
});

// Re-export everything from schema for convenience
export * from './schema';

// Re-export client utilities
export { getDb, getDbWithRetry, closeDb, getConnectionStats, dbClient } from './client';
