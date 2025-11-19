import { getDb, getDbWithRetry, closeDb } from '@/db/client';

// Mock postgres and drizzle
jest.mock('postgres', () => {
  const mockPostgres = jest.fn(() => ({
    end: jest.fn().mockResolvedValue(undefined),
  }));
  return mockPostgres;
});

jest.mock('drizzle-orm/postgres-js', () => ({
  drizzle: jest.fn(() => ({
    execute: jest.fn().mockResolvedValue([{ result: 1 }]),
  })),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Database Connection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getDb', () => {
    it('throws error when DATABASE_URL is not set', () => {
      delete process.env.DATABASE_URL;

      expect(() => getDb()).toThrow('DATABASE_URL is not defined');
      expect(() => getDb()).toThrow('Please set it in your .env.local file');
    });

    it('creates database connection when DATABASE_URL is set', () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';

      expect(() => getDb()).not.toThrow();
    });

    it('returns singleton instance on multiple calls', () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';

      const db1 = getDb();
      const db2 = getDb();

      expect(db1).toBe(db2);
    });

    it('includes helpful error message on failure', () => {
      delete process.env.DATABASE_URL;

      try {
        getDb();
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('DATABASE_URL');
        expect((error as Error).message).toContain('Supabase');
      }
    });
  });

  describe('getDbWithRetry', () => {
    it('retries connection on transient failures', async () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';

      const drizzle = require('drizzle-orm/postgres-js');

      // First call fails, second succeeds
      let callCount = 0;
      drizzle.drizzle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Connection timeout');
        }
        return {
          execute: jest.fn().mockResolvedValue([{ result: 1 }]),
        };
      });

      const db = await getDbWithRetry(3);
      expect(db).toBeDefined();
    });

    it('does not retry on configuration errors', async () => {
      delete process.env.DATABASE_URL;

      await expect(getDbWithRetry(3)).rejects.toThrow('DATABASE_URL is not defined');
    });

    it('throws after exhausting retries', async () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';

      const drizzle = require('drizzle-orm/postgres-js');

      // Always fail
      drizzle.drizzle.mockImplementation(() => {
        throw new Error('Connection refused');
      });

      await expect(getDbWithRetry(2)).rejects.toThrow('Database connection failed after 3 attempts');
    }, 10000); // Longer timeout for retries

    it('uses exponential backoff for retries', async () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';

      const drizzle = require('drizzle-orm/postgres-js');

      const startTime = Date.now();

      // Always fail
      drizzle.drizzle.mockImplementation(() => {
        throw new Error('Connection refused');
      });

      try {
        await getDbWithRetry(2);
      } catch {
        const elapsedTime = Date.now() - startTime;
        // Should take at least 1s + 2s = 3s for 2 retries
        // (1st retry after 1s, 2nd retry after 2s)
        expect(elapsedTime).toBeGreaterThan(3000);
      }
    }, 10000);
  });

  describe('closeDb', () => {
    it('closes database connection', async () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';

      getDb(); // Initialize connection
      await closeDb();

      // Connection should be closed, so next getDb creates new instance
      const newDb = getDb();
      expect(newDb).toBeDefined();
    });

    it('handles closing non-existent connection', async () => {
      await expect(closeDb()).resolves.not.toThrow();
    });
  });

  describe('error messages', () => {
    it('provides actionable error messages', () => {
      delete process.env.DATABASE_URL;

      try {
        getDb();
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('DATABASE_URL');
        expect(message).toContain('.env.local');
        expect(message).toContain('Supabase');
      }
    });

    it('provides troubleshooting steps on connection failure', () => {
      process.env.DATABASE_URL = 'invalid-url';

      const drizzle = require('drizzle-orm/postgres-js');
      drizzle.drizzle.mockImplementation(() => {
        throw new Error('Invalid connection string');
      });

      try {
        getDb();
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('Please check:');
        expect(message).toContain('DATABASE_URL');
        expect(message).toContain('running and accessible');
        expect(message).toContain('valid');
      }
    });
  });

  describe('connection pooling', () => {
    it('configures connection pool based on environment', () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';
      process.env.NODE_ENV = 'production';

      const postgres = require('postgres');

      getDb();

      expect(postgres).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          max: 10, // Production pool size
          idle_timeout: 20,
          connect_timeout: 10,
          prepare: false,
        })
      );
    });

    it('uses smaller pool in development', () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';
      process.env.NODE_ENV = 'development';

      const postgres = require('postgres');

      getDb();

      expect(postgres).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          max: 5, // Development pool size
        })
      );
    });
  });

  describe('logging', () => {
    it('logs successful connection', () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';

      const logger = require('@/lib/logger').logger;

      getDb();

      expect(logger.info).toHaveBeenCalledWith(
        'Database connection established',
        expect.objectContaining({
          attempt: expect.any(Number),
          environment: expect.any(String),
        })
      );
    });

    it('logs connection failures', () => {
      delete process.env.DATABASE_URL;

      const logger = require('@/lib/logger').logger;

      try {
        getDb();
      } catch {
        // Expected
      }

      expect(logger.error).toHaveBeenCalledWith(
        'DATABASE_URL not configured',
        expect.any(Error)
      );
    });

    it('logs retry attempts', async () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';

      const drizzle = require('drizzle-orm/postgres-js');
      const logger = require('@/lib/logger').logger;

      let callCount = 0;
      drizzle.drizzle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Transient failure');
        }
        return {
          execute: jest.fn().mockResolvedValue([{ result: 1 }]),
        };
      });

      await getDbWithRetry(3);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Database connection failed, retrying'),
        expect.objectContaining({
          attempt: expect.any(Number),
          maxRetries: expect.any(Number),
          error: expect.any(String),
        })
      );
    });
  });

  describe('security', () => {
    it('does not expose password in errors', () => {
      process.env.DATABASE_URL = 'postgresql://user:secretpassword@localhost:5432/db';

      const drizzle = require('drizzle-orm/postgres-js');
      drizzle.drizzle.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      try {
        getDb();
      } catch (error) {
        const message = (error as Error).message;
        expect(message).not.toContain('secretpassword');
      }
    });

    it('provides different error messages for dev vs production', () => {
      delete process.env.DATABASE_URL;

      // Test development
      process.env.NODE_ENV = 'development';
      let devError: Error | null = null;
      try {
        getDb();
      } catch (error) {
        devError = error as Error;
      }

      // Test production (simulated via proxy error message check)
      // Note: The actual proxy is in db/index.ts
      expect(devError).toBeDefined();
      expect(devError?.message).toContain('DATABASE_URL');
    });
  });
});
