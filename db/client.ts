/**
 * Database Client Configuration
 * Drizzle ORM connection to PostgreSQL via Supabase
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';
import { logger } from '@/lib/logger';

// Singleton pattern for database connection
let connection: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let connectionAttempts = 0;
let lastConnectionError: Error | null = null;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second
const MAX_RETRY_DELAY_MS = 10000; // 10 seconds

/**
 * Sleep for specified milliseconds
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
  return Math.min(delay, MAX_RETRY_DELAY_MS);
}

/**
 * Test database connection by executing a simple query
 */
async function testConnection(dbInstance: ReturnType<typeof drizzle>): Promise<boolean> {
  try {
    // Execute a simple query to test connection
    await dbInstance.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    logger.error('Database connection test failed', error);
    return false;
  }
}

/**
 * Get database connection with retry logic
 * Uses connection pooling for optimal performance
 *
 * @throws {Error} If DATABASE_URL is not configured
 * @throws {Error} If connection fails after all retries
 */
export function getDb() {
  if (!process.env.DATABASE_URL) {
    const error = new Error(
      'DATABASE_URL is not defined. Please set it in your .env.local file.\n' +
      'Get your connection string from Supabase: Settings → Database → Connection string'
    );
    logger.error('DATABASE_URL not configured', error);
    throw error;
  }

  // Return existing connection if available
  if (db) {
    return db;
  }

  try {
    // Create new connection
    connection = postgres(process.env.DATABASE_URL, {
      max: process.env.NODE_ENV === 'production' ? 10 : 5, // Connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Required for Supabase
      onnotice: () => {}, // Suppress notices
      onparameter: () => {}, // Suppress parameter changes
    });

    db = drizzle(connection, { schema });

    connectionAttempts++;
    lastConnectionError = null;

    logger.info('Database connection established', {
      attempt: connectionAttempts,
      environment: process.env.NODE_ENV,
    });

    return db;
  } catch (error) {
    connectionAttempts++;
    lastConnectionError = error instanceof Error ? error : new Error(String(error));

    logger.error('Database connection failed', {
      attempt: connectionAttempts,
      error: lastConnectionError,
    });

    // Clean up failed connection
    if (connection) {
      try {
        connection.end();
      } catch {
        // Ignore cleanup errors
      }
      connection = null;
    }
    db = null;

    throw new Error(
      `Failed to connect to database: ${lastConnectionError.message}\n` +
      'Please check:\n' +
      '1. DATABASE_URL is correctly set in .env.local\n' +
      '2. Database server is running and accessible\n' +
      '3. Credentials are valid\n' +
      '4. Network connection is stable'
    );
  }
}

/**
 * Get database connection with retry logic for transient failures
 *
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Database instance
 * @throws {Error} If connection fails after all retries
 */
export async function getDbWithRetry(maxRetries: number = MAX_RETRIES) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const dbInstance = getDb();

      // Test the connection
      const isConnected = await testConnection(dbInstance);
      if (!isConnected) {
        throw new Error('Connection test failed');
      }

      if (attempt > 0) {
        logger.info('Database connection successful after retry', { attempt });
      }

      return dbInstance;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry for configuration errors
      if (
        lastError.message.includes('DATABASE_URL is not defined') ||
        lastError.message.includes('authentication failed')
      ) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      const delay = getRetryDelay(attempt);
      logger.warn(`Database connection failed, retrying in ${delay}ms`, {
        attempt: attempt + 1,
        maxRetries,
        error: lastError.message,
      });

      await sleep(delay);

      // Reset connection state for retry
      if (connection) {
        try {
          await connection.end();
        } catch {
          // Ignore cleanup errors
        }
        connection = null;
        db = null;
      }
    }
  }

  const error = new Error(
    `Database connection failed after ${maxRetries + 1} attempts.\n` +
    `Last error: ${lastError?.message || 'Unknown error'}\n` +
    'Please check your database configuration and network connectivity.'
  );

  logger.error('Database connection exhausted all retries', {
    maxRetries,
    lastError: lastError?.message,
  });

  throw error;
}

/**
 * Close database connection
 * Call this when shutting down the application
 */
export async function closeDb() {
  if (connection) {
    await connection.end();
    connection = null;
    db = null;
  }
}

/**
 * Get connection stats (for monitoring)
 */
export function getConnectionStats() {
  if (!connection) {
    return null;
  }

  return {
    connectionString: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'), // Hide password
    isConnected: !!db,
  };
}

// Export singleton instance
export const dbClient = {
  get: getDb,
  close: closeDb,
  stats: getConnectionStats,
};
