/**
 * Database Exports
 * Central export point for database client and schema
 */

import { getDb } from './client';

// Lazy database client - only connects when first accessed
// This prevents connection attempts during build time
let dbInstance: ReturnType<typeof getDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    if (!dbInstance) {
      dbInstance = getDb();
    }
    return (dbInstance as any)[prop];
  }
});

// Re-export everything from schema for convenience
export * from './schema';

// Re-export client utilities
export { getDb, closeDb, getConnectionStats, dbClient } from './client';
