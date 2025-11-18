/**
 * Database Exports
 * Central export point for database client and schema
 */

import { getDb } from './client';

// Export the database client instance
export const db = getDb();

// Re-export everything from schema for convenience
export * from './schema';

// Re-export client utilities
export { getDb, closeDb, getConnectionStats, dbClient } from './client';
