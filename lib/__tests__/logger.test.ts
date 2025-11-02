import { logger, devLogger, perfLogger } from '../logger';

// Mock console methods
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
  log: console.log,
  table: console.table,
  group: console.group,
  groupEnd: console.groupEnd,
};

describe('Logger Utility', () => {
  beforeEach(() => {
    // Mock console methods
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
    console.table = jest.fn();
    console.group = jest.fn();
    console.groupEnd = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
    console.table = originalConsole.table;
    console.group = originalConsole.group;
    console.groupEnd = originalConsole.groupEnd;
  });

  describe('logger', () => {
    it('should log debug messages in development', () => {
      logger.debug('Test debug message');
      // In test environment, logging should work
      expect(console.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('Test info message');
      expect(console.info).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      expect(console.error).toHaveBeenCalled();
    });

    it('should include data in logs', () => {
      const testData = { foo: 'bar' };
      logger.info('Test with data', testData);
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Test with data'),
        testData
      );
    });

    it('should provide isEnabled method', () => {
      expect(typeof logger.isEnabled).toBe('function');
      expect(typeof logger.isEnabled()).toBe('boolean');
    });
  });

  describe('devLogger', () => {
    it('should provide log method', () => {
      devLogger.log('Dev log test');
      // Dev logger uses console.log
      expect(console.log).toHaveBeenCalled();
    });

    it('should provide table method', () => {
      devLogger.table({ test: 'data' });
      expect(console.table).toHaveBeenCalled();
    });

    it('should provide group methods', () => {
      devLogger.group('Test Group');
      expect(console.group).toHaveBeenCalledWith('Test Group');

      devLogger.groupEnd();
      expect(console.groupEnd).toHaveBeenCalled();
    });
  });

  describe('perfLogger', () => {
    it('should measure performance', () => {
      const end = perfLogger.start('Test operation');

      // Simulate some work
      for (let i = 0; i < 1000; i++) {
        Math.sqrt(i);
      }

      end();

      // Should have logged performance info
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('Test operation took'),
        expect.anything()
      );
    });

    it('should return a function from start', () => {
      const end = perfLogger.start('Test');
      expect(typeof end).toBe('function');
      end();
    });
  });
});
