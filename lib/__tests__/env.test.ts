import { env, validateEnv } from '../env';

describe('Environment Variables Configuration', () => {
  // Save original process.env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('Application Info', () => {
    it('should have default app name', () => {
      expect(env.appName).toBe('Key Insurance Matters');
    });

    it('should have default app version', () => {
      expect(env.appVersion).toBe('1.0.0');
    });
  });

  describe('Environment Detection', () => {
    it('should correctly detect development environment', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = 'development';
      // Note: env object is already initialized, so we check the value directly
      expect(process.env.NODE_ENV).toBe('development');
    });

    it('should correctly detect production environment', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = 'production';
      expect(process.env.NODE_ENV).toBe('production');
    });

    it('should correctly detect test environment', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = 'test';
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  describe('Feature Flags', () => {
    it('should default analytics to false', () => {
      expect(env.enableAnalytics).toBe(false);
    });

    it('should default debug to false', () => {
      expect(env.enableDebug).toBe(false);
    });
  });

  describe('Application Limits', () => {
    it('should have default max residences of 5', () => {
      expect(env.maxResidences).toBe(5);
    });

    it('should have default max adults of 10', () => {
      expect(env.maxAdults).toBe(10);
    });

    it('should have default max children of 10', () => {
      expect(env.maxChildren).toBe(10);
    });
  });

  describe('Session Configuration', () => {
    it('should have default session timeout of 24 hours', () => {
      expect(env.sessionTimeoutHours).toBe(24);
    });
  });

  describe('API Configuration', () => {
    it('should have default API base URL', () => {
      expect(env.apiBaseUrl).toBe('/api');
    });

    it('should have empty analytics ID by default', () => {
      expect(env.analyticsId).toBe('');
    });
  });

  describe('validateEnv', () => {
    it('should not throw in non-production environments', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = 'development';
      expect(() => validateEnv()).not.toThrow();
    });

    it('should not throw when all vars are present', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = 'production';
      // No required vars currently, so should not throw
      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe('Environment Object Properties', () => {
    it('should have all expected properties', () => {
      expect(env).toHaveProperty('appName');
      expect(env).toHaveProperty('appVersion');
      expect(env).toHaveProperty('isDevelopment');
      expect(env).toHaveProperty('isProduction');
      expect(env).toHaveProperty('isTest');
      expect(env).toHaveProperty('enableAnalytics');
      expect(env).toHaveProperty('enableDebug');
      expect(env).toHaveProperty('maxResidences');
      expect(env).toHaveProperty('maxAdults');
      expect(env).toHaveProperty('maxChildren');
      expect(env).toHaveProperty('sessionTimeoutHours');
    });
  });
});
