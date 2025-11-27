/**
 * Database Exports
 * Central export point for database client and schema
 */

import { getDb, getDbWithRetry, getConnectionStats } from './client';
import { logger } from '@/lib/logger';
import { sql } from 'drizzle-orm';

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

/**
 * Database Health Check Result
 */
export interface DatabaseHealthResult {
  healthy: boolean;
  latencyMs: number;
  connectionStats: ReturnType<typeof getConnectionStats>;
  error?: string;
  timestamp: string;
}

/**
 * Check database health and connectivity
 *
 * Performs a simple query to verify the database is accessible and responsive.
 * Use this for:
 * - Health check endpoints (/api/health)
 * - Startup verification
 * - Monitoring and alerting
 *
 * @returns Health check result with latency and connection stats
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const dbInstance = await getDbWithRetry(1); // Only 1 retry for health checks
    await dbInstance.execute(sql`SELECT 1 as health_check`);

    const latencyMs = Date.now() - startTime;

    logger.debug('Database health check passed', { latencyMs });

    return {
      healthy: true,
      latencyMs,
      connectionStats: getConnectionStats(),
      timestamp,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Database health check failed', { latencyMs, error: errorMessage });

    return {
      healthy: false,
      latencyMs,
      connectionStats: getConnectionStats(),
      error: errorMessage,
      timestamp,
    };
  }
}
