describe('Redis Cache', () => {
  let CacheManager: typeof import('@/lib/cache/redis').CacheManager;
  let RateLimiter: typeof import('@/lib/cache/redis').RateLimiter;
  let generateCacheKey: typeof import('@/lib/cache/redis').generateCacheKey;
  let getRedisClient: typeof import('@/lib/cache/redis').getRedisClient;
  let cache: InstanceType<typeof import('@/lib/cache/redis').CacheManager>;

  beforeEach(() => {
    // Reset modules to get fresh singleton cache for each test
    jest.resetModules();

    // Re-import with fresh module
    const redisModule = require('@/lib/cache/redis');
    CacheManager = redisModule.CacheManager;
    RateLimiter = redisModule.RateLimiter;
    generateCacheKey = redisModule.generateCacheKey;
    getRedisClient = redisModule.getRedisClient;

    cache = new CacheManager('test', 60); // 60 second TTL
  });

  describe('CacheManager', () => {
    it('stores and retrieves values', async () => {
      await cache.set('key1', { data: 'value1' });
      const result = await cache.get<{ data: string }>('key1');

      expect(result).toEqual({ data: 'value1' });
    });

    it('returns null for non-existent keys', async () => {
      const result = await cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('deletes values', async () => {
      await cache.set('key1', 'value1');
      await cache.delete('key1');
      const result = await cache.get('key1');

      expect(result).toBeNull();
    });

    it('checks if key exists', async () => {
      await cache.set('key1', 'value1');

      const exists = await cache.exists('key1');
      expect(exists).toBe(true);

      const notExists = await cache.exists('non-existent');
      expect(notExists).toBe(false);
    });

    it('wraps function execution with caching', async () => {
      const expensiveFunction = jest.fn().mockResolvedValue('computed-value');

      // First call - should execute function
      const result1 = await cache.wrap('wrapped-key', expensiveFunction);
      expect(result1).toBe('computed-value');
      expect(expensiveFunction).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await cache.wrap('wrapped-key', expensiveFunction);
      expect(result2).toBe('computed-value');
      expect(expensiveFunction).toHaveBeenCalledTimes(1); // Not called again
    });

    it('prefixes cache keys correctly', async () => {
      const cache1 = new CacheManager('prefix1', 60);
      const cache2 = new CacheManager('prefix2', 60);

      await cache1.set('key', 'value1');
      await cache2.set('key', 'value2');

      const result1 = await cache1.get('key');
      const result2 = await cache2.get('key');

      expect(result1).toBe('value1');
      expect(result2).toBe('value2');
    });

    it('handles complex data structures', async () => {
      const complexData = {
        id: 123,
        name: 'Test',
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
      };

      await cache.set('complex', complexData);
      const result = await cache.get<typeof complexData>('complex');

      expect(result).toEqual(complexData);
    });

    it('respects custom TTL', async () => {
      // Set with short TTL
      await cache.set('short-lived', 'value', 1); // 1 second

      // Should exist immediately
      const exists = await cache.exists('short-lived');
      expect(exists).toBe(true);

      // Wait for expiration (mock or actual timeout)
      // Note: In real tests, you might mock time or use a longer timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired
      const result = await cache.get('short-lived');
      expect(result).toBeNull();
    }, 2000);

    it('gets remaining TTL', async () => {
      await cache.set('ttl-test', 'value', 60);
      const ttl = await cache.ttl('ttl-test');

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter('test-rate-limit', 5, 60); // 5 requests per 60 seconds
    });

    it('allows requests within limit', async () => {
      const result1 = await rateLimiter.checkLimit('user1');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = await rateLimiter.checkLimit('user1');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('blocks requests exceeding limit', async () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit('user1');
      }

      // Next request should be blocked
      const result = await rateLimiter.checkLimit('user1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('provides reset time', async () => {
      const result = await rateLimiter.checkLimit('user1');

      expect(result.resetTime).toBeGreaterThan(Date.now());
      expect(result.resetTime).toBeLessThanOrEqual(Date.now() + 60 * 1000);
    });

    it('isolates limits per identifier', async () => {
      // User 1
      await rateLimiter.checkLimit('user1');
      const result1 = await rateLimiter.checkLimit('user1');
      expect(result1.remaining).toBe(3);

      // User 2 should have separate limit
      const result2 = await rateLimiter.checkLimit('user2');
      expect(result2.remaining).toBe(4); // Fresh limit
    });

    it('resets limit after window expires', async () => {
      const shortLimiter = new RateLimiter('short-limit', 2, 1); // 2 requests per 1 second

      // Exhaust limit
      await shortLimiter.checkLimit('user1');
      await shortLimiter.checkLimit('user1');

      const blocked = await shortLimiter.checkLimit('user1');
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be allowed again
      const afterReset = await shortLimiter.checkLimit('user1');
      expect(afterReset.allowed).toBe(true);
    }, 2000);

    it('can reset limits manually', async () => {
      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit('user1');
      }

      const blocked = await rateLimiter.checkLimit('user1');
      expect(blocked.allowed).toBe(false);

      // Reset
      await rateLimiter.reset('user1');

      // Should be allowed again
      const afterReset = await rateLimiter.checkLimit('user1');
      expect(afterReset.allowed).toBe(true);
      expect(afterReset.remaining).toBe(4);
    });
  });

  describe('generateCacheKey', () => {
    it('generates consistent keys for same params', () => {
      const key1 = generateCacheKey('test', { a: 1, b: 2 });
      const key2 = generateCacheKey('test', { a: 1, b: 2 });

      expect(key1).toBe(key2);
    });

    it('generates different keys for different params', () => {
      const key1 = generateCacheKey('test', { a: 1, b: 2 });
      const key2 = generateCacheKey('test', { a: 1, b: 3 });

      expect(key1).not.toBe(key2);
    });

    it('generates consistent keys regardless of param order', () => {
      const key1 = generateCacheKey('test', { a: 1, b: 2, c: 3 });
      const key2 = generateCacheKey('test', { c: 3, a: 1, b: 2 });

      expect(key1).toBe(key2);
    });

    it('includes type in cache key', () => {
      const key1 = generateCacheKey('type1', { a: 1 });
      const key2 = generateCacheKey('type2', { a: 1 });

      expect(key1).not.toBe(key2);
      expect(key1).toContain('type1');
      expect(key2).toContain('type2');
    });

    it('handles empty params', () => {
      const key = generateCacheKey('test', {});
      expect(key).toBe('test:{}');
    });

    it('handles complex param values', () => {
      const params = {
        string: 'value',
        number: 123,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: { a: 1, b: 2 },
      };

      const key = generateCacheKey('complex', params);
      expect(key).toContain('complex');
      expect(key).toContain('value');
      expect(key).toContain('123');
    });
  });

  describe('getRedisClient', () => {
    it('returns a client instance', () => {
      const client = getRedisClient();
      expect(client).toBeDefined();
      expect(client.get).toBeDefined();
      expect(client.set).toBeDefined();
      expect(client.del).toBeDefined();
    });

    it('returns the same instance on multiple calls (singleton)', () => {
      const client1 = getRedisClient();
      const client2 = getRedisClient();

      expect(client1).toBe(client2);
    });
  });

  describe('Error handling', () => {
    it('handles cache failures gracefully', async () => {
      // This test would need mocking of the underlying client to simulate failures
      // For now, we test that the API doesn't throw

      const result = await cache.get('key');
      expect(result).toBeNull(); // Should return null, not throw
    });

    it('handles rate limit failures gracefully (fail open)', async () => {
      // If rate limiting fails, it should allow the request
      // This would need mocking to simulate failure

      const rateLimiter = new RateLimiter('test', 5, 60);
      const result = await rateLimiter.checkLimit('user1');

      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('resetTime');
    });
  });

  describe('Performance', () => {
    it('handles concurrent requests', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(cache.set(`key${i}`, `value${i}`));
      }

      await Promise.all(promises);

      const results = await Promise.all([
        cache.get('key0'),
        cache.get('key5'),
        cache.get('key9'),
      ]);

      expect(results).toEqual(['value0', 'value5', 'value9']);
    });

    it('handles rapid rate limit checks', async () => {
      const rateLimiter = new RateLimiter('concurrent-test', 100, 60);

      const promises = Array.from({ length: 50 }, (_, i) =>
        rateLimiter.checkLimit(`user${i % 10}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result).toHaveProperty('allowed');
        expect(result).toHaveProperty('remaining');
      });
    });
  });
});
