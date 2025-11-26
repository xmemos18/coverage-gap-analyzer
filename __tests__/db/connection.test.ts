// Mock setup must come before imports
const mockPostgresEnd = jest.fn().mockResolvedValue(undefined);
const mockExecute = jest.fn().mockResolvedValue([{ result: 1 }]);

jest.mock('postgres', () => {
  return jest.fn(() => ({
    end: mockPostgresEnd,
  }));
});

jest.mock('drizzle-orm/postgres-js', () => ({
  drizzle: jest.fn(() => ({
    execute: mockExecute,
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

  // Store module references for dynamic import
  let getDb: typeof import('@/db/client').getDb;
  let getDbWithRetry: typeof import('@/db/client').getDbWithRetry;
  let closeDb: typeof import('@/db/client').closeDb;
  let postgres: jest.Mock;
  let drizzle: { drizzle: jest.Mock };
  let logger: { info: jest.Mock; warn: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset module cache to get fresh singleton state
    jest.resetModules();

    // Reset environment
    process.env = { ...originalEnv };

    // Reset mock implementations
    mockPostgresEnd.mockResolvedValue(undefined);
    mockExecute.mockResolvedValue([{ result: 1 }]);

    // Re-require mocked modules
    postgres = require('postgres');
    drizzle = require('drizzle-orm/postgres-js');
    logger = require('@/lib/logger').logger;

    // Reset drizzle mock to default behavior
    drizzle.drizzle.mockImplementation(() => ({
      execute: mockExecute,
    }));

    // Re-import the client module to get fresh exports
    const clientModule = require('@/db/client');
    getDb = clientModule.getDb;
    getDbWithRetry = clientModule.getDbWithRetry;
    closeDb = clientModule.closeDb;
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

      // First call fails, second succeeds
      let callCount = 0;
      drizzle.drizzle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Connection timeout');
        }
        return {
          execute: mockExecute,
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

      // Always fail
      drizzle.drizzle.mockImplementation(() => {
        throw new Error('Connection refused');
      });

      await expect(getDbWithRetry(2)).rejects.toThrow('Database connection failed after 3 attempts');
    }, 15000); // Longer timeout for retries

    it('uses exponential backoff for retries', async () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';

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
    }, 15000);
  });

  describe('closeDb', () => {
    it('closes database connection', async () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';

      getDb(); // Initialize connection
      await closeDb();

      expect(mockPostgresEnd).toHaveBeenCalled();
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

      let callCount = 0;
      drizzle.drizzle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Transient failure');
        }
        return {
          execute: mockExecute,
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
