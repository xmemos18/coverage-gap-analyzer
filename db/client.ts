/**
 * Database Client Configuration
 * Drizzle ORM connection to PostgreSQL via Supabase
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Singleton pattern for database connection
let connection: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Get database connection
 * Uses connection pooling for optimal performance
 */
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not defined. Please set it in your .env.local file.\n' +
      'Get your connection string from Supabase: Settings → Database → Connection string'
    );
  }

  // Return existing connection if available
  if (db) {
    return db;
  }

  // Create new connection
  connection = postgres(process.env.DATABASE_URL, {
    max: process.env.NODE_ENV === 'production' ? 10 : 5, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Required for Supabase
  });

  db = drizzle(connection, { schema });

  return db;
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
