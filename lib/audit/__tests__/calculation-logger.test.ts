/**
 * Calculation Logger Tests
 */

import {
  CalculationLogger,
  hashInput,
  createInMemoryLogger,
  type CalculationType,
} from '../calculation-logger';

describe('Calculation Logger', () => {
  let logger: CalculationLogger;

  beforeEach(() => {
    logger = createInMemoryLogger('1.0.0', { sessionId: 'test-session' });
  });

  describe('hashInput', () => {
    it('should generate consistent hash for same input', () => {
      const input = { a: 1, b: 'test', c: [1, 2, 3] };

      const hash1 = hashInput(input);
      const hash2 = hashInput(input);

      expect(hash1).toBe(hash2);
    });

    it('should generate same hash regardless of key order', () => {
      const input1 = { a: 1, b: 2, c: 3 };
      const input2 = { c: 3, a: 1, b: 2 };

      expect(hashInput(input1)).toBe(hashInput(input2));
    });

    it('should generate different hash for different input', () => {
      const input1 = { a: 1 };
      const input2 = { a: 2 };

      expect(hashInput(input1)).not.toBe(hashInput(input2));
    });

    it('should handle nested objects', () => {
      const input = {
        outer: {
          inner: {
            value: 42,
          },
        },
      };

      const hash = hashInput(input);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(8); // 8 character hex string
    });

    it('should handle arrays', () => {
      const input = { values: [1, 2, 3, 4, 5] };
      const hash = hashInput(input);

      expect(typeof hash).toBe('string');
    });
  });

  describe('logCalculation', () => {
    it('should log synchronous calculation', () => {
      const input = { x: 10, y: 20 };
      const result = logger.logCalculation(
        'subsidy',
        input,
        (inp) => ({ sum: inp.x + inp.y })
      );

      expect(result).toEqual({ sum: 30 });

      const logs = logger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].calculationType).toBe('subsidy');
      expect(logs[0].input).toEqual(input);
      expect(logs[0].output).toEqual({ sum: 30 });
    });

    it('should measure duration', () => {
      logger.logCalculation(
        'subsidy',
        { x: 1 },
        () => {
          // Simulate some work
          let sum = 0;
          for (let i = 0; i < 1000; i++) sum += i;
          return { result: sum };
        }
      );

      const logs = logger.getLogs();
      expect(logs[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should include version and metadata', () => {
      logger.logCalculation('hsa', { x: 1 }, () => ({ y: 2 }));

      const logs = logger.getLogs();
      expect(logs[0].version).toBe('1.0.0');
      expect(logs[0].metadata?.sessionId).toBe('test-session');
    });

    it('should generate unique IDs', () => {
      logger.logCalculation('subsidy', { x: 1 }, () => ({ y: 1 }));
      logger.logCalculation('subsidy', { x: 2 }, () => ({ y: 2 }));

      const logs = logger.getLogs();
      expect(logs[0].id).not.toBe(logs[1].id);
    });
  });

  describe('logAsyncCalculation', () => {
    it('should log async calculation', async () => {
      const input = { delay: 10 };
      const result = await logger.logAsyncCalculation(
        'monte-carlo',
        input,
        async () => {
          await new Promise((r) => setTimeout(r, 10));
          return { completed: true };
        }
      );

      expect(result).toEqual({ completed: true });

      const logs = logger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].calculationType).toBe('monte-carlo');
    });

    it('should measure async duration', async () => {
      await logger.logAsyncCalculation(
        'monte-carlo',
        { x: 1 },
        async () => {
          await new Promise((r) => setTimeout(r, 50));
          return { done: true };
        }
      );

      const logs = logger.getLogs();
      expect(logs[0].duration).toBeGreaterThanOrEqual(45); // Allow some variance
    });
  });

  describe('log', () => {
    it('should manually log a calculation', () => {
      const entry = logger.log(
        'break-even',
        { planA: 100, planB: 200 },
        { breakEvenPoint: 150 },
        25
      );

      expect(entry.id).toBeDefined();
      expect(entry.calculationType).toBe('break-even');
      expect(entry.duration).toBe(25);
    });
  });

  describe('getLogs', () => {
    it('should return all logs', () => {
      logger.logCalculation('subsidy', { x: 1 }, () => ({ y: 1 }));
      logger.logCalculation('hsa', { x: 2 }, () => ({ y: 2 }));
      logger.logCalculation('magi', { x: 3 }, () => ({ y: 3 }));

      const logs = logger.getLogs();
      expect(logs.length).toBe(3);
    });

    it('should return most recent first', () => {
      logger.logCalculation('subsidy', { x: 1 }, () => ({ y: 1 }));
      logger.logCalculation('hsa', { x: 2 }, () => ({ y: 2 }));

      const logs = logger.getLogs();
      expect(logs[0].calculationType).toBe('hsa');
      expect(logs[1].calculationType).toBe('subsidy');
    });
  });

  describe('getLog', () => {
    it('should get log by ID', () => {
      logger.logCalculation('subsidy', { x: 1 }, () => ({ y: 1 }));
      const logs = logger.getLogs();
      const id = logs[0].id;

      const retrieved = logger.getLog(id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(id);
    });

    it('should return null for unknown ID', () => {
      const result = logger.getLog('unknown-id');
      expect(result).toBeNull();
    });
  });

  describe('getLogsByHash', () => {
    it('should find logs with same input hash', () => {
      const input = { x: 42 };
      logger.logCalculation('subsidy', input, () => ({ y: 1 }));
      logger.logCalculation('subsidy', input, () => ({ y: 2 })); // Same input

      const hash = hashInput(input);
      const matches = logger.getLogsByHash(hash);

      expect(matches.length).toBe(2);
    });

    it('should return empty for unmatched hash', () => {
      const matches = logger.getLogsByHash('nonexistent');
      expect(matches).toEqual([]);
    });
  });

  describe('getLogsByType', () => {
    it('should filter by calculation type', () => {
      logger.logCalculation('subsidy', { x: 1 }, () => ({ y: 1 }));
      logger.logCalculation('hsa', { x: 2 }, () => ({ y: 2 }));
      logger.logCalculation('subsidy', { x: 3 }, () => ({ y: 3 }));

      const subsidyLogs = logger.getLogsByType('subsidy');
      expect(subsidyLogs.length).toBe(2);

      const hsaLogs = logger.getLogsByType('hsa');
      expect(hsaLogs.length).toBe(1);
    });
  });

  describe('getRecentLogs', () => {
    it('should return limited recent logs', () => {
      for (let i = 0; i < 10; i++) {
        logger.logCalculation('subsidy', { x: i }, () => ({ y: i }));
      }

      const recent = logger.getRecentLogs(5);
      expect(recent.length).toBe(5);
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      logger.logCalculation('subsidy', { x: 1 }, () => ({ y: 1 }));
      logger.logCalculation('hsa', { x: 2 }, () => ({ y: 2 }));

      logger.clearLogs();

      expect(logger.getLogs()).toEqual([]);
    });
  });

  describe('exportLogs', () => {
    it('should export logs as JSON', () => {
      logger.logCalculation('subsidy', { x: 1 }, () => ({ y: 1 }));

      const exported = logger.exportLogs();
      const data = JSON.parse(exported);

      expect(data.exportedAt).toBeDefined();
      expect(data.version).toBe('1.0.0');
      expect(data.logs.length).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should calculate statistics', () => {
      logger.logCalculation('subsidy', { x: 1 }, () => ({ y: 1 }));
      logger.logCalculation('subsidy', { x: 2 }, () => ({ y: 2 }));
      logger.logCalculation('hsa', { x: 3 }, () => ({ y: 3 }));

      const stats = logger.getStats();

      expect(stats.totalCalculations).toBe(3);
      expect(stats.byType.subsidy).toBe(2);
      expect(stats.byType.hsa).toBe(1);
      expect(stats.uniqueInputs).toBe(3);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty logs', () => {
      const stats = logger.getStats();

      expect(stats.totalCalculations).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.uniqueInputs).toBe(0);
    });
  });

  describe('findCachedResult', () => {
    it('should find cached result for same input', () => {
      const input = { x: 42, y: 100 };
      logger.logCalculation('subsidy', input, () => ({ result: 142 }));

      const cached = logger.findCachedResult('subsidy', input);

      expect(cached).toEqual({ result: 142 });
    });

    it('should return null for different input', () => {
      logger.logCalculation('subsidy', { x: 1 }, () => ({ result: 1 }));

      const cached = logger.findCachedResult('subsidy', { x: 2 });

      expect(cached).toBeNull();
    });

    it('should return null for different calculation type', () => {
      const input = { x: 42 };
      logger.logCalculation('subsidy', input, () => ({ result: 42 }));

      const cached = logger.findCachedResult('hsa', input);

      expect(cached).toBeNull();
    });

    it('should return most recent cached result', () => {
      const input = { x: 42 };
      logger.logCalculation('subsidy', input, () => ({ result: 1 }));
      logger.logCalculation('subsidy', input, () => ({ result: 2 }));

      const cached = logger.findCachedResult('subsidy', input);

      expect(cached).toEqual({ result: 2 });
    });
  });

  describe('Calculation Types', () => {
    const types: CalculationType[] = [
      'subsidy',
      'cost-projection',
      'monte-carlo',
      'break-even',
      'hsa',
      'magi',
      'plan-comparison',
      'medicare-transition',
      'job-change',
    ];

    it('should support all calculation types', () => {
      for (const type of types) {
        logger.logCalculation(type, { test: true }, () => ({ logged: true }));
      }

      const logs = logger.getLogs();
      expect(logs.length).toBe(types.length);

      for (const type of types) {
        expect(logger.getLogsByType(type).length).toBe(1);
      }
    });
  });
});
